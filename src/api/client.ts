import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001'

// Create axios instance with default configuration
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Request interceptor for authentication and logging
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // Add authentication token if available
    const token = localStorage.getItem('auth_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add request ID for tracking
    const requestId = Date.now().toString()
    if (config.headers) {
      config.headers['X-Request-ID'] = requestId
    }

    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
        params: config.params,
        requestId
      })
    }

    return config
  },
  (error) => {
    console.error('❌ Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling and logging
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ API Response:', {
        status: response.status,
        url: response.config.url,
        requestId: response.config.headers?.['X-Request-ID'],
        data: response.data
      })
    }

    return response
  },
  (error) => {
    // Enhanced error handling
    console.error('❌ API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      data: error.response?.data,
      requestId: error.config?.headers?.['X-Request-ID']
    })

    // Handle specific error cases
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    } else if (error.response?.status === 403) {
      // Forbidden - show permission error
      console.warn('🚫 Access forbidden - insufficient permissions')
    } else if (error.response?.status >= 500) {
      // Server error - show user-friendly message
      console.error('🔥 Server error - please try again later')
    }

    return Promise.reject(error)
  }
)

// Utility functions for API calls
export const apiUtils = {
  // Handle file upload with progress tracking
  uploadWithProgress: async (
    endpoint: string, 
    formData: FormData, 
    onProgress?: (progress: number) => void
  ): Promise<AxiosResponse> => {
    return apiClient.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      }
    })
  },

  // Download file with progress tracking
  downloadWithProgress: async (
    endpoint: string, 
    params?: any,
    onProgress?: (progress: number) => void
  ): Promise<Blob> => {
    const response = await apiClient.get(endpoint, {
      params,
      responseType: 'blob',
      onDownloadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      }
    })
    
    return response.data
  },

  // Retry failed requests with exponential backoff
  retryRequest: async (
    requestFn: () => Promise<any>,
    maxRetries: number = 3,
    initialDelay: number = 1000
  ): Promise<any> => {
    let lastError: Error

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn()
      } catch (error: any) {
        lastError = error
        
        // Don't retry on client errors (4xx)
        if (error.response?.status >= 400 && error.response?.status < 500) {
          throw error
        }

        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break
        }

        // Calculate delay with exponential backoff and jitter
        const delay = initialDelay * Math.pow(2, attempt - 1) + Math.random() * 1000
        console.warn(`🔄 Retrying request (attempt ${attempt}/${maxRetries}) after ${delay}ms`)
        
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError!
  }
}

// Mock API for development/testing
export const mockApiClient = {
  // Simulate API delay
  delay: (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms)),

  // Mock successful response
  success: <T>(data: T): Promise<{ data: T }> => 
    mockApiClient.delay().then(() => ({ data })),

  // Mock error response
  error: (message: string, status: number = 500): Promise<never> =>
    mockApiClient.delay().then(() => {
      const error = new Error(message) as any
      error.response = { status, statusText: message }
      throw error
    })
}

// Network status monitoring
export const networkMonitor = {
  isOnline: () => navigator.onLine,
  
  setupNetworkListeners: (onOnline?: () => void, onOffline?: () => void) => {
    const handleOnline = () => {
      console.log('🌐 Network connection restored')
      onOnline?.()
    }
    
    const handleOffline = () => {
      console.warn('📵 Network connection lost')
      onOffline?.()
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }
}

// Request caching for performance
export class ApiCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  
  // Get cached data
  get(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data
  }
  
  // Set cached data
  set(key: string, data: any, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    })
  }
  
  // Clear all cache
  clear(): void {
    this.cache.clear()
  }
  
  // Clear expired entries
  cleanExpired(): void {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

// Global cache instance
export const apiCache = new ApiCache()

// Clean expired cache entries every 5 minutes
setInterval(() => {
  apiCache.cleanExpired()
}, 5 * 60 * 1000)
