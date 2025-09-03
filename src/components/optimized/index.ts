/**
 * Performance-Optimized Components
 * 
 * This module exports components that are enhanced with performance optimizations:
 * - Virtualization for large lists
 * - Memoization for expensive operations
 * - Lazy loading for images and components
 * - Debounced interactions
 * - Memory management
 */

// Virtual scrolling components
export { default as VirtualizedList, useVirtualizedList, VirtualListItem } from '../common/VirtualizedList'

// Optimized image components
export { 
  OptimizedImage, 
  OptimizedImageGallery, 
  ProgressiveImage 
} from '../common/OptimizedImage'

// Performance monitoring and settings
export {
  PerformanceProvider,
  usePerformanceSettings,
  PerformanceIndicator,
  PerformanceMonitor,
  PerformanceSettingsPanel,
  PerformanceQuickActions
} from '../common/PerformanceProvider'

// Performance utilities
export {
  // Memoization
  useEnhancedMemo,
  useEnhancedCallback,
  useDebouncedCallback,
  useThrottledCallback,
  withMemoization,
  shallowEqual,
  deepEqual,
  
  // Lazy loading
  lazyWithRetry,
  preloadImages,
  useLazyImage,
  useIntersectionObserver,
  LazyImage,
  
  // List optimization
  useOptimizedList,
  usePagination,
  
  // Performance monitoring
  usePerformanceMonitor,
  performanceMonitor,
  measureRenderTime,
  useComponentLifecycle,
  
  // Memory management
  useCleanup,
  useMemoryEfficientList,
  useBatchedUpdates,
  useStableCallback,
  useExpensiveComputation,
  
  // Component wrappers
  OptimizedCard
} from '../../utils/performance'

// Optimized versions of existing components
export { TaskList as OptimizedTaskList } from '../tasks/TaskList'
export { EmployeeList as OptimizedEmployeeList } from '../employees/EmployeeList'

// Re-export lazy components
export * from '../LazyComponents'

// Performance recommendations
export const PERFORMANCE_RECOMMENDATIONS = {
  // Virtualization thresholds
  VIRTUALIZE_TASK_LIST_THRESHOLD: 100,
  VIRTUALIZE_EMPLOYEE_LIST_THRESHOLD: 50,
  VIRTUALIZE_TABLE_THRESHOLD: 30,
  
  // Pagination thresholds  
  PAGINATE_THRESHOLD: 200,
  DEFAULT_PAGE_SIZE: 50,
  
  // Image optimization
  DEFAULT_IMAGE_QUALITY: 'medium' as const,
  MAX_IMAGE_SIZE: 1200,
  
  // Debounce delays
  SEARCH_DEBOUNCE_DELAY: 300,
  FILTER_DEBOUNCE_DELAY: 150,
  RESIZE_DEBOUNCE_DELAY: 100,
  
  // Memory limits
  MAX_LIST_ITEMS_IN_MEMORY: 1000,
  MAX_CACHED_IMAGES: 50,
  
  // Performance targets (in milliseconds)
  TARGET_RENDER_TIME: 16, // 60fps
  WARNING_RENDER_TIME: 33, // 30fps
  CRITICAL_RENDER_TIME: 50  // 20fps
} as const

// Performance optimization presets
export const PERFORMANCE_PRESETS = {
  SPEED: {
    enableVirtualization: true,
    enableLazyLoading: true,
    enableMemoization: true,
    imageQuality: 'low' as const,
    maxListSize: 500,
    debounceDelay: 500
  },
  
  BALANCED: {
    enableVirtualization: true,
    enableLazyLoading: true,
    enableMemoization: true,
    imageQuality: 'medium' as const,
    maxListSize: 1000,
    debounceDelay: 300
  },
  
  QUALITY: {
    enableVirtualization: false,
    enableLazyLoading: true,
    enableMemoization: true,
    imageQuality: 'high' as const,
    maxListSize: 2000,
    debounceDelay: 200
  }
} as const

// Performance tips for developers
export const PERFORMANCE_TIPS = [
  "Use virtualization for lists with 50+ items",
  "Implement lazy loading for images and heavy components",
  "Memoize expensive calculations with useMemo",
  "Debounce user input for search and filters",
  "Use React.memo for components that re-render frequently",
  "Optimize images and use appropriate quality settings",
  "Monitor Core Web Vitals and component render times",
  "Implement proper error boundaries for lazy components",
  "Use intersection observer for viewport-based optimizations",
  "Batch state updates to prevent excessive re-renders"
] as const

// Performance best practices checklist
export const PERFORMANCE_CHECKLIST = {
  rendering: [
    "Components are properly memoized with React.memo",
    "Expensive calculations use useMemo",
    "Event handlers use useCallback",
    "Large lists implement virtualization",
    "Images use lazy loading"
  ],
  
  memory: [
    "Cleanup effects properly dispose of resources",
    "Large datasets are paginated or virtualized", 
    "Unused components are lazy loaded",
    "Event listeners are properly removed",
    "Memory leaks are prevented with proper cleanup"
  ],
  
  network: [
    "Images are optimized for web",
    "Components are code-split appropriately",
    "Assets are properly cached",
    "API calls are debounced/throttled",
    "Offline functionality is implemented"
  ],
  
  monitoring: [
    "Performance metrics are tracked",
    "Core Web Vitals are monitored",
    "Slow operations are identified",
    "User experience is measured",
    "Performance budgets are set"
  ]
} as const
