/**
 * Performance Optimization Utilities
 * Comprehensive performance enhancements and optimizations
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// === DEBOUNCE AND THROTTLE UTILITIES === //

/**
 * Debounce function to limit rapid function calls
 * @param func Function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle function to limit function execution frequency
 * @param func Function to throttle
 * @param delay Delay in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

// === REACT PERFORMANCE HOOKS === //

/**
 * Debounced state hook for form inputs
 * @param initialValue Initial state value
 * @param delay Debounce delay in milliseconds
 * @returns [debouncedValue, setValue, immediateValue]
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number = 300
): [T, (value: T) => void, T] {
  const [immediateValue, setImmediateValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(immediateValue);
    }, delay);

    return () => clearTimeout(timer);
  }, [immediateValue, delay]);

  return [debouncedValue, setImmediateValue, immediateValue];
}

/**
 * Throttled callback hook
 * @param callback Function to throttle
 * @param delay Throttle delay in milliseconds
 * @returns Throttled callback function
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());
  
  return useCallback(
    ((...args: any[]) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
}

/**
 * Previous value hook for comparison
 * @param value Current value
 * @returns Previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

/**
 * Intersection Observer hook for lazy loading
 * @param options Intersection Observer options
 * @returns [ref, isIntersecting, entry]
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefObject<HTMLElement>, boolean, IntersectionObserverEntry | null] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        setEntry(entry);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [options]);

  return [elementRef, isIntersecting, entry];
}

/**
 * Virtual scrolling hook for large lists
 * @param items Array of items
 * @param itemHeight Height of each item
 * @param containerHeight Height of container
 * @returns Virtual list data
 */
export function useVirtualList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const totalHeight = items.length * itemHeight;
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 1, items.length);

  const visibleItems = useMemo(() => 
    items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index
    })),
    [items, startIndex, endIndex]
  );

  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop: useCallback((top: number) => setScrollTop(top), [])
  };
}

// === MEMOIZATION UTILITIES === //

/**
 * Deep comparison for React.memo
 * @param prevProps Previous props
 * @param nextProps Next props
 * @returns Whether props are equal
 */
export function deepEqual(prevProps: any, nextProps: any): boolean {
  const keys1 = Object.keys(prevProps);
  const keys2 = Object.keys(nextProps);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    const val1 = prevProps[key];
    const val2 = nextProps[key];
    const areObjects = isObject(val1) && isObject(val2);
    
    if (
      (areObjects && !deepEqual(val1, val2)) ||
      (!areObjects && val1 !== val2)
    ) {
      return false;
    }
  }

  return true;
}

function isObject(object: any): boolean {
  return object != null && typeof object === 'object';
}

/**
 * Shallow comparison for React.memo
 * @param prevProps Previous props
 * @param nextProps Next props
 * @returns Whether props are equal
 */
export function shallowEqual(prevProps: any, nextProps: any): boolean {
  const keys1 = Object.keys(prevProps);
  const keys2 = Object.keys(nextProps);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (prevProps[key] !== nextProps[key]) {
      return false;
    }
  }

  return true;
}

// === CACHING UTILITIES === //

/**
 * Simple LRU Cache implementation
 */
export class LRUCache<K, V> {
  private maxSize: number;
  private cache: Map<K, V>;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key: K): V | undefined {
    if (this.cache.has(key)) {
      const value = this.cache.get(key)!;
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return undefined;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Cached function decorator
 * @param fn Function to cache
 * @param cacheSize Maximum cache size
 * @returns Cached function
 */
export function withCache<T extends (...args: any[]) => any>(
  fn: T,
  cacheSize: number = 100
): T {
  const cache = new LRUCache<string, ReturnType<T>>(cacheSize);

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);
    
    if (cached !== undefined) {
      return cached;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// === IMAGE OPTIMIZATION === //

/**
 * Image preloader utility
 * @param src Image source
 * @returns Promise that resolves when image loads
 */
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Batch image preloader
 * @param sources Array of image sources
 * @returns Promise that resolves when all images load
 */
export function preloadImages(sources: string[]): Promise<HTMLImageElement[]> {
  return Promise.all(sources.map(preloadImage));
}

/**
 * Image compression utility
 * @param file Image file
 * @param maxWidth Maximum width
 * @param maxHeight Maximum height
 * @param quality Compression quality (0-1)
 * @returns Compressed image blob
 */
export function compressImage(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Compression failed'));
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// === BUNDLE SIZE OPTIMIZATION === //

/**
 * Dynamic import wrapper with error handling
 * @param importFn Dynamic import function
 * @returns Component with loading and error states
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    try {
      return await importFn();
    } catch (error) {
      console.error('Lazy loading failed:', error);
      // Retry once
      try {
        return await importFn();
      } catch (retryError) {
        console.error('Lazy loading retry failed:', retryError);
        throw retryError;
      }
    }
  });
}

// === PERFORMANCE MONITORING === //

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start timing a operation
   * @param name Operation name
   */
  startTiming(name: string): void {
    performance.mark(`${name}-start`);
  }

  /**
   * End timing and record metric
   * @param name Operation name
   */
  endTiming(name: string): number {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const entry = performance.getEntriesByName(name, 'measure')[0];
    const duration = entry.duration;
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(duration);
    
    // Clean up marks
    performance.clearMarks(`${name}-start`);
    performance.clearMarks(`${name}-end`);
    performance.clearMeasures(name);
    
    return duration;
  }

  /**
   * Get average timing for an operation
   * @param name Operation name
   * @returns Average duration in milliseconds
   */
  getAverage(name: string): number {
    const timings = this.metrics.get(name);
    if (!timings || timings.length === 0) return 0;
    
    return timings.reduce((sum, time) => sum + time, 0) / timings.length;
  }

  /**
   * Get all metrics
   * @returns Object with all recorded metrics
   */
  getAllMetrics(): Record<string, { average: number; count: number; total: number }> {
    const result: Record<string, { average: number; count: number; total: number }> = {};
    
    for (const [name, timings] of this.metrics.entries()) {
      const total = timings.reduce((sum, time) => sum + time, 0);
      result[name] = {
        average: total / timings.length,
        count: timings.length,
        total
      };
    }
    
    return result;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }
}

/**
 * React hook for performance monitoring
 * @param name Operation name
 * @returns Start and end timing functions
 */
export function usePerformanceMonitor(name: string) {
  const monitor = PerformanceMonitor.getInstance();
  
  const start = useCallback(() => {
    monitor.startTiming(name);
  }, [monitor, name]);
  
  const end = useCallback(() => {
    return monitor.endTiming(name);
  }, [monitor, name]);
  
  return { start, end };
}

// === MEMORY MANAGEMENT === //

/**
 * Memory-efficient state manager for large datasets
 */
export class StateManager<T> {
  private data: Map<string, T> = new Map();
  private subscribers: Map<string, Set<() => void>> = new Map();
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  /**
   * Set data with automatic cleanup
   */
  set(key: string, value: T): void {
    // Cleanup old entries if exceeding max size
    if (this.data.size >= this.maxSize) {
      const oldestKey = this.data.keys().next().value;
      this.data.delete(oldestKey);
      this.subscribers.delete(oldestKey);
    }

    this.data.set(key, value);
    this.notifySubscribers(key);
  }

  /**
   * Get data by key
   */
  get(key: string): T | undefined {
    return this.data.get(key);
  }

  /**
   * Subscribe to changes for a specific key
   */
  subscribe(key: string, callback: () => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(key)?.delete(callback);
    };
  }

  /**
   * Notify subscribers of changes
   */
  private notifySubscribers(key: string): void {
    const callbacks = this.subscribers.get(key);
    if (callbacks) {
      callbacks.forEach(callback => callback());
    }
  }

  /**
   * Clear all data and subscribers
   */
  clear(): void {
    this.data.clear();
    this.subscribers.clear();
  }

  /**
   * Get memory usage info
   */
  getMemoryInfo(): { size: number; maxSize: number; usage: number } {
    const size = this.data.size;
    return {
      size,
      maxSize: this.maxSize,
      usage: (size / this.maxSize) * 100
    };
  }
}

// Export React for lazy loading
import React from 'react';

// === UTILITY EXPORTS === //
export default {
  debounce,
  throttle,
  useDebouncedState,
  useThrottledCallback,
  usePrevious,
  useIntersectionObserver,
  useVirtualList,
  deepEqual,
  shallowEqual,
  LRUCache,
  withCache,
  preloadImage,
  preloadImages,
  compressImage,
  lazyWithRetry,
  PerformanceMonitor,
  usePerformanceMonitor,
  StateManager
};
