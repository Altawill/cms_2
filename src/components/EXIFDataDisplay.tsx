import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Separator } from './ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import {
  Camera,
  MapPin,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Info,
  Download,
  Eye,
  EyeOff,
  Star,
  Clock,
  Image as ImageIcon,
  Smartphone,
  Settings
} from 'lucide-react'
import { EXIFService, useEXIF, type ExifData } from '../services/exifService'
import { toast } from 'sonner'

interface EXIFDataDisplayProps {
  file: File
  onExifExtracted?: (exifData: ExifData) => void
  onImageOptimized?: (optimizedFile: File) => void
  showPrivacyWarnings?: boolean
  allowImageOptimization?: boolean
  className?: string
}

export default function EXIFDataDisplay({
  file,
  onExifExtracted,
  onImageOptimized,
  showPrivacyWarnings = true,
  allowImageOptimization = true,
  className = ''
}: EXIFDataDisplayProps) {
  const [exifData, setExifData] = useState<ExifData | null>(null)
  const [showSensitiveData, setShowSensitiveData] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  
  const { isProcessing, extractEXIF, sanitizeImage, generatePrivacyReport, generateTaskUploadInfo } = useEXIF()

  useEffect(() => {
    if (file) {
      handleExtractEXIF()
    }
  }, [file])

  const handleExtractEXIF = async () => {
    try {
      const extracted = await extractEXIF(file, {
        includeGPS: true,
        includeCameraInfo: true,
        includePrivateData: true
      })
      
      setExifData(extracted)
      onExifExtracted?.(extracted)
      
      console.log('📷 EXIF extracted:', extracted)
    } catch (error) {
      console.error('EXIF extraction failed:', error)
      toast.error('Failed to extract image metadata')
    }
  }

  const handleOptimizeImage = async () => {
    if (!exifData) return
    
    setIsOptimizing(true)
    
    try {
      const optimized = await sanitizeImage(file)
      onImageOptimized?.(optimized)
      
      toast.success('🖼️ Image optimized and metadata removed!')
    } catch (error) {
      console.error('Image optimization failed:', error)
      toast.error('Failed to optimize image')
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleDownloadCleanImage = async () => {
    if (!exifData) return
    
    try {
      const cleanImage = await sanitizeImage(file)
      
      // Create download link
      const url = URL.createObjectURL(cleanImage)
      const link = document.createElement('a')
      link.href = url
      link.download = `clean_${file.name}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('📥 Clean image downloaded!')
    } catch (error) {
      console.error('Failed to download clean image:', error)
      toast.error('Failed to create clean image')
    }
  }

  if (isProcessing) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-3">Analyzing image metadata...</span>
        </CardContent>
      </Card>
    )
  }

  if (!exifData) {
    return (
      <Card className={className}>
        <CardContent className="text-center p-6">
          <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No image metadata available</p>
          <Button onClick={handleExtractEXIF} className="mt-2" size="sm">
            Retry Analysis
          </Button>
        </CardContent>
      </Card>
    )
  }

  const privacyReport = generatePrivacyReport(exifData)
  const taskUploadInfo = generateTaskUploadInfo(exifData)
  const formattedData = EXIFService.formatForDisplay(exifData)

  const privacyColor = {
    LOW: 'text-green-600 bg-green-50 border-green-200',
    MEDIUM: 'text-yellow-600 bg-yellow-50 border-yellow-200', 
    HIGH: 'text-red-600 bg-red-50 border-red-200'
  }[privacyReport.riskLevel]

  const qualityColor = taskUploadInfo.qualityScore >= 80 
    ? 'text-green-600' 
    : taskUploadInfo.qualityScore >= 60 
    ? 'text-yellow-600' 
    : 'text-red-600'

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Image Metadata
          </div>
          
          <div className="flex items-center gap-2">
            {/* Privacy Risk Badge */}
            <Badge 
              variant="outline" 
              className={`${privacyColor} border-2`}
            >
              <Shield className="h-3 w-3 mr-1" />
              {privacyReport.riskLevel} Risk
            </Badge>
            
            {/* Quality Score */}
            <Badge variant="outline" className={qualityColor}>
              <Star className="h-3 w-3 mr-1" />
              {taskUploadInfo.qualityScore}% Quality
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">File Information</h4>
                <div className="text-sm space-y-1">
                  <div><span className="font-medium">Name:</span> {exifData.fileName}</div>
                  <div><span className="font-medium">Size:</span> {(exifData.fileSize / 1024 / 1024).toFixed(2)} MB</div>
                  <div><span className="font-medium">Dimensions:</span> {exifData.dimensions.width} × {exifData.dimensions.height}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Quality Assessment</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Quality Score</span>
                    <span className={`text-sm font-medium ${qualityColor}`}>
                      {taskUploadInfo.qualityScore}%
                    </span>
                  </div>
                  <Progress value={taskUploadInfo.qualityScore} className="h-2" />
                  
                  <div className="flex gap-1 flex-wrap">
                    {taskUploadInfo.suitabilityFlags.isHighQuality && (
                      <Badge variant="secondary" className="text-xs">HD Quality</Badge>
                    )}
                    {taskUploadInfo.suitabilityFlags.hasLocation && (
                      <Badge variant="secondary" className="text-xs">GPS Data</Badge>
                    )}
                    {taskUploadInfo.suitabilityFlags.isRecent && (
                      <Badge variant="secondary" className="text-xs">Recent</Badge>
                    )}
                    {taskUploadInfo.suitabilityFlags.hasMetadata && (
                      <Badge variant="secondary" className="text-xs">Rich Metadata</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Camera Info */}
            {exifData.hasCameraInfo && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Camera Information
                </h4>
                <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                  {exifData.make && <div><span className="font-medium">Make:</span> {exifData.make}</div>}
                  {exifData.model && <div><span className="font-medium">Model:</span> {exifData.model}</div>}
                  {exifData.software && <div><span className="font-medium">Software:</span> {exifData.software}</div>}
                  {exifData.dateTime && (
                    <div>
                      <span className="font-medium">Date Taken:</span> {new Date(exifData.dateTime).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* GPS Info */}
            {exifData.hasGPS && exifData.gps && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location Information
                  {!showSensitiveData && (
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      Hidden
                    </Badge>
                  )}
                </h4>
                
                {showSensitiveData ? (
                  <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                    <div>
                      <span className="font-medium">Coordinates:</span> 
                      {exifData.gps.latitude.toFixed(6)}, {exifData.gps.longitude.toFixed(6)}
                    </div>
                    {exifData.gps.altitude && (
                      <div><span className="font-medium">Altitude:</span> {exifData.gps.altitude}m</div>
                    )}
                    {exifData.gps.timestamp && (
                      <div><span className="font-medium">GPS Time:</span> {exifData.gps.timestamp}</div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSensitiveData(false)}
                      className="mt-2"
                    >
                      <EyeOff className="h-3 w-3 mr-1" />
                      Hide Location
                    </Button>
                  </div>
                ) : (
                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                    <p className="text-sm text-orange-700 mb-2">
                      🔒 Location data detected but hidden for privacy
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSensitiveData(true)}
                      className="text-orange-600 border-orange-600"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Show Location
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700 font-medium mb-1">Summary</p>
              <p className="text-sm text-blue-600">{taskUploadInfo.summary}</p>
            </div>
          </TabsContent>

          <TabsContent value="technical" className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Technical Details
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(taskUploadInfo.technicalDetails).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">{key}:</span>
                    <span className="text-sm text-gray-900 font-mono">{value}</span>
                  </div>
                ))}
              </div>
              
              {/* Photo Settings */}
              {(exifData.aperture || exifData.shutterSpeed || exifData.iso || exifData.focalLength) && (
                <div className="mt-4">
                  <h5 className="font-medium text-gray-700 mb-2">Camera Settings</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {exifData.aperture && (
                      <div className="bg-gray-50 p-2 rounded text-center">
                        <div className="text-xs text-gray-500">Aperture</div>
                        <div className="font-medium">f/{exifData.aperture}</div>
                      </div>
                    )}
                    {exifData.shutterSpeed && (
                      <div className="bg-gray-50 p-2 rounded text-center">
                        <div className="text-xs text-gray-500">Shutter</div>
                        <div className="font-medium">{exifData.shutterSpeed}</div>
                      </div>
                    )}
                    {exifData.iso && (
                      <div className="bg-gray-50 p-2 rounded text-center">
                        <div className="text-xs text-gray-500">ISO</div>
                        <div className="font-medium">{exifData.iso}</div>
                      </div>
                    )}
                    {exifData.focalLength && (
                      <div className="bg-gray-50 p-2 rounded text-center">
                        <div className="text-xs text-gray-500">Focal Length</div>
                        <div className="font-medium">{exifData.focalLength}mm</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Privacy Analysis
              </h4>
              
              {/* Risk Level */}
              <div className={`p-4 rounded-lg border-2 ${privacyColor} mb-4`}>
                <div className="flex items-center gap-2 mb-2">
                  {privacyReport.riskLevel === 'LOW' && <ShieldCheck className="h-5 w-5" />}
                  {privacyReport.riskLevel === 'MEDIUM' && <Shield className="h-5 w-5" />}
                  {privacyReport.riskLevel === 'HIGH' && <ShieldAlert className="h-5 w-5" />}
                  <span className="font-semibold">
                    {privacyReport.riskLevel} Privacy Risk
                  </span>
                </div>
                
                <div className="space-y-1">
                  {privacyReport.findings.map((finding, index) => (
                    <div key={index} className="text-sm">{finding}</div>
                  ))}
                </div>
              </div>
              
              {/* Recommendations */}
              {privacyReport.recommendations.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h5 className="font-medium text-blue-700 mb-2">Recommendations</h5>
                  <ul className="space-y-1">
                    {privacyReport.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-blue-600">• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Privacy Flags */}
              <div className="grid grid-cols-3 gap-2">
                <div className={`p-3 rounded-lg border text-center ${
                  exifData.privacyFlags.hasLocation ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                }`}>
                  <MapPin className={`h-4 w-4 mx-auto mb-1 ${
                    exifData.privacyFlags.hasLocation ? 'text-red-600' : 'text-green-600'
                  }`} />
                  <div className="text-xs font-medium">Location</div>
                  <div className={`text-xs ${
                    exifData.privacyFlags.hasLocation ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {exifData.privacyFlags.hasLocation ? 'Present' : 'Clean'}
                  </div>
                </div>
                
                <div className={`p-3 rounded-lg border text-center ${
                  exifData.privacyFlags.hasPersonalInfo ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                }`}>
                  <Info className={`h-4 w-4 mx-auto mb-1 ${
                    exifData.privacyFlags.hasPersonalInfo ? 'text-red-600' : 'text-green-600'
                  }`} />
                  <div className="text-xs font-medium">Personal</div>
                  <div className={`text-xs ${
                    exifData.privacyFlags.hasPersonalInfo ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {exifData.privacyFlags.hasPersonalInfo ? 'Present' : 'Clean'}
                  </div>
                </div>
                
                <div className={`p-3 rounded-lg border text-center ${
                  exifData.privacyFlags.hasDeviceInfo ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                }`}>
                  <Smartphone className={`h-4 w-4 mx-auto mb-1 ${
                    exifData.privacyFlags.hasDeviceInfo ? 'text-red-600' : 'text-green-600'
                  }`} />
                  <div className="text-xs font-medium">Device</div>
                  <div className={`text-xs ${
                    exifData.privacyFlags.hasDeviceInfo ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {exifData.privacyFlags.hasDeviceInfo ? 'Present' : 'Clean'}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Available Actions</h4>
              
              <div className="space-y-3">
                {/* Optimization Actions */}
                {allowImageOptimization && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h5 className="font-medium text-blue-700 mb-2">Image Optimization</h5>
                    <p className="text-sm text-blue-600 mb-3">
                      Remove metadata and optimize file size for faster uploads
                    </p>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={handleOptimizeImage}
                        disabled={isOptimizing}
                        size="sm"
                      >
                        {isOptimizing ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1"></div>
                            Optimizing...
                          </>
                        ) : (
                          <>
                            <ImageIcon className="h-3 w-3 mr-1" />
                            Optimize & Use
                          </>
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={handleDownloadCleanImage}
                        size="sm"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download Clean
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Privacy Actions */}
                {showPrivacyWarnings && privacyReport.riskLevel !== 'LOW' && (
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <h5 className="font-medium text-orange-700 mb-2">Privacy Protection</h5>
                    <p className="text-sm text-orange-600 mb-3">
                      This image contains sensitive metadata that may compromise privacy
                    </p>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowSensitiveData(!showSensitiveData)}
                        size="sm"
                        className="text-orange-600 border-orange-600"
                      >
                        {showSensitiveData ? (
                          <>
                            <EyeOff className="h-3 w-3 mr-1" />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            Show Details
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* File Info Actions */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-700 mb-2">File Information</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Processing:</span>
                      <div className="text-gray-600">
                        Extracted {Object.keys(formattedData).length} metadata fields
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Timestamp:</span>
                      <div className="text-gray-600">
                        {new Date(exifData.extractedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Compact EXIF summary component
export function EXIFSummary({ 
  exifData, 
  className = '' 
}: { 
  exifData: ExifData
  className?: string 
}) {
  const privacyReport = EXIFService.generatePrivacyReport(exifData)
  const taskUploadInfo = EXIFService.generateTaskUploadInfo(exifData)
  
  const riskColor = {
    LOW: 'text-green-600',
    MEDIUM: 'text-yellow-600',
    HIGH: 'text-red-600'
  }[privacyReport.riskLevel]
  
  const qualityColor = taskUploadInfo.qualityScore >= 80 
    ? 'text-green-600' 
    : taskUploadInfo.qualityScore >= 60 
    ? 'text-yellow-600' 
    : 'text-red-600'

  return (
    <div className={`flex items-center gap-4 p-3 bg-gray-50 rounded-lg ${className}`}>
      <div className="flex items-center gap-2">
        <Camera className="h-4 w-4 text-gray-600" />
        <span className="text-sm font-medium">
          {exifData.dimensions.width}×{exifData.dimensions.height}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <Star className={`h-4 w-4 ${qualityColor}`} />
        <span className={`text-sm font-medium ${qualityColor}`}>
          {taskUploadInfo.qualityScore}%
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <Shield className={`h-4 w-4 ${riskColor}`} />
        <span className={`text-sm font-medium ${riskColor}`}>
          {privacyReport.riskLevel} Risk
        </span>
      </div>
      
      {exifData.hasGPS && (
        <Badge variant="outline" className="text-orange-600 border-orange-600">
          <MapPin className="h-3 w-3 mr-1" />
          GPS
        </Badge>
      )}
      
      {exifData.hasCameraInfo && (
        <Badge variant="outline" className="text-blue-600 border-blue-600">
          <Camera className="h-3 w-3 mr-1" />
          {exifData.make} {exifData.model}
        </Badge>
      )}
    </div>
  )
}

// EXIF-aware image upload preview
export function EXIFImagePreview({
  file,
  onExifExtracted,
  className = ''
}: {
  file: File
  onExifExtracted?: (exifData: ExifData) => void
  className?: string
}) {
  const [imageUrl, setImageUrl] = useState<string>('')
  const [exifData, setExifData] = useState<ExifData | null>(null)
  
  const { extractEXIF } = useEXIF()

  useEffect(() => {
    // Create image URL
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    
    // Extract EXIF
    extractEXIF(file).then(data => {
      setExifData(data)
      onExifExtracted?.(data)
    }).catch(console.error)
    
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [file])

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Image Preview */}
      <div className="relative">
        <img
          src={imageUrl}
          alt="Upload preview"
          className="w-full h-48 object-cover rounded-lg border"
        />
        
        {exifData && (
          <div className="absolute top-2 right-2 flex gap-1">
            {exifData.hasGPS && (
              <Badge className="bg-orange-600 text-white">
                <MapPin className="h-3 w-3 mr-1" />
                GPS
              </Badge>
            )}
            {exifData.hasCameraInfo && (
              <Badge className="bg-blue-600 text-white">
                <Camera className="h-3 w-3 mr-1" />
                EXIF
              </Badge>
            )}
          </div>
        )}
      </div>
      
      {/* EXIF Summary */}
      {exifData && <EXIFSummary exifData={exifData} />}
    </div>
  )
}
