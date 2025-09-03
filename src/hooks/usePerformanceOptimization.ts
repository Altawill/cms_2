import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { debounce } from 'lodash';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface UsePerformanceOptimizationOptions {
  cacheKey?: string;
  cacheTTL?: number; // Time to live in milliseconds
  debounceMs?: number;
  enableLazyLoading?: boolean;
  pageSize?: number;
}

class PerformanceCache {
  private static instance: PerformanceCache;
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 1000; // Maximum cache entries

  static getInstance(): PerformanceCache {
    if (!PerformanceCache.instance) {
      PerformanceCache.instance = new PerformanceCache();
    }
    return PerformanceCache.instance;
  }

  set<T>(key: string, data: T, ttl: number = 300000): void { // Default 5 minutes TTL
    // Clean expired entries periodically
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));

    // If still too many entries, remove oldest
    if (this.cache.size >= this.maxSize) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, Math.floor(this.maxSize * 0.2)); // Remove 20%
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

export function usePerformanceOptimization<T>(
  dataFetcher: () => Promise<T>,
  options: UsePerformanceOptimizationOptions = {}
) {
  const {
    cacheKey = 'default',
    cacheTTL = 300000, // 5 minutes
    debounceMs = 300,
    enableLazyLoading = true,
    pageSize = 50
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  const cache = PerformanceCache.getInstance();
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Optimized data fetcher with caching
  const fetchData = useCallback(async (ignoreCache = false) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Check cache first
    if (!ignoreCache) {
      const cachedData = cache.get<T>(cacheKey);
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const result = await dataFetcher();
      
      if (!isMountedRef.current) return;

      setData(result);
      cache.set(cacheKey, result, cacheTTL);
      setLoading(false);
    } catch (err) {
      if (!isMountedRef.current) return;
      
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Ignore aborted requests
      }

      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setLoading(false);
    }
  }, [dataFetcher, cacheKey, cacheTTL]);

  // Debounced refresh function
  const debouncedRefresh = useMemo(
    () => debounce(() => fetchData(true), debounceMs),
    [fetchData, debounceMs]
  );

  // Pagination support
  const loadMore = useCallback(async () => {
    if (!enableLazyLoading || loading) return;

    setCurrentPage(prev => prev + 1);
    // Implementation would depend on your specific data structure
  }, [enableLazyLoading, loading]);

  // Refresh data
  const refresh = useCallback(() => {
    debouncedRefresh();
  }, [debouncedRefresh]);

  // Invalidate cache
  const invalidateCache = useCallback(() => {
    cache.invalidate(cacheKey);
  }, [cache, cacheKey]);

  // Initial load
  useEffect(() => {
    fetchData();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      debouncedRefresh.cancel();
    };
  }, [fetchData, debouncedRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    refresh,
    loadMore,
    hasMore,
    currentPage,
    invalidateCache,
    isFromCache: !loading && !!cache.get(cacheKey)
  };
}

export function useDatabaseOptimization<T>(
  query: () => Promise<T>,
  dependencies: any[] = [],
  options: UsePerformanceOptimizationOptions = {}
) {
  const memoizedQuery = useCallback(query, dependencies);
  const cacheKey = `db_${JSON.stringify(dependencies)}_${Date.now().toString().slice(-6)}`;
  
  return usePerformanceOptimization(memoizedQuery, {
    ...options,
    cacheKey
  });
}

// Utility for batch operations
export function useBatchProcessor<T, R>(
  processor: (batch: T[]) => Promise<R[]>,
  batchSize: number = 10,
  delayMs: number = 100
) {
  const [queue, setQueue] = useState<T[]>([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<R[]>([]);

  const processBatch = useCallback(async (items: T[]) => {
    setProcessing(true);
    try {
      const processed = await processor(items);
      setResults(prev => [...prev, ...processed]);
    } catch (error) {
      console.error('Batch processing error:', error);
    } finally {
      setProcessing(false);
    }
  }, [processor]);

  const addToQueue = useCallback((items: T | T[]) => {
    const itemsArray = Array.isArray(items) ? items : [items];
    setQueue(prev => [...prev, ...itemsArray]);
  }, []);

  useEffect(() => {
    if (queue.length === 0 || processing) return;

    const timer = setTimeout(() => {
      const batch = queue.slice(0, batchSize);
      setQueue(prev => prev.slice(batchSize));
      processBatch(batch);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [queue, processing, batchSize, delayMs, processBatch]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setResults([]);
  }, []);

  return {
    addToQueue,
    processing,
    queueSize: queue.length,
    results,
    clearQueue
  };
}
