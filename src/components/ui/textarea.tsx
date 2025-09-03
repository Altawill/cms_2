import React from 'react'
import { clsx } from 'clsx'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={clsx(
          'flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm',
          'placeholder:text-slate-500',
          'focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Textarea.displayName = "Textarea"
