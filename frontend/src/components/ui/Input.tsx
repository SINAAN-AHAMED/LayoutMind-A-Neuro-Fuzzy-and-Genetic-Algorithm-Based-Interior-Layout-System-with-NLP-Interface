import * as React from 'react'
import { cn } from '../../lib/cn'

type Props = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, Props>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-11 w-full rounded-xl bg-white/6 border border-white/10 px-3 text-sm text-white/90 placeholder:text-white/35 outline-none focus:ring-2 focus:ring-violet-400/35 focus:border-white/20',
        className,
      )}
      {...props}
    />
  )
})

