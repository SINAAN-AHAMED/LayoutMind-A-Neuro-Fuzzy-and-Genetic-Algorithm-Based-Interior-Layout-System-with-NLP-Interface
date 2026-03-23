import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Brand } from '../components/Brand'
import { Button } from '../components/ui/Button'
import { Chip } from '../components/ui/Chip'
import { Input } from '../components/ui/Input'
import { Slider } from '../components/ui/Slider'
import { Textarea } from '../components/ui/Textarea'
import { formatINR } from '../lib/inr'
import { optimizeLayout } from '../lib/api'
import { useStudioStore } from '../store/useStudioStore'
import type { LayoutSolution, StyleChip } from '../types/layout'
import { InteriorCanvas } from '../three/InteriorCanvas'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'

const styleChips: StyleChip[] = ['Cozy', 'Minimal', 'Modern', 'Luxury', 'Compact']

function ProgressBar({ label, valuePct }: { label: string; valuePct: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-white/60">
        <div>{label}</div>
        <div className="tabular-nums text-white/75">{valuePct.toFixed(0)}%</div>
      </div>
      <div className="mt-2 h-2 rounded-full bg-white/8 border border-white/10 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-500/80 via-indigo-500/70 to-cyan-500/70"
          style={{ width: `${Math.max(0, Math.min(100, valuePct))}%` }}
        />
      </div>
    </div>
  )
}

function LayoutCard({ sol, selected, onClick }: { sol: LayoutSolution; selected: boolean; onClick: () => void }) {
  const best = sol.rank === 1
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'text-left glass rounded-2xl p-4 border transition w-full',
        selected ? 'border-violet-400/55 shadow-glow' : 'border-white/10 hover:border-white/20 hover:bg-white/6',
      ].join(' ')}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-white/90">
          Layout #{sol.rank} {best ? <span className="text-xs text-violet-300">(Best)</span> : null}
        </div>
        <div className="text-xs text-white/55 tabular-nums">Fitness {sol.metrics.fitness.toFixed(3)}</div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-white/55">
        <div>
          <div className="text-white/40">Cost</div>
          <div className="text-white/80">{formatINR(sol.metrics.totalCostINR)}</div>
        </div>
        <div>
          <div className="text-white/40">Style</div>
          <div className="text-white/80">{sol.metrics.styleAlignmentPct.toFixed(0)}%</div>
        </div>
        <div>
          <div className="text-white/40">Clearance</div>
          <div className="text-white/80">{sol.metrics.clearanceScorePct.toFixed(0)}%</div>
        </div>
      </div>
    </button>
  )
}

export function WorkspacePage() {
  const nav = useNavigate()
  const st = useStudioStore()
  const [showInsights, setShowInsights] = useState(true)

  const result = st.lastResult
  const selected = useMemo(() => {
    const id = st.selectedLayoutId
    return result?.solutions.find((s) => s.id === id) ?? result?.solutions[0]
  }, [result, st.selectedLayoutId])

  if (!result || !selected) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-12">
        <div className="glass rounded-3xl p-6">
          <Brand />
          <div className="mt-6 text-white/70">No optimization result loaded yet.</div>
          <div className="mt-5">
            <Button onClick={() => nav('/')} variant="secondary">
              Go to Prompt Studio
            </Button>
          </div>
        </div>
      </div>
    )
  }

  async function onRegenerate() {
    st.setOptimizing(true)
    try {
      const next = await optimizeLayout({
        prompt: st.prompt,
        roomType: st.roomType,
        lengthM: st.lengthM,
        widthM: st.widthM,
        budgetINR: st.budgetINR,
        styles: st.styles,
        styleSliders: st.styleSliders,
      })
      st.setResult(next)
    } catch (e: any) {
      st.setOptimizing(false)
      alert(e?.message ?? 'Optimization failed')
    }
  }

  const radar = useMemo(
    () => [
      { metric: 'Style Alignment', value: selected.metrics.styleAlignmentPct },
      { metric: 'Budget Fit', value: selected.metrics.budgetCompliancePct },
      { metric: 'Space Utilization', value: selected.metrics.spaceUtilizationPct },
      { metric: 'Comfort', value: selected.metrics.comfortIndexPct },
      { metric: 'Clearance', value: selected.metrics.clearanceScorePct },
    ],
    [selected.metrics],
  )

  return (
    <div className="min-h-full">
      <div className="px-4 py-4 md:px-6 md:py-6">
        <div className="flex items-center justify-between gap-4">
          <Brand compact />
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => nav('/')}>
              Prompt Studio
            </Button>
            <Button onClick={onRegenerate} disabled={st.isOptimizing}>
              Regenerate
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[360px_1fr_360px] gap-4 items-stretch">
          {/* Left panel */}
          <div className="glass rounded-3xl p-4 md:p-5">
            <div className="text-sm font-semibold text-white/90">Prompt + Controls</div>
            <div className="mt-3">
              <Textarea value={st.prompt} onChange={(e) => st.setPrompt(e.target.value)} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-white/55 mb-1">Length (m)</div>
                <Input
                  type="number"
                  min={2}
                  max={12}
                  step={0.1}
                  value={st.lengthM}
                  onChange={(e) => st.setDims(Number(e.target.value), st.widthM)}
                />
              </div>
              <div>
                <div className="text-xs text-white/55 mb-1">Width (m)</div>
                <Input
                  type="number"
                  min={2}
                  max={12}
                  step={0.1}
                  value={st.widthM}
                  onChange={(e) => st.setDims(st.lengthM, Number(e.target.value))}
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-white/55 mb-2">
                <div>Budget</div>
                <div className="text-white/80 tabular-nums">{formatINR(st.budgetINR)}</div>
              </div>
              <Slider value={st.budgetINR} onChange={(v) => st.setBudget(v)} min={20000} max={300000} step={1000} />
            </div>

            <div className="mt-4">
              <div className="text-xs text-white/55 mb-2">Style chips</div>
              <div className="flex flex-wrap gap-2">
                {styleChips.map((s) => (
                  <Chip key={s} label={s} selected={st.styles.includes(s)} onClick={() => st.toggleStyle(s)} />
                ))}
              </div>
            </div>

            <div className="mt-4">
              <div className="text-xs text-white/55 mb-2">Style fine-tuning</div>
              <div className="grid gap-3">
                {styleChips.map((s) => (
                  <div key={s}>
                    <div className="flex items-center justify-between text-xs text-white/60">
                      <div>{s}</div>
                      <div className="tabular-nums text-white/75">{Math.round(st.styleSliders[s] * 100)}%</div>
                    </div>
                    <Slider value={st.styleSliders[s]} onChange={(v) => st.setStyleSlider(s, v)} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center canvas */}
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="glass rounded-3xl overflow-hidden min-h-[520px]"
          >
            <InteriorCanvas solution={selected} />
          </motion.div>

          {/* Right panel */}
          <div className="glass rounded-3xl p-4 md:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-white/90">Metrics</div>
              <div className="text-xs text-white/55 tabular-nums">Overall fitness {selected.metrics.fitness.toFixed(3)}</div>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-white/50">Budget usage</div>
                <div className="mt-1 flex items-baseline justify-between">
                  <div className="text-lg font-semibold text-white/90">{formatINR(selected.metrics.totalCostINR)}</div>
                  <div className="text-xs text-white/55">of {formatINR(selected.metrics.budgetINR)}</div>
                </div>
                <div className="mt-3">
                  <ProgressBar label="Budget compliance" valuePct={selected.metrics.budgetCompliancePct} />
                </div>
              </div>

              <div className="grid gap-3">
                <ProgressBar label="Style match" valuePct={selected.metrics.styleAlignmentPct} />
                <ProgressBar label="Space utilization" valuePct={selected.metrics.spaceUtilizationPct} />
                <ProgressBar label="Clearance score" valuePct={selected.metrics.clearanceScorePct} />
                <ProgressBar label="Comfort index" valuePct={selected.metrics.comfortIndexPct} />
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-white/50">AI Explanation</div>
                <div className="mt-2 text-sm leading-relaxed text-white/75">{selected.explanation}</div>
              </div>
            </div>

            <div className="mt-4">
              <Button variant="secondary" className="w-full" onClick={() => setShowInsights((v) => !v)}>
                {showInsights ? 'Hide' : 'Show'} GA insights
              </Button>
            </div>

            <AnimatePresence initial={false}>
              {showInsights && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 grid gap-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <div className="text-xs text-white/50 mb-2">GA Evolution (fitness vs generations)</div>
                      <div className="h-40 min-w-0 min-h-0">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                          <LineChart data={result.evolution}>
                            <XAxis dataKey="generation" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 11 }} />
                            <YAxis tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 11 }} />
                            <Tooltip
                              contentStyle={{ background: 'rgba(10,10,20,0.92)', border: '1px solid rgba(255,255,255,0.12)' }}
                              labelStyle={{ color: 'rgba(255,255,255,0.65)' }}
                            />
                            <Line
                              type="monotone"
                              dataKey="bestFitness"
                              stroke="#a78bfa"
                              strokeWidth={2}
                              dot={false}
                              isAnimationActive={false}
                            />
                            <Line
                              type="monotone"
                              dataKey="avgFitness"
                              stroke="#22d3ee"
                              strokeWidth={2}
                              dot={false}
                              opacity={0.7}
                              isAnimationActive={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <div className="text-xs text-white/50 mb-2">Radar: Layout profile</div>
                      <div className="h-40 min-w-0 min-h-0">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                          <RadarChart data={radar}>
                            <PolarGrid stroke="rgba(255,255,255,0.10)" />
                            <PolarAngleAxis dataKey="metric" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 10 }} />
                            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar
                              dataKey="value"
                              stroke="#a78bfa"
                              fill="rgba(167,139,250,0.28)"
                              fillOpacity={1}
                              isAnimationActive={false}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom comparison cards */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {result.solutions.map((sol) => (
            <LayoutCard
              key={sol.id}
              sol={sol}
              selected={sol.id === selected.id}
              onClick={() => st.selectLayout(sol.id)}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {st.isOptimizing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="glass w-[min(560px,92vw)] rounded-3xl p-6"
            >
              <div className="text-sm text-white/60">Optimizing Layout via Soft Computing Engine…</div>
              <div className="mt-2 text-xl font-semibold tracking-tight">Evolving placements, clearance, and budget fit</div>
              <div className="mt-5 h-2 w-full rounded-full bg-white/8 overflow-hidden border border-white/10">
                <motion.div
                  className="h-full w-1/2 bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-500"
                  initial={{ x: '-80%' }}
                  animate={{ x: '180%' }}
                  transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
                />
              </div>
              <div className="mt-4 text-xs text-white/45">
                GA: 40 generations • Constraints: walls + overlaps + 0.8m circulation
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

