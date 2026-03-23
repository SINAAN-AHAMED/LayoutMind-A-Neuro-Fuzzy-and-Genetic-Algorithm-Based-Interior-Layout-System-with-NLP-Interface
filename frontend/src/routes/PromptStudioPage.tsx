import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Brand } from '../components/Brand'
import { Button } from '../components/ui/Button'
import { Chip } from '../components/ui/Chip'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { BackgroundOrb } from '../three/BackgroundOrb'
import { formatINR } from '../lib/inr'
import { optimizeLayout } from '../lib/api'
import { useStudioStore } from '../store/useStudioStore'
import type { StyleChip } from '../types/layout'

const styleChips: StyleChip[] = ['Cozy', 'Minimal', 'Modern', 'Luxury', 'Compact']

export function PromptStudioPage() {
  const nav = useNavigate()
  const st = useStudioStore()

  const subtitle = useMemo(() => {
    const area = st.lengthM * st.widthM
    return `${st.roomType} • ${st.lengthM.toFixed(1)}m × ${st.widthM.toFixed(1)}m • ${area.toFixed(1)} m² • Budget ${formatINR(st.budgetINR)}`
  }, [st.budgetINR, st.lengthM, st.roomType, st.widthM])

  async function onGenerate() {
    st.setOptimizing(true)
    try {
      const result = await optimizeLayout({
        prompt: st.prompt,
        roomType: st.roomType,
        lengthM: st.lengthM,
        widthM: st.widthM,
        budgetINR: st.budgetINR,
        styles: st.styles,
        styleSliders: st.styleSliders,
      })
      st.setResult(result)
      nav('/workspace')
    } catch (e: any) {
      st.setOptimizing(false)
      alert(e?.message ?? 'Optimization failed')
    }
  }

  return (
    <div className="relative min-h-full overflow-hidden">
      <BackgroundOrb />
      <div className="mx-auto max-w-5xl px-5 py-10 md:py-16">
        <motion.div initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
          <Brand />
        </motion.div>

        <motion.div
          initial={{ y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.08, duration: 0.55 }}
          className="mt-10 md:mt-14"
        >
          <div className="glass rounded-3xl p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-white/55">{subtitle}</div>
                <div className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight text-white">
                  Describe the vibe. We’ll optimize the interior.
                </div>
                <div className="mt-2 text-sm text-white/60">
                  Real GLTF furniture • PBR lighting • Fuzzy logic → Genetic algorithm evolution
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              <Textarea
                value={st.prompt}
                onChange={(e) => st.setPrompt(e.target.value)}
                placeholder="Example: A modern living room with calm lighting, wide circulation, and a cozy lounge corner."
              />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-1">
                  <div className="text-xs text-white/55 mb-2">Room type</div>
                  <div className="flex gap-2">
                    <Chip label="Living Room" selected={st.roomType === 'Living Room'} onClick={() => st.setRoomType('Living Room')} />
                    <Chip label="Bedroom" selected={st.roomType === 'Bedroom'} onClick={() => st.setRoomType('Bedroom')} />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs text-white/55 mb-2">Room dimensions (meters)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      min={2}
                      max={12}
                      step={0.1}
                      value={st.lengthM}
                      onChange={(e) => st.setDims(Number(e.target.value), st.widthM)}
                      placeholder="Length (m)"
                    />
                    <Input
                      type="number"
                      min={2}
                      max={12}
                      step={0.1}
                      value={st.widthM}
                      onChange={(e) => st.setDims(st.lengthM, Number(e.target.value))}
                      placeholder="Width (m)"
                    />
                  </div>
                </div>
                <div className="md:col-span-1">
                  <div className="text-xs text-white/55 mb-2">Budget (₹)</div>
                  <Input
                    type="number"
                    min={20000}
                    step={1000}
                    value={st.budgetINR}
                    onChange={(e) => st.setBudget(Number(e.target.value))}
                    placeholder="Budget in INR"
                  />
                </div>
              </div>

              <div>
                <div className="text-xs text-white/55 mb-2">Style</div>
                <div className="flex flex-wrap gap-2">
                  {styleChips.map((s) => (
                    <Chip key={s} label={s} selected={st.styles.includes(s)} onClick={() => st.toggleStyle(s)} />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <div className="text-sm text-white/55">
                  Generates <span className="text-white/80 font-medium">Top 3</span> layouts with metrics + GA evolution
                </div>
                <Button onClick={onGenerate} size="lg" disabled={st.isOptimizing}>
                  Generate
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
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
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
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

