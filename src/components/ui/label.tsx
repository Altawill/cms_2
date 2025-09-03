import React from 'react'
import { clsx } from 'clsx'

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  className?: string
  children: React.ReactNode
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={clsx(
          'text-sm font-medium leading-none',
          'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          className
        )}
        {...props}
      >
        {children}
      </label>
    )
  }
)

Label.displayName = "Label"
