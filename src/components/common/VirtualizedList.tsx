import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { cn } from '../../utils'

interface VirtualizedListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number, isVisible: boolean) => React.ReactNode
  getItemId: (item: T, index: number) => string
  overscan?: number
  className?: string
  onScroll?: (scrollTop: number) => void
  loading?: boolean
  loadingComponent?: React.ReactNode
  emptyComponent?: React.ReactNode
}

interface VisibleRange {
  start: number
  end: number
}

export default function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  getItemId,
  overscan = 5,
  className,
  onScroll,
  loading = false,
  loadingComponent,
  emptyComponent
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const scrollElementRef = useRef<HTMLDivElement>(null)
  
  // Calculate visible range with overscan
  const visibleRange: VisibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const end = Math.min(items.length - 1, start + visibleCount + overscan)
    
    return { start, end }
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan])

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1).map((item, index) => ({
      item,
      index: visibleRange.start + index,
      id: getItemId(item, visibleRange.start + index)
    }))
  }, [items, visibleRange, getItemId])

  // Handle scroll with throttling
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop
    setScrollTop(newScrollTop)
    onScroll?.(newScrollTop)
  }, [onScroll])

  // Auto-scroll to top when items change significantly
  useEffect(() => {
    if (scrollElementRef.current && items.length === 0) {
      scrollElementRef.current.scrollTop = 0
      setScrollTop(0)
    }
  }, [items.length])

  // Scroll to specific item
  const scrollToItem = useCallback((index: number) => {
    if (scrollElementRef.current) {
      const targetScrollTop = index * itemHeight
      scrollElementRef.current.scrollTop = targetScrollTop
      setScrollTop(targetScrollTop)
    }
  }, [itemHeight])

  // Expose scroll method via ref
  React.useImperativeHandle(scrollElementRef, () => ({
    scrollToItem,
    scrollToTop: () => scrollToItem(0),
    scrollToBottom: () => scrollToItem(items.length - 1)
  }), [scrollToItem, items.length])

  const totalHeight = items.length * itemHeight
  const offsetY = visibleRange.start * itemHeight

  if (loading) {
    return (
      <div 
        className={cn('flex items-center justify-center', className)}
        style={{ height: containerHeight }}
      >
        {loadingComponent || (
          <div className="flex items-center space-x-2 text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Loading...</span>
          </div>
        )}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div 
        className={cn('flex items-center justify-center', className)}
        style={{ height: containerHeight }}
      >
        {emptyComponent || (
          <div className="text-center text-muted-foreground">
            <p>No items to display</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      ref={scrollElementRef}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* Virtual container with total height */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items container */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map(({ item, index, id }) => {
            const isVisible = index >= visibleRange.start && index <= visibleRange.end
            
            return (
              <div
                key={id}
                style={{ height: itemHeight }}
                className="w-full"
              >
                {renderItem(item, index, isVisible)}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Hook for virtualized list state management
export function useVirtualizedList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0)
  
  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - 5)
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const end = Math.min(items.length - 1, start + visibleCount + 5)
    
    return { start, end }
  }, [scrollTop, itemHeight, containerHeight, items.length])
  
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1)
  }, [items, visibleRange])
  
  return {
    scrollTop,
    setScrollTop,
    visibleRange,
    visibleItems,
    totalHeight: items.length * itemHeight,
    offsetY: visibleRange.start * itemHeight
  }
}

// Performance-optimized list item wrapper
interface VirtualListItemProps {
  children: React.ReactNode
  height: number
  isVisible: boolean
  className?: string
}

export const VirtualListItem = React.memo<VirtualListItemProps>(({
  children,
  height,
  isVisible,
  className
}) => {
  return (
    <div 
      className={cn('w-full', className)}
      style={{ height }}
    >
      {isVisible ? children : <div style={{ height }} />}
    </div>
  )
})

VirtualListItem.displayName = 'VirtualListItem'
