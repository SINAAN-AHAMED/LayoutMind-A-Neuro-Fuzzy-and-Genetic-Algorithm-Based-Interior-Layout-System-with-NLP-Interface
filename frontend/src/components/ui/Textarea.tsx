import * as React from 'react'
import { cn } from '../../lib/cn'

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = React.forwardRef<HTMLTextAreaElement, Props>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'min-h-28 w-full resize-none rounded-xl bg-white/6 border border-white/10 px-3 py-2 text-sm text-white/90 placeholder:text-white/35 outline-none focus:ring-2 focus:ring-violet-400/35 focus:border-white/20',
        className,
      )}
      {...props}
    />
  )
})

