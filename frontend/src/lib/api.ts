import { z } from 'zod'
import type { OptimizationResult, RoomType, StyleChip } from '../types/layout'

const OptimizeResponseSchema = z.object({
  requestId: z.string(),
  generatedAtISO: z.string(),
  evolution: z.array(
    z.object({
      generation: z.number(),
      bestFitness: z.number(),
      avgFitness: z.number(),
    }),
  ),
  solutions: z.array(
    z.object({
      id: z.string(),
      rank: z.union([z.literal(1), z.literal(2), z.literal(3)]),
      room: z.object({
        lengthM: z.number(),
        widthM: z.number(),
        type: z.union([z.literal('Bedroom'), z.literal('Living Room')]),
      }),
      prompt: z.string(),
      selectedStyles: z.array(
        z.union([z.literal('Cozy'), z.literal('Minimal'), z.literal('Modern'), z.literal('Luxury'), z.literal('Compact')]),
      ),
      items: z.array(
        z.object({
          id: z.string(),
          type: z.union([
            z.literal('sofa'),
            z.literal('bed'),
            z.literal('table'),
            z.literal('chair'),
            z.literal('wardrobe'),
            z.literal('tvUnit'),
          ]),
          x: z.number(),
          z: z.number(),
          y: z.number(),
          rotationY: z.number(),
          scale: z.number(),
          costINR: z.number(),
        }),
      ),
      metrics: z.object({
        totalCostINR: z.number(),
        budgetINR: z.number(),
        budgetCompliancePct: z.number(),
        spaceUtilizationPct: z.number(),
        styleAlignmentPct: z.number(),
        clearanceScorePct: z.number(),
        comfortIndexPct: z.number(),
        fitness: z.number(),
      }),
      explanation: z.string(),
    }),
  ),
})

export type OptimizeRequest = {
  prompt: string
  roomType: RoomType
  lengthM: number
  widthM: number
  budgetINR: number
  styles: StyleChip[]
  styleSliders: Record<StyleChip, number>
}

export async function optimizeLayout(req: OptimizeRequest): Promise<OptimizationResult> {
  const res = await fetch('/api/optimize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`Optimize failed (${res.status}): ${t || res.statusText}`)
  }
  const json = await res.json()
  return OptimizeResponseSchema.parse(json) as OptimizationResult
}

