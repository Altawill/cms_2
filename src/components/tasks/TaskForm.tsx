import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon, MapPin, Users, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { TaskSchema } from '../../schemas/task'
import { Task, Employee, TaskStatus, TaskPriority, TaskCategory } from '../../types'
import { cn } from '../../utils'

interface TaskFormProps {
  task?: Task
  siteId: string
  employees: Employee[]
  onSubmit: (taskData: Partial<Task>) => void
  onCancel: () => void
  isLoading?: boolean
}

type TaskFormData = {
  name: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  category: TaskCategory
  location: string
  expectedStartDate: Date | null
  expectedCompletionDate: Date | null
  estimatedHours: number
  manpower: number
  executorId: string
  supervisorId: string
  billable: boolean
  budgetAmount: number
  notes: string
}

const statusOptions: TaskStatus[] = ['PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']
const priorityOptions: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const categoryOptions: TaskCategory[] = [
  'FOUNDATION', 'STRUCTURAL', 'ELECTRICAL', 'PLUMBING', 'HVAC', 
  'FINISHING', 'LANDSCAPING', 'OTHER'
]

export default function TaskForm({ 
  task, 
  siteId, 
  employees, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: TaskFormProps) {
  const { t } = useTranslation()
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<TaskFormData>({
    resolver: zodResolver(TaskSchema.omit({ 
      id: true, 
      code: true, 
      siteId: true, 
      progress: true,
      createdAt: true,
      updatedAt: true 
    })),
    defaultValues: {
      name: task?.name || '',
      description: task?.description || '',
      status: task?.status || 'PLANNED',
      priority: task?.priority || 'MEDIUM',
      category: task?.category || 'OTHER',
      location: task?.location || '',
      expectedStartDate: task?.expectedStartDate || null,
      expectedCompletionDate: task?.expectedCompletionDate || null,
      estimatedHours: task?.estimatedHours || 0,
      manpower: task?.manpower || 1,
      executorId: task?.executorId || '',
      supervisorId: task?.supervisorId || '',
      billable: task?.billable || false,
      budgetAmount: task?.budgetAmount || 0,
      notes: task?.notes || ''
    }
  })

  const watchBillable = watch('billable')

  const handleFormSubmit = (data: TaskFormData) => {
    onSubmit({
      ...data,
      siteId,
      progress: task?.progress || 0,
      ...(task && { id: task.id })
    })
  }

  return (
    <div className="max-w-4xl mx-auto bg-card border border-border rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">
          {task ? t('tasks.editTask') : t('tasks.createTask')}
        </h2>
      </div>
      
      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t('tasks.name')} *
            </label>
            <input
              {...register('name')}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder={t('tasks.namePlaceholder')}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t('tasks.category')} *
            </label>
            <select
              {...register('category')}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {t(`tasks.category.${cat.toLowerCase()}`)}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-xs text-red-500">{errors.category.message}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {t('tasks.description')}
          </label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder={t('tasks.descriptionPlaceholder')}
          />
        </div>

        {/* Status and Priority */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t('tasks.status')} *
            </label>
            <select
              {...register('status')}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {t(`tasks.status.${status.toLowerCase()}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t('tasks.priority')} *
            </label>
            <select
              {...register('priority')}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {priorityOptions.map((priority) => (
                <option key={priority} value={priority}>
                  {t(`tasks.priority.${priority.toLowerCase()}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {t('tasks.location')}
            </label>
            <input
              {...register('location')}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder={t('tasks.locationPlaceholder')}
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1" />
              {t('tasks.expectedStartDate')}
            </label>
            <input
              type="datetime-local"
              {...register('expectedStartDate', {
                setValueAs: (value) => value ? new Date(value) : null
              })}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1" />
              {t('tasks.expectedCompletionDate')}
            </label>
            <input
              type="datetime-local"
              {...register('expectedCompletionDate', {
                setValueAs: (value) => value ? new Date(value) : null
              })}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Resource Planning */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t('tasks.estimatedHours')}
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              {...register('estimatedHours', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {t('tasks.manpower')}
            </label>
            <input
              type="number"
              min="1"
              {...register('manpower', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Billable Toggle */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              {t('tasks.billable')}
            </label>
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                {...register('billable')}
                className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
              />
              <span className="text-xs text-muted-foreground">
                {t('tasks.billableDescription')}
              </span>
            </div>
          </div>
        </div>

        {/* Budget Amount (shown only if billable) */}
        {watchBillable && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t('tasks.budgetAmount')} (LYD)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              {...register('budgetAmount', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="0.00"
            />
          </div>
        )}

        {/* Staff Assignment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t('tasks.executor')}
            </label>
            <select
              {...register('executorId')}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">{t('common.select')}</option>
              {employees
                .filter(emp => emp.role === 'WORKER' || emp.role === 'FOREMAN')
                .map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} - {t(`employees.role.${emp.role.toLowerCase()}`)}
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t('tasks.supervisor')}
            </label>
            <select
              {...register('supervisorId')}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">{t('common.select')}</option>
              {employees
                .filter(emp => emp.role === 'FOREMAN' || emp.role === 'MANAGER' || emp.role === 'ADMIN')
                .map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} - {t(`employees.role.${emp.role.toLowerCase()}`)}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {t('tasks.notes')}
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder={t('tasks.notesPlaceholder')}
          />
        </div>

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
            {isLoading 
              ? t('common.saving') 
              : task 
                ? t('common.update') 
                : t('common.create')
            }
          </button>
        </div>
      </form>
    </div>
  )
}
