import EXIF from 'exif-js'

export interface ExifData {
  // Basic metadata
  fileName: string
  fileSize: number
  fileType: string
  dimensions: {
    width: number
    height: number
  }
  
  // Camera/device info
  make?: string
  model?: string
  software?: string
  
  // Photo settings
  dateTime?: string
  orientation?: number
  flash?: string
  focalLength?: number
  aperture?: number
  shutterSpeed?: string
  iso?: number
  whiteBalance?: string
  
  // GPS location (if available)
  gps?: {
    latitude: number
    longitude: number
    altitude?: number
    timestamp?: string
  }
  
  // Additional metadata
  copyright?: string
  artist?: string
  description?: string
  keywords?: string[]
  
  // Processing info
  extractedAt: string
  hasGPS: boolean
  hasCameraInfo: boolean
  
  // Privacy-sensitive data detection
  privacyFlags: {
    hasLocation: boolean
    hasPersonalInfo: boolean
    hasDeviceInfo: boolean
  }
}

export interface ExifExtractionOptions {
  includeGPS?: boolean
  includeCameraInfo?: boolean
  includePrivateData?: boolean
  maxFileSize?: number // in MB
  allowedTypes?: string[]
}

export class EXIFService {
  private static readonly DEFAULT_OPTIONS: ExifExtractionOptions = {
    includeGPS: true,
    includeCameraInfo: true,
    includePrivateData: false,
    maxFileSize: 10, // 10MB limit
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/tiff']
  }
  
  // Extract EXIF data from file
  static async extractEXIF(file: File, options: ExifExtractionOptions = {}): Promise<ExifData> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options }
    
    // Validate file
    this.validateFile(file, opts)
    
    return new Promise((resolve, reject) => {
      EXIF.getData(file as any, function(this: any) {
        try {
          const exifData = EXIF.getAllTags(this)
          const processedData = EXIFService.processExifData(file, exifData, opts)
          resolve(processedData)
        } catch (error) {
          console.error('EXIF extraction failed:', error)
          reject(new Error('Failed to extract EXIF data'))
        }
      })
    })
  }
  
  // Extract EXIF from image URL/blob
  static async extractFromImageElement(imageElement: HTMLImageElement, options: ExifExtractionOptions = {}): Promise<Partial<ExifData>> {
    return new Promise((resolve, reject) => {
      EXIF.getData(imageElement, function(this: any) {
        try {
          const exifData = EXIF.getAllTags(this)
          
          const basicData: Partial<ExifData> = {
            dimensions: {
              width: imageElement.naturalWidth,
              height: imageElement.naturalHeight
            },
            extractedAt: new Date().toISOString(),
            privacyFlags: {
              hasLocation: false,
              hasPersonalInfo: false,
              hasDeviceInfo: false
            }
          }
          
          if (exifData) {
            Object.assign(basicData, EXIFService.parseExifTags(exifData, options))
          }
          
          resolve(basicData)
        } catch (error) {
          console.error('EXIF extraction from image failed:', error)
          reject(error)
        }
      })
    })
  }
  
  // Validate file before processing
  private static validateFile(file: File, options: ExifExtractionOptions): void {
    // Check file size
    if (options.maxFileSize && file.size > options.maxFileSize * 1024 * 1024) {
      throw new Error(`File size exceeds ${options.maxFileSize}MB limit`)
    }
    
    // Check file type
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not supported`)
    }
  }
  
  // Process raw EXIF data
  private static processExifData(file: File, exifData: any, options: ExifExtractionOptions): ExifData {
    const basicInfo = {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      dimensions: {
        width: exifData.PixelXDimension || 0,
        height: exifData.PixelYDimension || 0
      },
      extractedAt: new Date().toISOString()
    }
    
    const parsedExif = this.parseExifTags(exifData, options)
    
    return {
      ...basicInfo,
      ...parsedExif,
      hasGPS: !!parsedExif.gps,
      hasCameraInfo: !!(parsedExif.make || parsedExif.model),
      privacyFlags: {
        hasLocation: !!parsedExif.gps,
        hasPersonalInfo: !!(parsedExif.artist || parsedExif.copyright),
        hasDeviceInfo: !!(parsedExif.make || parsedExif.model || parsedExif.software)
      }
    }
  }
  
  // Parse EXIF tags into structured data
  private static parseExifTags(exifData: any, options: ExifExtractionOptions): Partial<ExifData> {
    const result: Partial<ExifData> = {}
    
    // Camera/device info
    if (options.includeCameraInfo) {
      result.make = exifData.Make
      result.model = exifData.Model
      result.software = exifData.Software
    }
    
    // Photo settings
    result.dateTime = this.parseDateTime(exifData.DateTime || exifData.DateTimeOriginal)
    result.orientation = exifData.Orientation
    result.flash = this.parseFlash(exifData.Flash)
    result.focalLength = exifData.FocalLength
    result.aperture = exifData.FNumber
    result.shutterSpeed = this.parseShutterSpeed(exifData.ExposureTime)
    result.iso = exifData.ISOSpeedRatings
    result.whiteBalance = this.parseWhiteBalance(exifData.WhiteBalance)
    
    // GPS data
    if (options.includeGPS && exifData.GPSLatitude && exifData.GPSLongitude) {
      result.gps = this.parseGPS(exifData)
    }
    
    // Additional metadata
    if (options.includePrivateData) {
      result.copyright = exifData.Copyright
      result.artist = exifData.Artist
      result.description = exifData.ImageDescription
      result.keywords = this.parseKeywords(exifData.Keywords)
    }
    
    return result
  }
  
  // Parse GPS coordinates
  private static parseGPS(exifData: any): ExifData['gps'] | undefined {
    try {
      const lat = this.convertDMSToDD(
        exifData.GPSLatitude,
        exifData.GPSLatitudeRef
      )
      const lon = this.convertDMSToDD(
        exifData.GPSLongitude,
        exifData.GPSLongitudeRef
      )
      
      if (lat && lon) {
        return {
          latitude: lat,
          longitude: lon,
          altitude: exifData.GPSAltitude,
          timestamp: exifData.GPSTimeStamp ? this.parseGPSTime(exifData.GPSTimeStamp) : undefined
        }
      }
    } catch (error) {
      console.warn('Failed to parse GPS data:', error)
    }
    
    return undefined
  }
  
  // Convert DMS (Degrees Minutes Seconds) to DD (Decimal Degrees)
  private static convertDMSToDD(dms: number[], ref: string): number | null {
    if (!dms || dms.length !== 3) return null
    
    let dd = dms[0] + dms[1] / 60 + dms[2] / 3600
    
    if (ref === 'S' || ref === 'W') {
      dd = dd * -1
    }
    
    return dd
  }
  
  // Parse various EXIF values
  private static parseDateTime(dateTime: string): string | undefined {
    if (!dateTime) return undefined
    
    try {
      // EXIF date format: "YYYY:MM:DD HH:MM:SS"
      const formatted = dateTime.replace(/:/g, '-').replace(' ', 'T') + 'Z'
      return new Date(formatted).toISOString()
    } catch (error) {
      console.warn('Failed to parse date time:', dateTime, error)
      return dateTime
    }
  }
  
  private static parseFlash(flash: number): string | undefined {
    if (flash === undefined) return undefined
    
    const flashModes = {
      0: 'No Flash',
      1: 'Flash Fired',
      5: 'Flash Fired, Return not detected',
      7: 'Flash Fired, Return detected',
      9: 'Flash Fired, Compulsory Flash Mode',
      13: 'Flash Fired, Compulsory Flash Mode, Return not detected',
      15: 'Flash Fired, Compulsory Flash Mode, Return detected',
      16: 'No Flash, Compulsory Flash Mode',
      24: 'No Flash, Auto Mode',
      25: 'Flash Fired, Auto Mode',
      29: 'Flash Fired, Auto Mode, Return not detected',
      31: 'Flash Fired, Auto Mode, Return detected',
      32: 'No Flash Available',
      65: 'Flash Fired, Red Eye Reduction Mode',
      69: 'Flash Fired, Red Eye Reduction Mode, Return not detected',
      71: 'Flash Fired, Red Eye Reduction Mode, Return detected',
      73: 'Flash Fired, Compulsory Flash Mode, Red Eye Reduction Mode',
      77: 'Flash Fired, Compulsory Flash Mode, Red Eye Reduction Mode, Return not detected',
      79: 'Flash Fired, Compulsory Flash Mode, Red Eye Reduction Mode, Return detected',
      89: 'Flash Fired, Auto Mode, Red Eye Reduction Mode',
      93: 'Flash Fired, Auto Mode, Return not detected, Red Eye Reduction Mode',
      95: 'Flash Fired, Auto Mode, Return detected, Red Eye Reduction Mode'
    }
    
    return flashModes[flash as keyof typeof flashModes] || `Flash Code: ${flash}`
  }
  
  private static parseShutterSpeed(exposureTime: number): string | undefined {
    if (!exposureTime) return undefined
    
    if (exposureTime >= 1) {
      return `${exposureTime}s`
    } else {
      return `1/${Math.round(1 / exposureTime)}s`
    }
  }
  
  private static parseWhiteBalance(wb: number): string | undefined {
    if (wb === undefined) return undefined
    
    const whiteBalanceModes = {
      0: 'Auto',
      1: 'Manual'
    }
    
    return whiteBalanceModes[wb as keyof typeof whiteBalanceModes] || `WB: ${wb}`
  }
  
  private static parseGPSTime(gpsTime: number[]): string | undefined {
    if (!gpsTime || gpsTime.length !== 3) return undefined
    
    try {
      const hours = Math.floor(gpsTime[0])
      const minutes = Math.floor(gpsTime[1])
      const seconds = Math.floor(gpsTime[2])
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    } catch (error) {
      console.warn('Failed to parse GPS time:', gpsTime, error)
      return undefined
    }
  }
  
  private static parseKeywords(keywords: string): string[] | undefined {
    if (!keywords) return undefined
    
    return keywords.split(';').map(k => k.trim()).filter(k => k.length > 0)
  }
  
  // Remove sensitive EXIF data
  static async sanitizeImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const image = new Image()
        
        image.onload = () => {
          canvas.width = image.width
          canvas.height = image.height
          
          ctx?.drawImage(image, 0, 0)
          
          canvas.toBlob((blob) => {
            if (blob) {
              const sanitizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              })
              resolve(sanitizedFile)
            } else {
              reject(new Error('Failed to create sanitized image'))
            }
          }, file.type, 0.95)
        }
        
        image.onerror = () => {
          reject(new Error('Failed to load image for sanitization'))
        }
        
        image.src = URL.createObjectURL(file)
      } catch (error) {
        reject(error)
      }
    })
  }
  
  // Get location from GPS coordinates
  static async getLocationFromGPS(latitude: number, longitude: number): Promise<{
    address?: string
    city?: string
    country?: string
    postalCode?: string
  } | null> {
    try {
      // Using a free reverse geocoding service
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      )
      
      if (!response.ok) {
        throw new Error('Geocoding service unavailable')
      }
      
      const data = await response.json()
      
      return {
        address: data.localityInfo?.administrative?.[2]?.name,
        city: data.city,
        country: data.countryName,
        postalCode: data.postcode
      }
    } catch (error) {
      console.warn('Failed to get location from GPS:', error)
      return null
    }
  }
  
  // Format EXIF data for display
  static formatForDisplay(exifData: ExifData): Record<string, string> {
    const formatted: Record<string, string> = {}
    
    // Basic info
    formatted['File Name'] = exifData.fileName
    formatted['File Size'] = this.formatFileSize(exifData.fileSize)
    formatted['Dimensions'] = `${exifData.dimensions.width} × ${exifData.dimensions.height}`
    
    // Camera info
    if (exifData.make || exifData.model) {
      formatted['Camera'] = [exifData.make, exifData.model].filter(Boolean).join(' ')
    }
    
    if (exifData.software) {
      formatted['Software'] = exifData.software
    }
    
    // Photo settings
    if (exifData.dateTime) {
      formatted['Date Taken'] = new Date(exifData.dateTime).toLocaleString()
    }
    
    if (exifData.aperture) {
      formatted['Aperture'] = `f/${exifData.aperture}`
    }
    
    if (exifData.shutterSpeed) {
      formatted['Shutter Speed'] = exifData.shutterSpeed
    }
    
    if (exifData.iso) {
      formatted['ISO'] = exifData.iso.toString()
    }
    
    if (exifData.focalLength) {
      formatted['Focal Length'] = `${exifData.focalLength}mm`
    }
    
    if (exifData.flash) {
      formatted['Flash'] = exifData.flash
    }
    
    if (exifData.whiteBalance) {
      formatted['White Balance'] = exifData.whiteBalance
    }
    
    // GPS info
    if (exifData.gps) {
      formatted['GPS Coordinates'] = `${exifData.gps.latitude.toFixed(6)}, ${exifData.gps.longitude.toFixed(6)}`
      
      if (exifData.gps.altitude) {
        formatted['Altitude'] = `${exifData.gps.altitude}m`
      }
    }
    
    // Additional metadata
    if (exifData.artist) {
      formatted['Artist'] = exifData.artist
    }
    
    if (exifData.copyright) {
      formatted['Copyright'] = exifData.copyright
    }
    
    if (exifData.description) {
      formatted['Description'] = exifData.description
    }
    
    if (exifData.keywords && exifData.keywords.length > 0) {
      formatted['Keywords'] = exifData.keywords.join(', ')
    }
    
    return formatted
  }
  
  // Process raw EXIF tags
  private static parseExifTags(exifData: any, options: ExifExtractionOptions): Partial<ExifData> {
    const result: Partial<ExifData> = {}
    
    // Camera info
    if (options.includeCameraInfo) {
      result.make = exifData.Make
      result.model = exifData.Model
      result.software = exifData.Software
    }
    
    // Photo settings
    result.dateTime = this.parseDateTime(exifData.DateTime || exifData.DateTimeOriginal)
    result.orientation = exifData.Orientation
    result.flash = this.parseFlash(exifData.Flash)
    result.focalLength = exifData.FocalLength
    result.aperture = exifData.FNumber
    result.shutterSpeed = this.parseShutterSpeed(exifData.ExposureTime)
    result.iso = exifData.ISOSpeedRatings
    result.whiteBalance = this.parseWhiteBalance(exifData.WhiteBalance)
    
    // GPS data
    if (options.includeGPS && exifData.GPSLatitude && exifData.GPSLongitude) {
      result.gps = this.parseGPS(exifData)
    }
    
    // Personal info
    if (options.includePrivateData) {
      result.copyright = exifData.Copyright
      result.artist = exifData.Artist
      result.description = exifData.ImageDescription
      result.keywords = this.parseKeywords(exifData.Keywords || '')
    }
    
    return result
  }
  
  // Utility functions
  private static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`
  }
  
  // Generate privacy report
  static generatePrivacyReport(exifData: ExifData): {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
    findings: string[]
    recommendations: string[]
  } {
    const findings: string[] = []
    const recommendations: string[] = []
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'
    
    // Check for GPS data
    if (exifData.gps) {
      findings.push('📍 GPS location data found')
      recommendations.push('Consider removing GPS data before sharing')
      riskLevel = 'HIGH'
    }
    
    // Check for device info
    if (exifData.make || exifData.model) {
      findings.push('📱 Camera/device information found')
      if (riskLevel !== 'HIGH') riskLevel = 'MEDIUM'
    }
    
    // Check for personal info
    if (exifData.artist || exifData.copyright) {
      findings.push('👤 Personal information found')
      recommendations.push('Review personal metadata before sharing')
      if (riskLevel === 'LOW') riskLevel = 'MEDIUM'
    }
    
    // Check for timestamp
    if (exifData.dateTime) {
      findings.push('⏰ Timestamp data found')
      recommendations.push('Timestamp may reveal when and where photo was taken')
    }
    
    if (findings.length === 0) {
      findings.push('✅ No sensitive metadata detected')
      recommendations.push('Image appears safe to share')
    }
    
    return { riskLevel, findings, recommendations }
  }
  
  // Generate enhanced file info for task uploads
  static generateTaskUploadInfo(exifData: ExifData): {
    summary: string
    technicalDetails: Record<string, string>
    qualityScore: number
    suitabilityFlags: {
      isHighQuality: boolean
      hasLocation: boolean
      isRecent: boolean
      hasMetadata: boolean
    }
  } {
    const formatted = this.formatForDisplay(exifData)
    const { width, height } = exifData.dimensions
    
    // Calculate quality score (0-100)
    let qualityScore = 0
    
    // Resolution score (0-40)
    const megapixels = (width * height) / 1000000
    qualityScore += Math.min(40, megapixels * 5)
    
    // Metadata completeness (0-30)
    const metadataFields = ['make', 'model', 'dateTime', 'aperture', 'iso']
    const presentMetadata = metadataFields.filter(field => exifData[field as keyof ExifData]).length
    qualityScore += (presentMetadata / metadataFields.length) * 30
    
    // Recent photo bonus (0-20)
    if (exifData.dateTime) {
      const daysSinceCapture = (Date.now() - new Date(exifData.dateTime).getTime()) / (1000 * 60 * 60 * 24)
      qualityScore += Math.max(0, 20 - daysSinceCapture / 7) // Decrease over weeks
    }
    
    // GPS bonus (0-10)
    if (exifData.gps) {
      qualityScore += 10
    }
    
    qualityScore = Math.round(Math.min(100, qualityScore))
    
    const suitabilityFlags = {
      isHighQuality: width >= 1920 && height >= 1080,
      hasLocation: !!exifData.gps,
      isRecent: exifData.dateTime ? (Date.now() - new Date(exifData.dateTime).getTime()) < (30 * 24 * 60 * 60 * 1000) : false,
      hasMetadata: Object.keys(formatted).length > 3
    }
    
    let summary = `${width}×${height} image`
    if (exifData.make && exifData.model) {
      summary += ` from ${exifData.make} ${exifData.model}`
    }
    if (exifData.dateTime) {
      summary += ` taken ${this.getRelativeTime(exifData.dateTime)}`
    }
    
    return {
      summary,
      technicalDetails: formatted,
      qualityScore,
      suitabilityFlags
    }
  }
  
  private static getRelativeTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'today'
    if (diffDays === 1) return 'yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }
}

// React hook for EXIF processing
export function useEXIF() {
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [lastExifData, setLastExifData] = React.useState<ExifData | null>(null)
  
  const extractEXIF = async (file: File, options?: ExifExtractionOptions): Promise<ExifData> => {
    setIsProcessing(true)
    
    try {
      const exifData = await EXIFService.extractEXIF(file, options)
      setLastExifData(exifData)
      
      console.log('📷 EXIF data extracted:', {
        hasGPS: exifData.hasGPS,
        hasCameraInfo: exifData.hasCameraInfo,
        dimensions: exifData.dimensions
      })
      
      return exifData
    } catch (error) {
      console.error('EXIF extraction failed:', error)
      throw error
    } finally {
      setIsProcessing(false)
    }
  }
  
  const sanitizeImage = async (file: File): Promise<File> => {
    setIsProcessing(true)
    
    try {
      const sanitized = await EXIFService.sanitizeImage(file)
      
      console.log('🧹 Image sanitized:', {
        originalSize: file.size,
        sanitizedSize: sanitized.size,
        sizeReduction: ((file.size - sanitized.size) / file.size * 100).toFixed(1) + '%'
      })
      
      return sanitized
    } catch (error) {
      console.error('Image sanitization failed:', error)
      throw error
    } finally {
      setIsProcessing(false)
    }
  }
  
  const generatePrivacyReport = (exifData: ExifData) => {
    return EXIFService.generatePrivacyReport(exifData)
  }
  
  const generateTaskUploadInfo = (exifData: ExifData) => {
    return EXIFService.generateTaskUploadInfo(exifData)
  }
  
  return {
    isProcessing,
    lastExifData,
    extractEXIF,
    sanitizeImage,
    generatePrivacyReport,
    generateTaskUploadInfo
  }
}
