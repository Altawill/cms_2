import React from 'react'
import { clsx } from 'clsx'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        className={clsx(
          'flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm',
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

Input.displayName = "Input"
