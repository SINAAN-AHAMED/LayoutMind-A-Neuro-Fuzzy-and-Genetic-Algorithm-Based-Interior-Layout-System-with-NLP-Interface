from __future__ import annotations

import math
import random
import time
import uuid
from dataclasses import dataclass
from typing import Dict, List, Literal, Tuple

import numpy as np
import skfuzzy as fuzz
from deap import algorithms, base, creator, tools
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

RoomType = Literal["Bedroom", "Living Room"]
StyleChip = Literal["Cozy", "Minimal", "Modern", "Luxury", "Compact"]
FurnitureType = Literal["sofa", "bed", "table", "chair", "wardrobe", "tvUnit"]


class OptimizeRequest(BaseModel):
    prompt: str = Field(min_length=4, max_length=600)
    roomType: RoomType
    lengthM: float = Field(ge=2.0, le=12.0)
    widthM: float = Field(ge=2.0, le=12.0)
    budgetINR: float = Field(ge=20000.0, le=1_000_000.0)
    styles: List[StyleChip] = Field(default_factory=list, max_length=5)
    styleSliders: Dict[StyleChip, float]


class EvolutionPoint(BaseModel):
    generation: int
    bestFitness: float
    avgFitness: float


class FurnitureItem(BaseModel):
    id: str
    type: FurnitureType
    x: float
    z: float
    y: float
    rotationY: float
    scale: float
    costINR: float


class Metrics(BaseModel):
    totalCostINR: float
    budgetINR: float
    budgetCompliancePct: float
    spaceUtilizationPct: float
    styleAlignmentPct: float
    clearanceScorePct: float
    comfortIndexPct: float
    fitness: float


class LayoutSolution(BaseModel):
    id: str
    rank: Literal[1, 2, 3]
    room: Dict[str, float | str]
    prompt: str
    selectedStyles: List[StyleChip]
    items: List[FurnitureItem]
    metrics: Metrics
    explanation: str


class OptimizeResponse(BaseModel):
    requestId: str
    generatedAtISO: str
    evolution: List[EvolutionPoint]
    solutions: List[LayoutSolution]


@dataclass(frozen=True)
class Spec:
    type: FurnitureType
    cost: float
    # footprint in meters (axis-aligned base, before rotation swap)
    w: float
    d: float
    # preferred wall bias: 0 center, 1 wall-hug
    wall_bias: float


CATALOG: Dict[FurnitureType, Spec] = {
    "sofa": Spec("sofa", 48000.0, 2.10, 0.95, 0.75),
    "bed": Spec("bed", 52000.0, 2.10, 1.60, 0.90),
    "table": Spec("table", 18000.0, 1.00, 1.00, 0.10),
    "chair": Spec("chair", 12000.0, 0.85, 0.85, 0.25),
    "wardrobe": Spec("wardrobe", 35000.0, 1.40, 0.60, 0.95),
    "tvUnit": Spec("tvUnit", 22000.0, 1.60, 0.45, 0.95),
}


def clamp(x: float, lo: float, hi: float) -> float:
    return float(max(lo, min(hi, x)))


def style_inputs(styles: List[StyleChip], sliders: Dict[StyleChip, float]) -> Dict[str, float]:
    # Combine chip selection (binary) with per-chip slider (0..1) into 0..1 raw intents.
    raw = {k: clamp(float(sliders.get(k, 0.5)), 0.0, 1.0) for k in ["Cozy", "Minimal", "Modern", "Luxury", "Compact"]}
    chosen = set(styles)
    for k in raw:
        if k in chosen:
            raw[k] = clamp(0.55 + 0.45 * raw[k], 0.0, 1.0)  # emphasize selected styles but still continuous
        else:
            raw[k] = clamp(0.15 + 0.35 * raw[k], 0.0, 1.0)  # unselected styles still contribute subtly

    warmth = raw["Cozy"]
    minimalism = raw["Minimal"]
    luxury = raw["Luxury"]
    compactness = raw["Compact"]
    openness = clamp(0.7 * (1.0 - compactness) + 0.3 * minimalism, 0.0, 1.0)
    modern = raw["Modern"]

    # modern subtly increases minimalism & openness
    minimalism = clamp(0.75 * minimalism + 0.25 * modern, 0.0, 1.0)
    openness = clamp(0.75 * openness + 0.25 * modern, 0.0, 1.0)

    return {
        "warmth": warmth,
        "minimalism": minimalism,
        "openness": openness,
        "luxury": luxury,
        "compactness": compactness,
    }


def fuzzy_profile(inp: Dict[str, float]) -> Dict[str, float]:
    """
    Fuzzy logic module:
    Inputs: warmth, minimalism, openness, luxury, compactness (0..1)
    Outputs (0..1): furniture_density, color_tone, openness_score, budget_sensitivity
    """
    x = np.linspace(0, 1, 101)

    def tri(a, b, c):
        return fuzz.trimf(x, [a, b, c])

    warmth = inp["warmth"]
    minimalism = inp["minimalism"]
    openness = inp["openness"]
    luxury = inp["luxury"]
    compactness = inp["compactness"]

    warm_low, warm_med, warm_high = tri(0, 0, 0.45), tri(0.15, 0.5, 0.85), tri(0.55, 1, 1)
    min_low, min_med, min_high = tri(0, 0, 0.5), tri(0.2, 0.5, 0.8), tri(0.55, 1, 1)
    open_low, open_med, open_high = tri(0, 0, 0.5), tri(0.2, 0.55, 0.9), tri(0.6, 1, 1)
    lux_low, lux_med, lux_high = tri(0, 0, 0.45), tri(0.15, 0.5, 0.85), tri(0.55, 1, 1)
    comp_low, comp_med, comp_high = tri(0, 0, 0.45), tri(0.15, 0.5, 0.85), tri(0.55, 1, 1)

    # Outputs
    dens_low, dens_med, dens_high = tri(0, 0, 0.45), tri(0.15, 0.5, 0.85), tri(0.55, 1, 1)
    tone_cool, tone_neutral, tone_warm = tri(0, 0, 0.45), tri(0.15, 0.5, 0.85), tri(0.55, 1, 1)
    open_out_low, open_out_med, open_out_high = tri(0, 0, 0.5), tri(0.2, 0.55, 0.9), tri(0.6, 1, 1)
    bud_low, bud_med, bud_high = tri(0, 0, 0.5), tri(0.2, 0.55, 0.9), tri(0.6, 1, 1)

    def interp(mf, v):
        return float(fuzz.interp_membership(x, mf, v))

    # Rule aggregation via max-min inference (Mamdani)
    dens_agg = np.zeros_like(x)
    tone_agg = np.zeros_like(x)
    open_agg = np.zeros_like(x)
    bud_agg = np.zeros_like(x)

    # Density rules
    r1 = min(interp(comp_high, compactness), interp(open_low, openness))
    dens_agg = np.fmax(dens_agg, np.fmin(r1, dens_high))

    r2 = min(interp(comp_med, compactness), interp(open_med, openness))
    dens_agg = np.fmax(dens_agg, np.fmin(r2, dens_med))

    r3 = min(interp(comp_low, compactness), interp(open_high, openness), interp(min_high, minimalism))
    dens_agg = np.fmax(dens_agg, np.fmin(r3, dens_low))

    r4 = min(interp(lux_high, luxury), interp(min_low, minimalism))
    dens_agg = np.fmax(dens_agg, np.fmin(r4, dens_med))

    # Tone rules (warmth + luxury → warmer, minimalism → cooler)
    r5 = min(interp(warm_high, warmth), interp(lux_med, luxury))
    tone_agg = np.fmax(tone_agg, np.fmin(r5, tone_warm))

    r6 = min(interp(min_high, minimalism), interp(warm_low, warmth))
    tone_agg = np.fmax(tone_agg, np.fmin(r6, tone_cool))

    r7 = min(interp(warm_med, warmth), interp(min_med, minimalism))
    tone_agg = np.fmax(tone_agg, np.fmin(r7, tone_neutral))

    # Openness output rules
    r8 = min(interp(open_high, openness), interp(comp_low, compactness))
    open_agg = np.fmax(open_agg, np.fmin(r8, open_out_high))

    r9 = min(interp(open_med, openness), interp(comp_med, compactness))
    open_agg = np.fmax(open_agg, np.fmin(r9, open_out_med))

    r10 = min(interp(open_low, openness), interp(comp_high, compactness))
    open_agg = np.fmax(open_agg, np.fmin(r10, open_out_low))

    # Budget sensitivity rules (compactness + luxury → higher sensitivity, minimalism → medium)
    r11 = min(interp(lux_high, luxury), interp(comp_high, compactness))
    bud_agg = np.fmax(bud_agg, np.fmin(r11, bud_high))

    r12 = min(interp(min_high, minimalism), interp(lux_low, luxury))
    bud_agg = np.fmax(bud_agg, np.fmin(r12, bud_med))

    r13 = min(interp(lux_low, luxury), interp(comp_low, compactness), interp(open_high, openness))
    bud_agg = np.fmax(bud_agg, np.fmin(r13, bud_low))

    # Defuzzify with safety: if an aggregate set has zero area, fall back to neutral 0.5
    def safe_defuzz(agg: np.ndarray) -> float:
        if np.allclose(agg, 0.0):
            return 0.5
        return float(fuzz.defuzz(x, agg, "centroid"))

    dens = safe_defuzz(dens_agg)
    tone = safe_defuzz(tone_agg)
    open_out = safe_defuzz(open_agg)
    bud = safe_defuzz(bud_agg)

    return {
        "furniture_density": clamp(dens, 0.0, 1.0),
        "color_tone": clamp(tone, 0.0, 1.0),
        "openness_score": clamp(open_out, 0.0, 1.0),
        "budget_sensitivity": clamp(bud, 0.0, 1.0),
    }


def choose_furniture(room_type: RoomType, density: float) -> List[FurnitureType]:
    # Base sets; density controls duplicates (chairs) and optional secondary pieces.
    if room_type == "Bedroom":
        base: List[FurnitureType] = ["bed", "wardrobe", "tvUnit", "table", "chair"]
    else:
        base = ["sofa", "tvUnit", "table", "chair", "wardrobe"]

    # Add chairs based on density (compact → more items)
    chairs = 1 + (1 if density > 0.55 else 0) + (1 if density > 0.78 else 0)
    items: List[FurnitureType] = [t for t in base if t != "chair"] + ["chair"] * chairs
    return items


def rect_dims(spec: Spec, rot: float, scale: float) -> Tuple[float, float]:
    # approximate rotation effect: swap width/depth if closer to 90 degrees
    r = rot % (math.pi * 2)
    k = (r / (math.pi / 2.0)) % 2.0
    swap = abs(k - 1.0) < 0.35
    w, d = (spec.d, spec.w) if swap else (spec.w, spec.d)
    return w * scale, d * scale


def overlap_area(a: Tuple[float, float, float, float], b: Tuple[float, float, float, float]) -> float:
    ax1, az1, ax2, az2 = a
    bx1, bz1, bx2, bz2 = b
    ix = max(0.0, min(ax2, bx2) - max(ax1, bx1))
    iz = max(0.0, min(az2, bz2) - max(az1, bz1))
    return ix * iz


def separation(a: Tuple[float, float, float, float], b: Tuple[float, float, float, float]) -> float:
    # axis-aligned minimum gap between rectangles (0 if overlapping)
    ax1, az1, ax2, az2 = a
    bx1, bz1, bx2, bz2 = b
    dx = max(0.0, max(bx1 - ax2, ax1 - bx2))
    dz = max(0.0, max(bz1 - az2, az1 - bz2))
    if dx == 0.0 and dz == 0.0:
        return 0.0
    return math.hypot(dx, dz)


def make_rect(x: float, z: float, w: float, d: float) -> Tuple[float, float, float, float]:
    return (x - w / 2.0, z - d / 2.0, x + w / 2.0, z + d / 2.0)


def wall_hug_score(x: float, z: float, room_w: float, room_l: float) -> float:
    # distance from nearest wall normalized (0 at wall, 1 at center)
    half_w = room_w / 2.0
    half_l = room_l / 2.0
    dist = min(half_w - abs(x), half_l - abs(z))
    max_dist = min(half_w, half_l)
    return 1.0 - clamp(dist / max_dist, 0.0, 1.0)


def compute_metrics(
    genome: List[float],
    items: List[FurnitureType],
    room_w: float,
    room_l: float,
    budget_inr: float,
    profile: Dict[str, float],
    clearance_m: float,
) -> Tuple[Dict[str, float], List[Dict]]:
    rects = []
    total_cost = 0.0
    total_area = 0.0
    boundary_viol = 0.0
    overlap = 0.0
    clearance_bad = 0.0

    # decode genome: per item [x, z, rot, scale]
    decoded = []
    for i, t in enumerate(items):
        spec = CATALOG[t]
        x = genome[i * 4 + 0]
        z = genome[i * 4 + 1]
        rot = genome[i * 4 + 2]
        scale = genome[i * 4 + 3]
        w, d = rect_dims(spec, rot, scale)
        r = make_rect(x, z, w, d)
        rects.append(r)
        total_cost += spec.cost
        total_area += w * d
        decoded.append({"type": t, "x": x, "z": z, "rot": rot, "scale": scale, "w": w, "d": d})

        # boundary with small wall padding
        pad = 0.05
        if r[0] < -room_w / 2 + pad:
            boundary_viol += (-room_w / 2 + pad) - r[0]
        if r[2] > room_w / 2 - pad:
            boundary_viol += r[2] - (room_w / 2 - pad)
        if r[1] < -room_l / 2 + pad:
            boundary_viol += (-room_l / 2 + pad) - r[1]
        if r[3] > room_l / 2 - pad:
            boundary_viol += r[3] - (room_l / 2 - pad)

    for i in range(len(rects)):
        for j in range(i + 1, len(rects)):
            o = overlap_area(rects[i], rects[j])
            overlap += o
            gap = separation(rects[i], rects[j])
            if gap < clearance_m:
                clearance_bad += (clearance_m - gap)

    room_area = room_w * room_l
    utilization = clamp((total_area / room_area) * 100.0, 0.0, 100.0)

    # budget compliance
    if total_cost <= budget_inr:
        budget_compliance = 100.0
        budget_over = 0.0
    else:
        budget_over = total_cost - budget_inr
        budget_compliance = clamp((budget_inr / total_cost) * 100.0, 0.0, 100.0)

    # clearance score: based on average violations; more violation => lower score
    clearance_norm = clearance_bad / max(1.0, len(rects) * (len(rects) - 1) / 2.0)
    clearance_score = clamp(100.0 * math.exp(-2.2 * clearance_norm), 0.0, 100.0)

    # comfort index: mix openness preference with clearance
    comfort = clamp(0.55 * clearance_score + 45.0 * profile["openness_score"], 0.0, 100.0)

    # style alignment: compare realized density + wall-hug with fuzzy expectations
    realized_density = clamp(total_area / room_area, 0.0, 1.0)
    density_target = clamp(0.55 * profile["furniture_density"] + 0.15, 0.12, 0.78)
    density_alignment = math.exp(-((realized_density - density_target) ** 2) / 0.025)

    # wall hugging for wall-biased furniture
    wh = 0.0
    wh_w = 1e-6
    for d in decoded:
        b = CATALOG[d["type"]].wall_bias
        wh += b * wall_hug_score(d["x"], d["z"], room_w, room_l)
        wh_w += b
    wh = wh / wh_w
    # if openness is high, penalize too much wall-hugging (should breathe)
    desired_wh = clamp(0.85 - 0.55 * profile["openness_score"], 0.25, 0.9)
    wh_alignment = math.exp(-((wh - desired_wh) ** 2) / 0.03)

    style_alignment = clamp(100.0 * (0.65 * density_alignment + 0.35 * wh_alignment), 0.0, 100.0)

    # Weighted fitness (higher is better); penalties are subtracted after scaling.
    boundary_pen = 22.0 * boundary_viol
    overlap_pen = 260.0 * overlap
    clearance_pen = 28.0 * clearance_bad
    budget_pen = (budget_over / max(1.0, budget_inr)) * (110.0 + 160.0 * profile["budget_sensitivity"])

    fitness = (
        0.32 * style_alignment
        + 0.20 * utilization
        + 0.26 * clearance_score
        + 0.22 * budget_compliance
        - boundary_pen
        - overlap_pen
        - clearance_pen
        - budget_pen
    )

    metrics = {
        "totalCostINR": float(total_cost),
        "budgetINR": float(budget_inr),
        "budgetCompliancePct": float(budget_compliance),
        "spaceUtilizationPct": float(utilization),
        "styleAlignmentPct": float(style_alignment),
        "clearanceScorePct": float(clearance_score),
        "comfortIndexPct": float(comfort),
        "fitness": float(fitness / 100.0),  # normalized-ish for UI
    }
    return metrics, decoded


def build_explanation(metrics: Dict[str, float], profile: Dict[str, float]) -> str:
    parts = []
    parts.append(
        f"Selected for strong constraint satisfaction: clearance {metrics['clearanceScorePct']:.0f}% and budget compliance {metrics['budgetCompliancePct']:.0f}%."
    )
    parts.append(
        f"Style alignment {metrics['styleAlignmentPct']:.0f}% reflects the fuzzy profile: openness {profile['openness_score']:.2f}, density {profile['furniture_density']:.2f}, budget sensitivity {profile['budget_sensitivity']:.2f}."
    )
    parts.append(
        f"Space utilization {metrics['spaceUtilizationPct']:.0f}% balances circulation (≥0.8m) with practical furniture placement."
    )
    return " ".join(parts)


def optimize(req: OptimizeRequest) -> OptimizeResponse:
    # Seed for repeatability per request
    request_id = str(uuid.uuid4())
    seed = int(uuid.UUID(request_id)) % (2**32 - 1)
    rnd = random.Random(seed)

    inp = style_inputs(req.styles, req.styleSliders)
    profile = fuzzy_profile(inp)
    items = choose_furniture(req.roomType, profile["furniture_density"])

    room_w = float(req.widthM)
    room_l = float(req.lengthM)
    clearance_m = 0.80

    # DEAP setup
    creator_name = f"FitnessMax_{request_id[:8]}"
    if not hasattr(creator, "FitnessMax"):
        creator.create("FitnessMax", base.Fitness, weights=(1.0,))
    if not hasattr(creator, "Individual"):
        creator.create("Individual", list, fitness=creator.FitnessMax)

    toolbox = base.Toolbox()

    def rand_pos(max_w: float, max_l: float, wallish: float) -> Tuple[float, float]:
        # mix between center-biased and wall-biased sampling
        half_w = max_w / 2.0
        half_l = max_l / 2.0
        if rnd.random() < wallish:
            # near wall
            side = rnd.choice(["left", "right", "front", "back"])
            if side in ("left", "right"):
                x = (half_w - 0.25) * (1 if side == "right" else -1)
                z = rnd.uniform(-half_l + 0.4, half_l - 0.4)
            else:
                z = (half_l - 0.25) * (1 if side == "front" else -1)
                x = rnd.uniform(-half_w + 0.4, half_w - 0.4)
        else:
            x = rnd.uniform(-half_w + 0.6, half_w - 0.6)
            z = rnd.uniform(-half_l + 0.6, half_l - 0.6)
        return x, z

    def init_individual():
        genes: List[float] = []
        for t in items:
            spec = CATALOG[t]
            x, z = rand_pos(room_w, room_l, spec.wall_bias * 0.8)
            rot = rnd.choice([0.0, math.pi / 2.0, math.pi, 3 * math.pi / 2.0]) + rnd.uniform(-0.12, 0.12)
            scale = rnd.uniform(0.90, 1.10)
            genes.extend([x, z, rot, scale])
        return creator.Individual(genes)

    toolbox.register("individual", init_individual)
    toolbox.register("population", tools.initRepeat, list, toolbox.individual)

    def evaluate(individual):
        m, _ = compute_metrics(individual, items, room_w, room_l, float(req.budgetINR), profile, clearance_m)
        return (m["fitness"],)

    toolbox.register("evaluate", evaluate)
    toolbox.register("select", tools.selTournament, tournsize=3)

    def mate(a, b):
        # Blend positions/scales, swap rotations
        for i in range(0, len(a), 4):
            if rnd.random() < 0.55:
                a[i], b[i] = b[i], a[i]
            if rnd.random() < 0.55:
                a[i + 1], b[i + 1] = b[i + 1], a[i + 1]
            if rnd.random() < 0.35:
                a[i + 2], b[i + 2] = b[i + 2], a[i + 2]
            if rnd.random() < 0.45:
                alpha = 0.35
                x = a[i + 3]
                y = b[i + 3]
                lo = min(x, y) - alpha * abs(x - y)
                hi = max(x, y) + alpha * abs(x - y)
                a[i + 3] = rnd.uniform(lo, hi)
                b[i + 3] = rnd.uniform(lo, hi)
        return a, b

    toolbox.register("mate", mate)

    def mutate(individual):
        half_w = room_w / 2.0
        half_l = room_l / 2.0
        for i, t in enumerate(items):
            base = i * 4
            spec = CATALOG[t]
            if rnd.random() < 0.35:
                individual[base + 0] += rnd.gauss(0, 0.28)
            if rnd.random() < 0.35:
                individual[base + 1] += rnd.gauss(0, 0.28)
            if rnd.random() < 0.22:
                individual[base + 2] += rnd.gauss(0, 0.22)
            if rnd.random() < 0.25:
                individual[base + 3] += rnd.gauss(0, 0.05)

            individual[base + 0] = clamp(individual[base + 0], -half_w + 0.4, half_w - 0.4)
            individual[base + 1] = clamp(individual[base + 1], -half_l + 0.4, half_l - 0.4)
            individual[base + 2] = float(individual[base + 2] % (2 * math.pi))
            individual[base + 3] = clamp(individual[base + 3], 0.85, 1.20)

            # encourage wall bias items to drift toward walls
            if rnd.random() < 0.18 and spec.wall_bias > 0.8:
                toward = rnd.choice(["x", "z"])
                if toward == "x":
                    individual[base + 0] = (half_w - 0.25) * (1 if rnd.random() > 0.5 else -1)
                else:
                    individual[base + 1] = (half_l - 0.25) * (1 if rnd.random() > 0.5 else -1)
        return (individual,)

    toolbox.register("mutate", mutate)

    pop = toolbox.population(n=84)
    hof = tools.HallOfFame(8)
    stats = tools.Statistics(lambda ind: ind.fitness.values[0])
    stats.register("avg", np.mean)
    stats.register("max", np.max)

    evolution: List[EvolutionPoint] = []

    # Evaluate initial pop
    invalid = [i for i in pop if not i.fitness.valid]
    fits = list(map(toolbox.evaluate, invalid))
    for ind, fit in zip(invalid, fits):
        ind.fitness.values = fit

    ngen = 40
    cxpb = 0.55
    mutpb = 0.40

    for gen in range(ngen):
        pop = algorithms.varAnd(pop, toolbox, cxpb=cxpb, mutpb=mutpb)
        invalid = [i for i in pop if not i.fitness.valid]
        fits = list(map(toolbox.evaluate, invalid))
        for ind, fit in zip(invalid, fits):
            ind.fitness.values = fit
        hof.update(pop)

        record = stats.compile(pop)
        evolution.append(
            EvolutionPoint(generation=gen, bestFitness=float(record["max"]), avgFitness=float(record["avg"]))
        )

        pop = toolbox.select(pop, k=len(pop))

    top_inds = tools.selBest(list(hof), k=3)
    solutions: List[LayoutSolution] = []

    for idx, ind in enumerate(top_inds):
        metrics, decoded = compute_metrics(ind, items, room_w, room_l, float(req.budgetINR), profile, clearance_m)
        sol_items: List[FurnitureItem] = []
        for j, d in enumerate(decoded):
            t = d["type"]
            sol_items.append(
                FurnitureItem(
                    id=f"{t}-{j}",
                    type=t,
                    x=float(d["x"]),
                    z=float(d["z"]),
                    y=0.0,
                    rotationY=float(d["rot"]),
                    scale=float(d["scale"]),
                    costINR=float(CATALOG[t].cost),
                )
            )

        solutions.append(
            LayoutSolution(
                id=str(uuid.uuid4()),
                rank=1 if idx == 0 else (2 if idx == 1 else 3),
                room={"lengthM": float(req.lengthM), "widthM": float(req.widthM), "type": req.roomType},
                prompt=req.prompt,
                selectedStyles=req.styles,
                items=sol_items,
                metrics=Metrics(**metrics),
                explanation=build_explanation(metrics, profile),
            )
        )

    # Sort by computed fitness descending (safety)
    solutions.sort(key=lambda s: s.metrics.fitness, reverse=True)
    for i, s in enumerate(solutions):
        s.rank = 1 if i == 0 else (2 if i == 1 else 3)  # type: ignore[misc]

    return OptimizeResponse(
        requestId=request_id,
        generatedAtISO=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        evolution=evolution,
        solutions=solutions,
    )


app = FastAPI(title="LayoutMind X Soft Computing Engine", version="1.0.0")


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/optimize", response_model=OptimizeResponse)
def optimize_endpoint(req: OptimizeRequest):
    try:
        return optimize(req)
    except Exception as exc:  # pragma: no cover - safety net
        # Log full traceback to server console for debugging
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(exc))

