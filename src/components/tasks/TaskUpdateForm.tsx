import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  Camera, 
  MapPin, 
  FileText, 
  Upload, 
  X, 
  AlertCircle,
  Check
} from 'lucide-react'
import { TaskUpdateSchema } from '../../schemas/task'
import { TaskUpdate, TaskStatus } from '../../types'
import { cn } from '../../utils'
import ProgressBar from './ProgressBar'

interface TaskUpdateFormProps {
  taskId: string
  currentProgress: number
  currentStatus: TaskStatus
  onSubmit: (updateData: Partial<TaskUpdate>) => void
  onCancel: () => void
  isLoading?: boolean
  quickMode?: boolean
}

type TaskUpdateFormData = {
  description: string
  newProgress: number
  newStatus: TaskStatus
  location: string
  notes: string
}

const statusOptions: TaskStatus[] = ['PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']

export default function TaskUpdateForm({ 
  taskId, 
  currentProgress, 
  currentStatus,
  onSubmit, 
  onCancel, 
  isLoading = false,
  quickMode = false
}: TaskUpdateFormProps) {
  const { t } = useTranslation()
  const [attachments, setAttachments] = useState<File[]>([])
  const [previewProgress, setPreviewProgress] = useState(currentProgress)
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<TaskUpdateFormData>({
    resolver: zodResolver(TaskUpdateSchema.omit({ 
      id: true, 
      taskId: true, 
      userId: true,
      attachments: true,
      createdAt: true 
    })),
    defaultValues: {
      description: '',
      newProgress: currentProgress,
      newStatus: currentStatus,
      location: '',
      notes: ''
    }
  })

  const watchProgress = watch('newProgress')
  
  React.useEffect(() => {
    setPreviewProgress(watchProgress || currentProgress)
  }, [watchProgress, currentProgress])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setAttachments(prev => [...prev, ...files])
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleFormSubmit = (data: TaskUpdateFormData) => {
    onSubmit({
      ...data,
      taskId,
      attachments: attachments.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file) // In real app, this would be uploaded to storage
      }))
    })
  }

  const getProgressSuggestions = () => {
    const suggestions = []
    if (currentProgress < 25) suggestions.push(25)
    if (currentProgress < 50) suggestions.push(50)
    if (currentProgress < 75) suggestions.push(75)
    if (currentProgress < 100) suggestions.push(100)
    return suggestions
  }

  if (quickMode) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-sm max-w-md mx-auto">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-md font-semibold text-foreground">
            {t('tasks.quickUpdate')}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 space-y-4">
          {/* Progress Update */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              {t('tasks.updateProgress')}
            </label>
            <ProgressBar 
              progress={previewProgress} 
              showPercentage={true}
              animated={previewProgress !== currentProgress}
            />
            <input
              type="range"
              min={currentProgress}
              max="100"
              {...register('newProgress', { valueAsNumber: true })}
              className="w-full"
            />
            <div className="flex space-x-2">
              {getProgressSuggestions().map(value => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue('newProgress', value)}
                  className="px-2 py-1 text-xs bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
                >
                  {value}%
                </button>
              ))}
            </div>
          </div>

          {/* Quick Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t('tasks.updateDescription')} *
            </label>
            <textarea
              {...register('description')}
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder={t('tasks.updateDescriptionPlaceholder')}
            />
            {errors.description && (
              <p className="text-xs text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-2 text-sm text-muted-foreground bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md transition-colors",
                isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/90"
              )}
            >
              {isLoading ? t('common.updating') : t('tasks.addUpdate')}
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto bg-card border border-border rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">
          {t('tasks.addProgressUpdate')}
        </h2>
      </div>
      
      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
        {/* Progress Update */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            {t('tasks.updateProgress')} ({currentProgress}% → {previewProgress}%)
          </label>
          <ProgressBar 
            progress={previewProgress} 
            showPercentage={true}
            size="lg"
            animated={previewProgress !== currentProgress}
          />
          <input
            type="range"
            min={currentProgress}
            max="100"
            {...register('newProgress', { valueAsNumber: true })}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t('tasks.current')}: {currentProgress}%</span>
            <span>{t('tasks.new')}: {previewProgress}%</span>
          </div>
        </div>

        {/* Status Update */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {t('tasks.updateStatus')}
          </label>
          <select
            {...register('newStatus')}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {t(`tasks.status.${status.toLowerCase()}`)}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {t('tasks.updateDescription')} *
          </label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder={t('tasks.updateDescriptionPlaceholder')}
          />
          {errors.description && (
            <p className="text-xs text-red-500">{errors.description.message}</p>
          )}
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            {t('tasks.updateLocation')}
          </label>
          <input
            {...register('location')}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder={t('tasks.locationPlaceholder')}
          />
        </div>

        {/* File Attachments */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground flex items-center">
            <Camera className="h-4 w-4 mr-1" />
            {t('tasks.attachments')}
          </label>
          
          <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center space-y-2"
            >
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {t('tasks.uploadFiles')}
              </span>
              <span className="text-xs text-muted-foreground">
                {t('tasks.supportedFormats')}
              </span>
            </label>
          </div>

          {/* Attachment List */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Additional Notes */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {t('tasks.additionalNotes')}
          </label>
          <textarea
            {...register('notes')}
            rows={2}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder={t('tasks.notesPlaceholder')}
          />
        </div>

        {/* Progress Alert */}
        {previewProgress === 100 && (
          <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800 dark:text-green-200">
              {t('tasks.taskWillBeCompleted')}
            </span>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-border">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-muted-foreground bg-secondary hover:bg-secondary/80 border border-border rounded-md transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "px-6 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md transition-colors",
              isLoading 
                ? "opacity-50 cursor-not-allowed" 
                : "hover:bg-primary/90"
            )}
          >
            {isLoading ? t('common.updating') : t('tasks.addUpdate')}
          </button>
        </div>
      </form>
    </div>
  )
}
