import React from 'react'
import { clsx } from 'clsx'

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  children?: React.ReactNode
}

interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  max?: number
  className?: string
  children: React.ReactNode
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
  xl: 'w-12 h-12 text-lg',
}

export function Avatar({ 
  src, 
  alt, 
  size = 'md',
  className,
  children,
  ...props 
}: AvatarProps) {
  return (
    <div
      className={clsx(
        'relative inline-flex items-center justify-center rounded-full bg-gray-100 font-medium text-gray-600 overflow-hidden',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
        />
      ) : (
        children
      )}
    </div>
  )
}

export function AvatarGroup({ 
  max = 4, 
  className,
  children,
  ...props 
}: AvatarGroupProps) {
  const childrenArray = React.Children.toArray(children)
  const visibleChildren = childrenArray.slice(0, max)
  const hiddenCount = childrenArray.length - max

  return (
    <div
      className={clsx('flex items-center -space-x-2', className)}
      {...props}
    >
      {visibleChildren.map((child, index) => (
        <div key={index} className="ring-2 ring-white rounded-full">
          {child}
        </div>
      ))}
      {hiddenCount > 0 && (
        <Avatar size="md" className="bg-gray-200 text-gray-500 ring-2 ring-white">
          +{hiddenCount}
        </Avatar>
      )}
    </div>
  )
}
