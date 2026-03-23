export function Brand({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-500 shadow-glow" />
      <div className="leading-tight">
        <div className="text-white font-semibold tracking-tight">{compact ? 'LayoutMind X' : 'LayoutMind X — AI Interior Optimization Studio'}</div>
        {!compact && <div className="text-xs text-white/55">Soft Computing • GA + Fuzzy Logic • Real GLTF Interiors</div>}
      </div>
    </div>
  )
}

