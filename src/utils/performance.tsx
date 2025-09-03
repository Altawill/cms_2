import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react'

// === MEMOIZATION UTILITIES === //

/**
 * Enhanced useMemo with dependency comparison logging
 */
export function useEnhancedMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  debugName?: string
): T {
  const prevDepsRef = useRef<React.DependencyList>()
  
  return useMemo(() => {
    if (debugName && process.env.NODE_ENV === 'development') {
      const prevDeps = prevDepsRef.current
      if (prevDeps) {
        const changedDeps = deps.filter((dep, index) => dep !== prevDeps[index])
        if (changedDeps.length > 0) {
          console.log(`🔄 ${debugName} memo recalculated due to:`, changedDeps)
        }
      }
      prevDepsRef.current = deps
    }
    
    return factory()
  }, deps)
}

/**
 * Memoized callback with performance monitoring
 */
export function useEnhancedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  debugName?: string
): T {
  const callCountRef = useRef(0)
  
  return useCallback((...args: Parameters<T>) => {
    callCountRef.current++
    
    if (debugName && process.env.NODE_ENV === 'development') {
      console.log(`📞 ${debugName} called (${callCountRef.current} times)`)
    }
    
    return callback(...args)
  }, deps) as T
}

/**
 * Debounced callback for expensive operations
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList
): T {
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args)
    }, delay)
  }, [callback, delay, ...deps]) as T
}

/**
 * Throttled callback for high-frequency events
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList
): T {
  const lastRunRef = useRef(0)
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now()
    
    if (now - lastRunRef.current >= delay) {
      lastRunRef.current = now
      callback(...args)
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        lastRunRef.current = Date.now()
        callback(...args)
      }, delay - (now - lastRunRef.current))
    }
  }, [callback, delay, ...deps]) as T
}

// === LAZY LOADING UTILITIES === //

/**
 * Lazy load component with retry mechanism
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  maxRetries: number = 3
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    let retries = 0
    
    while (retries < maxRetries) {
      try {
        return await componentImport()
      } catch (error) {
        retries++
        console.warn(`Component load attempt ${retries} failed:`, error)
        
        if (retries >= maxRetries) {
          throw error
        }
        
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000))
      }
    }
    
    throw new Error('Failed to load component after maximum retries')
  })
}

/**
 * Preload images for better UX
 */
export function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(urls.map(url => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
      img.src = url
    })
  }))
}

/**
 * Lazy loading hook for images
 */
export function useLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const imgRef = useRef<HTMLImageElement>()
  
  useEffect(() => {
    const img = new Image()
    imgRef.current = img
    
    img.onload = () => {
      setImageSrc(src)
      setIsLoaded(true)
      setError(null)
    }
    
    img.onerror = () => {
      setError('Failed to load image')
      setIsLoaded(false)
    }
    
    img.src = src
    
    return () => {
      if (imgRef.current) {
        imgRef.current.onload = null
        imgRef.current.onerror = null
      }
    }
  }, [src])
  
  return { imageSrc, isLoaded, error }
}

/**
 * Intersection observer hook for lazy loading
 */
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)
  
  useEffect(() => {
    const element = elementRef.current
    if (!element) return
    
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
      if (entry.isIntersecting && !hasIntersected) {
        setHasIntersected(true)
      }
    }, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options
    })
    
    observer.observe(element)
    
    return () => observer.disconnect()
  }, [hasIntersected, options])
  
  return { isIntersecting, hasIntersected }
}

// === PERFORMANCE MONITORING === //

interface PerformanceMetric {
  name: string
  startTime: number
  endTime?: number
  duration?: number
  count: number
  totalTime: number
  average: number
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, PerformanceMetric> = new Map()
  private activeTimers: Map<string, number> = new Map()
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }
  
  start(name: string): void {
    const startTime = performance.now()
    this.activeTimers.set(name, startTime)
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, {
        name,
        startTime,
        count: 0,
        totalTime: 0,
        average: 0
      })
    }
  }
  
  end(name: string): number | null {
    const endTime = performance.now()
    const startTime = this.activeTimers.get(name)
    
    if (!startTime) {
      console.warn(`Performance timer '${name}' was not started`)
      return null
    }
    
    const duration = endTime - startTime
    this.activeTimers.delete(name)
    
    const metric = this.metrics.get(name)!
    metric.endTime = endTime
    metric.duration = duration
    metric.count++
    metric.totalTime += duration
    metric.average = metric.totalTime / metric.count
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms (avg: ${metric.average.toFixed(2)}ms)`)
    }
    
    return duration
  }
  
  getMetric(name: string): PerformanceMetric | undefined {
    return this.metrics.get(name)
  }
  
  getAllMetrics(): Record<string, PerformanceMetric> {
    return Object.fromEntries(this.metrics)
  }
  
  clear(): void {
    this.metrics.clear()
    this.activeTimers.clear()
  }
}

/**
 * Hook for performance monitoring
 */
export function usePerformanceMonitor(name: string) {
  const monitor = useMemo(() => PerformanceMonitor.getInstance(), [])
  
  const start = useCallback(() => {
    monitor.start(name)
  }, [monitor, name])
  
  const end = useCallback(() => {
    return monitor.end(name)
  }, [monitor, name])
  
  const getMetric = useCallback(() => {
    return monitor.getMetric(name)
  }, [monitor, name])
  
  return { start, end, getMetric, monitor }
}

// === COMPONENT OPTIMIZATION UTILITIES === //

/**
 * HOC for memoizing expensive components
 */
export function withMemoization<P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean
): React.MemoExoticComponent<React.ComponentType<P>> {
  const MemoizedComponent = React.memo(Component, areEqual)
  MemoizedComponent.displayName = `Memoized(${Component.displayName || Component.name})`
  return MemoizedComponent
}

/**
 * Custom comparison function for shallow prop equality
 */
export function shallowEqual<T extends Record<string, any>>(prev: T, next: T): boolean {
  const prevKeys = Object.keys(prev)
  const nextKeys = Object.keys(next)
  
  if (prevKeys.length !== nextKeys.length) {
    return false
  }
  
  for (const key of prevKeys) {
    if (prev[key] !== next[key]) {
      return false
    }
  }
  
  return true
}

/**
 * Deep comparison for complex objects (use sparingly)
 */
export function deepEqual(prev: any, next: any): boolean {
  if (prev === next) return true
  
  if (prev == null || next == null) return prev === next
  
  if (typeof prev !== typeof next) return false
  
  if (typeof prev !== 'object') return prev === next
  
  if (Array.isArray(prev) !== Array.isArray(next)) return false
  
  const prevKeys = Object.keys(prev)
  const nextKeys = Object.keys(next)
  
  if (prevKeys.length !== nextKeys.length) return false
  
  for (const key of prevKeys) {
    if (!nextKeys.includes(key)) return false
    if (!deepEqual(prev[key], next[key])) return false
  }
  
  return true
}

// === LAZY IMAGE COMPONENT === //

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  placeholder?: string
  onLoad?: () => void
  onError?: (error: string) => void
  className?: string
}

export const LazyImage: React.FC<LazyImageProps> = React.memo(({
  src,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+',
  onLoad,
  onError,
  className,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const { isIntersecting, hasIntersected } = useIntersectionObserver(imgRef)
  
  useEffect(() => {
    if (hasIntersected) {
      setIsInView(true)
    }
  }, [hasIntersected])
  
  const handleLoad = useCallback(() => {
    setIsLoaded(true)
    setHasError(false)
    onLoad?.()
  }, [onLoad])
  
  const handleError = useCallback(() => {
    setHasError(true)
    setIsLoaded(false)
    onError?.('Failed to load image')
  }, [onError])
  
  return (
    <img
      ref={imgRef}
      src={isInView ? src : placeholder}
      onLoad={handleLoad}
      onError={handleError}
      className={className}
      style={{
        opacity: isLoaded ? 1 : 0.7,
        transition: 'opacity 0.3s ease',
        ...props.style
      }}
      {...props}
    />
  )
})

LazyImage.displayName = 'LazyImage'

// === VIRTUALIZATION UTILITIES === //

/**
 * Hook for efficient list filtering and sorting
 */
export function useOptimizedList<T>(
  items: T[],
  filterFn: (item: T) => boolean,
  sortFn?: (a: T, b: T) => number,
  dependencies: React.DependencyList = []
) {
  return useEnhancedMemo(() => {
    let result = items.filter(filterFn)
    
    if (sortFn) {
      result = result.sort(sortFn)
    }
    
    return result
  }, [items, filterFn, sortFn, ...dependencies], 'OptimizedList')
}

/**
 * Hook for pagination with performance optimization
 */
export function usePagination<T>(
  items: T[],
  pageSize: number = 20
) {
  const [currentPage, setCurrentPage] = useState(0)
  
  const paginatedData = useEnhancedMemo(() => {
    const start = currentPage * pageSize
    const end = start + pageSize
    return {
      items: items.slice(start, end),
      totalPages: Math.ceil(items.length / pageSize),
      totalItems: items.length,
      currentPage,
      hasNextPage: end < items.length,
      hasPrevPage: currentPage > 0
    }
  }, [items, currentPage, pageSize], 'Pagination')
  
  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(0, Math.min(page, paginatedData.totalPages - 1)))
  }, [paginatedData.totalPages])
  
  const nextPage = useCallback(() => {
    if (paginatedData.hasNextPage) {
      setCurrentPage(prev => prev + 1)
    }
  }, [paginatedData.hasNextPage])
  
  const prevPage = useCallback(() => {
    if (paginatedData.hasPrevPage) {
      setCurrentPage(prev => prev - 1)
    }
  }, [paginatedData.hasPrevPage])
  
  return {
    ...paginatedData,
    goToPage,
    nextPage,
    prevPage,
    setCurrentPage
  }
}

// === COMPONENT WRAPPERS === //

/**
 * Performance-optimized card wrapper
 */
interface OptimizedCardProps {
  children: React.ReactNode
  isVisible?: boolean
  className?: string
  onClick?: () => void
}

export const OptimizedCard = React.memo<OptimizedCardProps>(({
  children,
  isVisible = true,
  className,
  onClick
}) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const { hasIntersected } = useIntersectionObserver(cardRef)
  
  if (!isVisible && !hasIntersected) {
    return (
      <div 
        ref={cardRef}
        className={className}
        style={{ minHeight: '120px', background: 'var(--bg-secondary)' }}
      />
    )
  }
  
  return (
    <div ref={cardRef} className={className} onClick={onClick}>
      {children}
    </div>
  )
})

OptimizedCard.displayName = 'OptimizedCard'

// === BATCH OPERATIONS === //

/**
 * Batch multiple state updates to prevent excessive re-renders
 */
export function useBatchedUpdates() {
  const [updates, setUpdates] = useState<(() => void)[]>([])
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  const batchUpdate = useCallback((updateFn: () => void) => {
    setUpdates(prev => [...prev, updateFn])
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      setUpdates(currentUpdates => {
        // Apply all batched updates
        React.unstable_batchedUpdates(() => {
          currentUpdates.forEach(fn => fn())
        })
        return []
      })
    }, 16) // Next frame
  }, [])
  
  return { batchUpdate }
}

// === RENDER OPTIMIZATION === //

/**
 * Prevents unnecessary re-renders when dependencies haven't changed
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  const ref = useRef<T>()
  
  return useMemo(() => {
    ref.current = callback
    return ((...args: Parameters<T>) => ref.current!(...args)) as T
  }, deps)
}

/**
 * Memoize expensive calculations
 */
export function useExpensiveComputation<T>(
  computeFn: () => T,
  deps: React.DependencyList,
  computationName?: string
): T {
  return useEnhancedMemo(() => {
    const start = performance.now()
    const result = computeFn()
    const duration = performance.now() - start
    
    if (computationName && process.env.NODE_ENV === 'development' && duration > 10) {
      console.log(`🧮 ${computationName} took ${duration.toFixed(2)}ms`)
    }
    
    return result
  }, deps, computationName)
}

// === MEMORY OPTIMIZATION === //

/**
 * Clear unused references to prevent memory leaks
 */
export function useCleanup(cleanupFn: () => void, deps: React.DependencyList = []) {
  useEffect(() => {
    return cleanupFn
  }, deps)
}

/**
 * Limit the number of items kept in memory
 */
export function useMemoryEfficientList<T>(
  items: T[],
  maxItems: number = 1000
): T[] {
  return useMemo(() => {
    if (items.length <= maxItems) {
      return items
    }
    
    // Keep the most recent items
    return items.slice(-maxItems)
  }, [items, maxItems])
}

// === EXPORT PERFORMANCE MONITOR INSTANCE === //
export const performanceMonitor = PerformanceMonitor.getInstance()

// === PERFORMANCE TESTING UTILITIES === //

/**
 * Measure component render time
 */
export function measureRenderTime<P>(
  Component: React.ComponentType<P>,
  componentName?: string
): React.ComponentType<P> {
  return React.forwardRef<any, P>((props, ref) => {
    const renderStart = useRef(performance.now())
    
    useEffect(() => {
      const renderTime = performance.now() - renderStart.current
      
      if (process.env.NODE_ENV === 'development' && renderTime > 16) {
        console.log(`🐌 ${componentName || Component.name} render took ${renderTime.toFixed(2)}ms`)
      }
    })
    
    renderStart.current = performance.now()
    
    return React.createElement(Component, { ...props, ref })
  })
}

/**
 * Track component mount/unmount for debugging
 */
export function useComponentLifecycle(componentName: string) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔵 ${componentName} mounted`)
      
      return () => {
        console.log(`🔴 ${componentName} unmounted`)
      }
    }
  }, [componentName])
}
