import React, { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Upload, 
  X, 
  FileText, 
  Image, 
  File, 
  Camera,
  Download,
  Eye,
  Shield,
  Star,
  Settings,
  WifiOff,
  AlertTriangle
} from 'lucide-react'
import { TaskAttachment } from '../../types'
import { cn } from '../../utils'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { EXIFImagePreview, EXIFSummary } from '../EXIFDataDisplay'
import { useEXIF, type ExifData } from '../../services/exifService'
import { useOffline, offlineUtils } from '../../services/offlineService'
import { useAuditTrail } from '../../services/auditTrailService'
import { toast } from 'sonner'

interface AttachmentUploadProps {
  attachments: File[] | TaskAttachment[]
  onAdd: (files: File[]) => void
  onRemove: (index: number) => void
  onPreview?: (attachment: File | TaskAttachment) => void
  maxFiles?: number
  maxFileSize?: number // in MB
  acceptedTypes?: string[]
  disabled?: boolean
  className?: string
  // Enhanced features
  taskId?: string
  showEXIFInfo?: boolean
  autoOptimizeImages?: boolean
  requirePrivacyCheck?: boolean
}

interface FileWithMetadata {
  file: File
  exifData?: ExifData
  optimized?: boolean
  privacyChecked?: boolean
}

const defaultAcceptedTypes = ['image/*', '.pdf', '.doc', '.docx', '.txt']
const defaultMaxFileSize = 10 // 10MB

export default function AttachmentUpload({
  attachments,
  onAdd,
  onRemove,
  onPreview,
  maxFiles = 10,
  maxFileSize = defaultMaxFileSize,
  acceptedTypes = defaultAcceptedTypes,
  disabled = false,
  className,
  // Enhanced features
  taskId,
  showEXIFInfo = true,
  autoOptimizeImages = true,
  requirePrivacyCheck = true
}: AttachmentUploadProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [processingFiles, setProcessingFiles] = useState<Map<string, FileWithMetadata>>(new Map())
  const [showEXIFDetails, setShowEXIFDetails] = useState(false)
  
  // Gold-plating service hooks
  const { extractEXIF, sanitizeImage, generatePrivacyReport } = useEXIF()
  const { isOnline, queueAction } = useOffline()
  const { logEvent } = useAuditTrail()

  // Enhanced file processing with EXIF and optimization
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || disabled) return

    const fileArray = Array.from(files)
    const validFiles: File[] = []
    const errors: string[] = []

    for (const file of fileArray) {
      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        errors.push(t('attachments.fileTooLarge', { name: file.name, size: maxFileSize }))
        continue
      }

      // Check file type
      const isValidType = acceptedTypes.some(type => {
        if (type.includes('*')) {
          return file.type.startsWith(type.replace('*', ''))
        }
        return file.name.toLowerCase().endsWith(type) || file.type === type
      })

      if (!isValidType) {
        errors.push(t('attachments.invalidFileType', { name: file.name }))
        continue
      }

      // Process image files with EXIF extraction
      if (file.type.startsWith('image/') && showEXIFInfo) {
        try {
          await processImageFile(file)
        } catch (error) {
          console.warn('EXIF processing failed for', file.name, error)
        }
      }

      validFiles.push(file)
    }

    // Check total file limit
    if (attachments.length + validFiles.length > maxFiles) {
      errors.push(t('attachments.tooManyFiles', { max: maxFiles }))
      toast.error(t('attachments.tooManyFiles', { max: maxFiles }))
      return
    }

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error))
    }

    if (validFiles.length > 0) {
      // Queue offline upload if not online
      if (!isOnline && taskId) {
        await queueOfflineUploads(validFiles)
      }
      
      onAdd(validFiles)
      
      // Log audit event
      logEvent({
        type: 'FILE_UPLOADED',
        entityType: 'task',
        entityId: taskId || 'unknown',
        description: `${validFiles.length} file(s) uploaded: ${validFiles.map(f => f.name).join(', ')}`,
        metadata: {
          fileCount: validFiles.length,
          totalSize: validFiles.reduce((sum, f) => sum + f.size, 0),
          offline: !isOnline
        }
      })
      
      toast.success(`✅ ${validFiles.length} file(s) uploaded${!isOnline ? ' (offline)' : ''}!`)
    }
  }

  // Process image file with EXIF extraction
  const processImageFile = async (file: File): Promise<void> => {
    try {
      const exifData = await extractEXIF(file, {
        includeGPS: true,
        includeCameraInfo: true,
        includePrivateData: false // Don't include sensitive data by default
      })
      
      // Store file metadata
      const fileMetadata: FileWithMetadata = {
        file,
        exifData,
        optimized: false,
        privacyChecked: false
      }
      
      setProcessingFiles(prev => new Map(prev.set(file.name, fileMetadata)))
      
      // Check privacy if required
      if (requirePrivacyCheck) {
        const privacyReport = generatePrivacyReport(exifData)
        
        if (privacyReport.riskLevel === 'HIGH') {
          toast.warning('⚠️ Image contains sensitive metadata (GPS, personal info)')
          
          // Auto-optimize if enabled
          if (autoOptimizeImages) {
            await handleOptimizeImage(file, exifData)
          }
        }
      }
      
      console.log('📷 EXIF processed:', {
        file: file.name,
        hasGPS: exifData.hasGPS,
        quality: exifData.dimensions
      })
      
    } catch (error) {
      console.warn('EXIF processing failed:', error)
    }
  }

  // Optimize image and remove sensitive metadata
  const handleOptimizeImage = async (originalFile: File, exifData: ExifData): Promise<void> => {
    try {
      const optimizedFile = await sanitizeImage(originalFile)
      
      // Update processing state
      setProcessingFiles(prev => {
        const updated = new Map(prev)
        const existing = updated.get(originalFile.name)
        if (existing) {
          updated.set(originalFile.name, {
            ...existing,
            file: optimizedFile,
            optimized: true,
            privacyChecked: true
          })
        }
        return updated
      })
      
      // Replace file in attachments
      const fileIndex = attachments.findIndex(f => 
        f instanceof File && f.name === originalFile.name
      )
      
      if (fileIndex >= 0) {
        const newAttachments = [...attachments]
        newAttachments[fileIndex] = optimizedFile
        onAdd([optimizedFile])
        onRemove(fileIndex)
      }
      
      toast.success('🖼️ Image optimized and metadata removed!')
      
    } catch (error) {
      console.error('Image optimization failed:', error)
      toast.error('Failed to optimize image')
    }
  }

  // Queue files for offline upload
  const queueOfflineUploads = async (files: File[]): Promise<void> => {
    if (!taskId) return
    
    try {
      for (const file of files) {
        await offlineUtils.uploadOfflineFile(file, taskId, 'task')
      }
      
      toast.success('📱 Files queued for upload when online')
    } catch (error) {
      console.error('Failed to queue offline uploads:', error)
      toast.error('Failed to queue files for offline upload')
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (disabled) return
    handleFileSelect(e.dataTransfer.files)
  }

  const getFileIcon = (file: File | TaskAttachment) => {
    const fileName = 'name' in file ? file.name : file.name
    const fileType = 'type' in file ? file.type : ''
    
    if (fileType.startsWith('image/') || fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      return <Image className="h-4 w-4 text-blue-500" />
    }
    if (fileType.includes('pdf') || fileName.toLowerCase().endsWith('.pdf')) {
      return <FileText className="h-4 w-4 text-red-500" />
    }
    return <File className="h-4 w-4 text-muted-foreground" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-all',
          dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="space-y-3">
          <div className="flex justify-center">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {t('attachments.uploadFiles')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('attachments.dragDropOrClick')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('attachments.maxSize', { size: maxFileSize })} • {t('attachments.maxFiles', { count: maxFiles })}
            </p>
          </div>
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className={cn(
              'px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md transition-colors',
              disabled 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-primary/90'
            )}
          >
            {t('attachments.selectFiles')}
          </button>
        </div>
      </div>

      {/* Enhanced Attachment List with EXIF Info */}
      {attachments.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">
              {t('attachments.attachedFiles')} ({attachments.length})
            </h4>
            
            {/* Offline status */}
            {!isOnline && (
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                <WifiOff className="h-3 w-3 mr-1" />
                Offline Mode
              </Badge>
            )}
          </div>
          
          <div className="space-y-3">
            {attachments.map((attachment, index) => {
              const isFile = attachment instanceof File
              const name = isFile ? attachment.name : attachment.name
              const size = isFile ? attachment.size : attachment.size || 0
              const fileMetadata = isFile ? processingFiles.get(attachment.name) : null
              const isImageFile = isFile && attachment.type.startsWith('image/')
              
              return (
                <div key={index} className="space-y-2">
                  {/* File Info Row */}
                  <div className="flex items-center justify-between p-3 bg-muted rounded-md border border-border">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {getFileIcon(attachment)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">
                            {name}
                          </p>
                          
                          {/* Enhanced badges for images */}
                          {fileMetadata?.exifData && (
                            <div className="flex gap-1">
                              {fileMetadata.exifData.hasGPS && (
                                <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
                                  <Shield className="h-2 w-2 mr-1" />
                                  GPS
                                </Badge>
                              )}
                              
                              {fileMetadata.optimized && (
                                <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                                  <Star className="h-2 w-2 mr-1" />
                                  Optimized
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(size)}
                          </p>
                          
                          {fileMetadata?.exifData && (
                            <>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-muted-foreground">
                                {fileMetadata.exifData.dimensions.width}×{fileMetadata.exifData.dimensions.height}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* EXIF info toggle for images */}
                      {isImageFile && fileMetadata?.exifData && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowEXIFDetails(!showEXIFDetails)}
                          className="h-6 w-6 p-0"
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                      )}
                      
                      {onPreview && (
                        <button
                          type="button"
                          onClick={() => onPreview(attachment)}
                          className="p-1 text-muted-foreground hover:text-primary transition-colors"
                          title={t('attachments.preview')}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      
                      {!isFile && 'url' in attachment && (
                        <a
                          href={attachment.url}
                          download={attachment.name}
                          className="p-1 text-muted-foreground hover:text-primary transition-colors"
                          title={t('attachments.download')}
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => onRemove(index)}
                        className="p-1 text-red-500 hover:text-red-700 transition-colors"
                        title={t('attachments.remove')}
                        disabled={disabled}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* EXIF Details (expandable) */}
                  {isImageFile && fileMetadata?.exifData && showEXIFDetails && (
                    <div className="ml-4">
                      <EXIFSummary exifData={fileMetadata.exifData} className="text-xs" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
              // In a real app, this would open camera capture
              console.log('Camera capture would be implemented here')
            }
          }}
          disabled={disabled}
          className={cn(
            'flex items-center space-x-1 px-3 py-2 text-xs bg-secondary hover:bg-secondary/80 rounded-md transition-colors',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Camera className="h-3 w-3" />
          <span>{t('attachments.takePhoto')}</span>
        </button>
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className={cn(
            'flex items-center space-x-1 px-3 py-2 text-xs bg-secondary hover:bg-secondary/80 rounded-md transition-colors',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Upload className="h-3 w-3" />
          <span>{t('attachments.uploadFromDevice')}</span>
        </button>
      </div>
    </div>
  )
}
