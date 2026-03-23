import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OptimizationResult, RoomType, StyleChip } from '../types/layout'

type StudioState = {
  prompt: string
  roomType: RoomType
  lengthM: number
  widthM: number
  budgetINR: number
  styles: StyleChip[]
  styleSliders: Record<StyleChip, number>
  isOptimizing: boolean
  lastResult?: OptimizationResult
  selectedLayoutId?: string

  setPrompt: (v: string) => void
  setRoomType: (v: RoomType) => void
  setDims: (l: number, w: number) => void
  setBudget: (v: number) => void
  toggleStyle: (s: StyleChip) => void
  setStyleSlider: (s: StyleChip, v: number) => void
  setOptimizing: (v: boolean) => void
  setResult: (r: OptimizationResult) => void
  selectLayout: (id: string) => void
  clearResult: () => void
}

const defaultStyleSliders: Record<StyleChip, number> = {
  Cozy: 0.5,
  Minimal: 0.5,
  Modern: 0.5,
  Luxury: 0.5,
  Compact: 0.5,
}

export const useStudioStore = create<StudioState>()(
  persist(
    (set) => ({
      prompt: 'A calm, functional space with clean lines and warm lighting.',
      roomType: 'Living Room',
      lengthM: 5,
      widthM: 4,
      budgetINR: 145000,
      styles: ['Modern'],
      styleSliders: defaultStyleSliders,
      isOptimizing: false,
      lastResult: undefined,
      selectedLayoutId: undefined,

      setPrompt: (v) => set({ prompt: v }),
      setRoomType: (v) => set({ roomType: v }),
      setDims: (l, w) => set({ lengthM: l, widthM: w }),
      setBudget: (v) => set({ budgetINR: v }),
      toggleStyle: (s) =>
        set((st) => {
          const has = st.styles.includes(s)
          return { styles: has ? st.styles.filter((x) => x !== s) : [...st.styles, s] }
        }),
      setStyleSlider: (s, v) => set((st) => ({ styleSliders: { ...st.styleSliders, [s]: v } })),
      setOptimizing: (v) => set({ isOptimizing: v }),
      setResult: (r) =>
        set({
          lastResult: r,
          selectedLayoutId: r.solutions[0]?.id,
          isOptimizing: false,
        }),
      selectLayout: (id) => set({ selectedLayoutId: id }),
      clearResult: () => set({ lastResult: undefined, selectedLayoutId: undefined }),
    }),
    {
      name: 'layoutmindx-studio',
      partialize: (s) => ({
        prompt: s.prompt,
        roomType: s.roomType,
        lengthM: s.lengthM,
        widthM: s.widthM,
        budgetINR: s.budgetINR,
        styles: s.styles,
        styleSliders: s.styleSliders,
        lastResult: s.lastResult,
        selectedLayoutId: s.selectedLayoutId,
      }),
      version: 1,
    },
  ),
)

export function getSelectedSolution() {
  const st = useStudioStore.getState()
  const id = st.selectedLayoutId
  return st.lastResult?.solutions.find((s) => s.id === id) ?? st.lastResult?.solutions[0]
}

