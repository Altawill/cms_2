import React, { useState, useRef, useCallback } from 'react'
import { LazyImage, useIntersectionObserver } from '../../utils/performance'
import { EXIFImagePreview } from '../EXIFDataDisplay'
import { useEXIF } from '../../services/exifService'
import { cn } from '../../utils'
import { Loader2, AlertTriangle, Image as ImageIcon } from 'lucide-react'

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  placeholder?: string
  quality?: 'low' | 'medium' | 'high'
  loading?: 'lazy' | 'eager'
  onLoad?: () => void
  onError?: (error: string) => void
  showEXIF?: boolean
  enableOptimization?: boolean
  fallbackIcon?: React.ReactNode
}

export const OptimizedImage: React.FC<OptimizedImageProps> = React.memo(({
  src,
  alt,
  className,
  width,
  height,
  placeholder,
  quality = 'medium',
  loading = 'lazy',
  onLoad,
  onError,
  showEXIF = false,
  enableOptimization = false,
  fallbackIcon = <ImageIcon className="h-8 w-8 text-muted-foreground" />
}) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [exifData, setExifData] = useState<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { isIntersecting, hasIntersected } = useIntersectionObserver(containerRef)
  const { extractEXIF } = useEXIF()

  // Generate optimized src based on quality setting
  const getOptimizedSrc = useCallback((originalSrc: string) => {
    if (!enableOptimization) return originalSrc
    
    // In a real implementation, this would call an image optimization service
    const qualityParams = {
      low: '?w=400&q=50',
      medium: '?w=800&q=75', 
      high: '?w=1200&q=90'
    }
    
    return `${originalSrc}${qualityParams[quality]}`
  }, [quality, enableOptimization])

  const optimizedSrc = getOptimizedSrc(src)

  const handleImageLoad = useCallback(async () => {
    setImageState('loaded')
    onLoad?.()
    
    // Extract EXIF data if enabled
    if (showEXIF && src.startsWith('data:') || src.includes('blob:')) {
      try {
        // Convert to blob for EXIF extraction
        const response = await fetch(src)
        const blob = await response.blob()
        const file = new File([blob], 'image.jpg', { type: blob.type })
        
        const exif = await extractEXIF(file, {
          includeGPS: true,
          includeCameraInfo: true,
          includePrivateData: false
        })
        
        setExifData(exif)
      } catch (error) {
        console.warn('EXIF extraction failed:', error)
      }
    }
  }, [src, showEXIF, extractEXIF, onLoad])

  const handleImageError = useCallback((error: string) => {
    setImageState('error')
    onError?.(error)
  }, [onError])

  // Don't render until in view (for performance)
  if (loading === 'lazy' && !hasIntersected) {
    return (
      <div 
        ref={containerRef}
        className={cn(
          'flex items-center justify-center bg-muted rounded-md',
          className
        )}
        style={{ width, height }}
      >
        <div className="animate-pulse">
          {fallbackIcon}
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Loading state */}
      {imageState === 'loading' && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-muted rounded-md z-10"
          style={{ width, height }}
        >
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error state */}
      {imageState === 'error' && (
        <div 
          className="flex flex-col items-center justify-center bg-muted rounded-md border-2 border-dashed border-border"
          style={{ width, height }}
        >
          <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
          <span className="text-xs text-muted-foreground text-center px-2">
            Failed to load image
          </span>
        </div>
      )}

      {/* Actual image */}
      <LazyImage
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        placeholder={placeholder}
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={cn(
          'object-cover rounded-md',
          imageState === 'loaded' ? 'opacity-100' : 'opacity-0',
          className
        )}
        style={{
          transition: 'opacity 0.3s ease',
          width: width || '100%',
          height: height || 'auto'
        }}
      />

      {/* EXIF overlay */}
      {showEXIF && exifData && imageState === 'loaded' && (
        <div className="absolute top-2 left-2">
          <EXIFImagePreview 
            src={src}
            exifData={exifData}
            size="sm"
            className="bg-black/70 text-white rounded-md"
          />
        </div>
      )}
    </div>
  )
})

OptimizedImage.displayName = 'OptimizedImage'

// Image gallery component with virtualized loading
interface OptimizedImageGalleryProps {
  images: Array<{
    id: string
    src: string
    alt: string
    thumbnail?: string
  }>
  columns?: number
  itemHeight?: number
  maxDisplayCount?: number
  onImageClick?: (image: any, index: number) => void
  className?: string
}

export const OptimizedImageGallery: React.FC<OptimizedImageGalleryProps> = React.memo(({
  images,
  columns = 3,
  itemHeight = 200,
  maxDisplayCount = 50,
  onImageClick,
  className
}) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  
  // Limit displayed images for performance
  const displayImages = images.slice(0, maxDisplayCount)
  
  const handleImageLoad = useCallback((imageId: string) => {
    setLoadedImages(prev => new Set([...prev, imageId]))
  }, [])

  const getGridCols = () => {
    switch (columns) {
      case 1: return 'grid-cols-1'
      case 2: return 'grid-cols-1 md:grid-cols-2'
      case 3: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      case 4: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      default: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {images.length > maxDisplayCount && (
        <div className="text-sm text-muted-foreground text-center p-2 bg-muted/50 rounded-md">
          Showing first {maxDisplayCount} of {images.length} images for performance
        </div>
      )}
      
      <div className={cn('grid gap-4', getGridCols())}>
        {displayImages.map((image, index) => (
          <div key={image.id} className="group cursor-pointer">
            <OptimizedImage
              src={image.thumbnail || image.src}
              alt={image.alt}
              width={300}
              height={itemHeight}
              quality="medium"
              loading="lazy"
              enableOptimization={true}
              className="w-full h-full object-cover rounded-lg transition-transform group-hover:scale-105"
              onLoad={() => handleImageLoad(image.id)}
              onError={(error) => console.warn(`Failed to load image ${image.id}:`, error)}
              onClick={() => onImageClick?.(image, index)}
            />
            
            {/* Loading indicator */}
            {!loadedImages.has(image.id) && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/80 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
})

OptimizedImageGallery.displayName = 'OptimizedImageGallery'

// Progressive image component that loads different qualities
interface ProgressiveImageProps {
  src: string
  lowQualitySrc?: string
  alt: string
  className?: string
  width?: number
  height?: number
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = React.memo(({
  src,
  lowQualitySrc,
  alt,
  className,
  width,
  height
}) => {
  const [currentSrc, setCurrentSrc] = useState(lowQualitySrc || src)
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false)

  const handleLowQualityLoad = useCallback(() => {
    // Start loading high quality image
    if (lowQualitySrc && src !== lowQualitySrc) {
      const highQualityImg = new Image()
      highQualityImg.onload = () => {
        setCurrentSrc(src)
        setIsHighQualityLoaded(true)
      }
      highQualityImg.src = src
    }
  }, [src, lowQualitySrc])

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <img
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        onLoad={handleLowQualityLoad}
        className={cn(
          'transition-all duration-300',
          !isHighQualityLoaded && lowQualitySrc ? 'filter blur-sm scale-105' : '',
          className
        )}
        style={{
          width: width || '100%',
          height: height || 'auto'
        }}
      />
      
      {/* Loading overlay for progressive loading */}
      {!isHighQualityLoaded && lowQualitySrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <Loader2 className="h-4 w-4 animate-spin text-white" />
        </div>
      )}
    </div>
  )
})

ProgressiveImage.displayName = 'ProgressiveImage'
