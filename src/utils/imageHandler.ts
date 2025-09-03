/**
 * Perfect Image Handling Utility
 * Provides robust image loading, validation, compression, and fallback systems
 */

export interface ImageValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  compressedImage?: string
  originalSize?: number
  compressedSize?: number
}

export class PerfectImageHandler {
  
  // Validate image file before processing
  static async validateImage(file: File): Promise<ImageValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      errors.push('Please select a valid image file (JPEG, PNG, GIF, WebP) • يرجى اختيار ملف صورة صالح')
    }
    
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      errors.push(`Image size must be less than 10MB • حجم الصورة يجب أن يكون أقل من 10 ميجابايت`)
    }
    
    // Warning for large files
    if (file.size > 2 * 1024 * 1024) { // 2MB
      warnings.push('Large image detected - will be compressed • تم اكتشاف صورة كبيرة - سيتم ضغطها')
    }
    
    if (errors.length > 0) {
      return { isValid: false, errors, warnings }
    }
    
    try {
      // Compress image if needed
      const compressedImage = await this.compressImage(file)
      const compressedSize = this.getBase64Size(compressedImage)
      
      return {
        isValid: true,
        errors: [],
        warnings,
        compressedImage,
        originalSize: file.size,
        compressedSize
      }
    } catch (error) {
      errors.push('Failed to process image • فشل في معالجة الصورة')
      return { isValid: false, errors, warnings }
    }
  }
  
  // Compress image to optimal size and quality
  static async compressImage(file: File, maxWidth = 800, quality = 0.8): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // Calculate optimal dimensions
        const { width, height } = this.calculateDimensions(img.width, img.height, maxWidth)
        
        canvas.width = width
        canvas.height = height
        
        // Draw and compress
        ctx!.fillStyle = 'white'
        ctx!.fillRect(0, 0, width, height)
        ctx!.drawImage(img, 0, 0, width, height)
        
        // Convert to base64 with compression
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedDataUrl)
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }
  
  // Calculate optimal dimensions while maintaining aspect ratio
  static calculateDimensions(originalWidth: number, originalHeight: number, maxWidth: number) {
    if (originalWidth <= maxWidth) {
      return { width: originalWidth, height: originalHeight }
    }
    
    const ratio = originalHeight / originalWidth
    return {
      width: maxWidth,
      height: Math.round(maxWidth * ratio)
    }
  }
  
  // Get base64 string size in bytes
  static getBase64Size(base64String: string): number {
    const base64Data = base64String.split(',')[1] || base64String
    return Math.round(base64Data.length * 0.75) // Base64 is ~25% larger than binary
  }
  
  // Create image placeholder with company colors
  static createPlaceholder(width = 200, height = 150, text = 'LOGO'): string {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    
    canvas.width = width
    canvas.height = height
    
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#f0fdf4')
    gradient.addColorStop(1, '#dcfce7')
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
    
    // Border
    ctx.strokeStyle = '#84cc16'
    ctx.lineWidth = 2
    ctx.strokeRect(1, 1, width - 2, height - 2)
    
    // Text
    ctx.fillStyle = '#166534'
    ctx.font = `bold ${Math.min(width, height) / 8}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, width / 2, height / 2)
    
    return canvas.toDataURL('image/png')
  }
  
  // Load image with fallback
  static async loadImageWithFallback(src: string, fallbackText = 'LOGO'): Promise<string> {
    return new Promise((resolve) => {
      if (!src) {
        resolve(this.createPlaceholder(200, 150, fallbackText))
        return
      }
      
      const img = new Image()
      const timeoutId = setTimeout(() => {
        resolve(this.createPlaceholder(200, 150, fallbackText))
      }, 5000) // 5 second timeout
      
      img.onload = () => {
        clearTimeout(timeoutId)
        resolve(src)
      }
      
      img.onerror = () => {
        clearTimeout(timeoutId)
        console.warn('Image failed to load, using placeholder:', src)
        resolve(this.createPlaceholder(200, 150, fallbackText))
      }
      
      img.src = src
    })
  }
  
  // Convert file to base64
  static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
  
  // Validate base64 image string
  static isValidBase64Image(base64: string): boolean {
    if (!base64 || typeof base64 !== 'string') return false
    
    const base64Pattern = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/
    return base64Pattern.test(base64)
  }
  
  // Get image format from base64
  static getImageFormat(base64: string): string | null {
    const match = base64.match(/^data:image\/(\w+);base64,/)
    return match ? match[1].toUpperCase() : null
  }
  
  // Resize image to specific dimensions
  static async resizeImage(base64: string, targetWidth: number, targetHeight: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        canvas.width = targetWidth
        canvas.height = targetHeight
        
        ctx!.fillStyle = 'white'
        ctx!.fillRect(0, 0, targetWidth, targetHeight)
        ctx!.drawImage(img, 0, 0, targetWidth, targetHeight)
        
        resolve(canvas.toDataURL('image/jpeg', 0.9))
      }
      
      img.onerror = () => reject(new Error('Failed to resize image'))
      img.src = base64
    })
  }
}

// React hook for image handling
export function useImageHandler() {
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  
  const processImage = async (file: File): Promise<string | null> => {
    setIsProcessing(true)
    setError(null)
    
    try {
      const result = await PerfectImageHandler.validateImage(file)
      
      if (!result.isValid) {
        setError(result.errors[0])
        return null
      }
      
      return result.compressedImage!
    } catch (err) {
      setError('Failed to process image • فشل في معالجة الصورة')
      return null
    } finally {
      setIsProcessing(false)
    }
  }
  
  const loadWithFallback = async (src: string, fallback = 'LOGO'): Promise<string> => {
    try {
      return await PerfectImageHandler.loadImageWithFallback(src, fallback)
    } catch (err) {
      console.error('Image loading error:', err)
      return PerfectImageHandler.createPlaceholder(200, 150, fallback)
    }
  }
  
  return {
    processImage,
    loadWithFallback,
    isProcessing,
    error,
    clearError: () => setError(null)
  }
}

import React from 'react'

export default PerfectImageHandler
