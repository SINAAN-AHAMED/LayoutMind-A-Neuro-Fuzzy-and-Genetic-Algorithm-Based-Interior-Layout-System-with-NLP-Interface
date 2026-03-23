import { cn } from '../../lib/cn'

export function Chip({
  label,
  selected,
  onClick,
}: {
  label: string
  selected?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1.5 text-xs font-medium border transition',
        selected
          ? 'border-violet-400/50 bg-violet-500/20 text-white shadow-[0_0_0_1px_rgba(140,120,255,0.20)]'
          : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/8 hover:border-white/20',
      )}
    >
      {label}
    </button>
  )
}

