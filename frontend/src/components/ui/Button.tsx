import * as React from 'react'
import { cn } from '../../lib/cn'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ className, variant = 'primary', size = 'md', ...props }: Props) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition focus:outline-none focus:ring-2 focus:ring-violet-400/40 disabled:opacity-60 disabled:cursor-not-allowed',
        size === 'sm' && 'h-9 px-3 text-sm',
        size === 'md' && 'h-10 px-4 text-sm',
        size === 'lg' && 'h-12 px-5 text-base',
        variant === 'primary' &&
          'bg-gradient-to-r from-violet-500/90 via-indigo-500/90 to-cyan-500/80 text-white shadow-glow hover:brightness-110',
        variant === 'secondary' &&
          'glass text-white/90 hover:border-white/20 hover:bg-white/10 border border-white/10',
        variant === 'ghost' && 'text-white/80 hover:bg-white/8 border border-transparent',
        className,
      )}
      {...props}
    />
  )
}

