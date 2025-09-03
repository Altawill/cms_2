import React from 'react'
import { useTranslation } from 'react-i18next'
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign,
  Clock,
  MapPin,
  MoreVertical
} from 'lucide-react'
import { Employee } from '../../types'
import { format } from 'date-fns'

interface EmployeeCardProps {
  employee: Employee
  onClick: (employee: Employee) => void
  onEdit: (employee: Employee) => void
  onDelete: (employee: Employee) => void
}

export default function EmployeeCard({ 
  employee, 
  onClick, 
  onEdit, 
  onDelete 
}: EmployeeCardProps) {
  const { t } = useTranslation()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LY', {
      style: 'currency',
      currency: 'LYD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  return (
    <div 
      onClick={() => onClick(employee)}
      className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-primary/50 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-lg font-semibold text-primary">
              {employee.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {employee.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {employee.position}
            </p>
          </div>
        </div>
        
        {/* Actions Menu */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation()
                // Show dropdown menu
              }}
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        {employee.phone && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{employee.phone}</span>
          </div>
        )}
        {employee.email && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="truncate">{employee.email}</span>
          </div>
        )}
      </div>

      {/* Salary Info */}
      <div className="bg-muted/50 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-foreground">Base Salary</span>
          </div>
          <span className="text-sm font-bold text-green-600">
            {formatCurrency(employee.baseSalary)}
          </span>
        </div>
        {employee.overtimeRate > 0 && (
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">Overtime Rate</span>
            </div>
            <span className="text-sm text-blue-600">
              {formatCurrency(employee.overtimeRate)}/hr
            </span>
          </div>
        )}
      </div>

      {/* Employment Info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center space-x-1">
          <Calendar className="h-3 w-3" />
          <span>
            Joined {format(employee.joinedAt, 'MMM dd, yyyy')}
          </span>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          employee.active 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
          {employee.active ? 'Active' : 'Inactive'}
        </div>
      </div>

      {/* Benefits & Deductions Indicators */}
      {(employee.bonusRules.length > 0 || employee.deductionRules.length > 0) && (
        <div className="flex items-center space-x-4 mt-3 pt-3 border-t border-border">
          {employee.bonusRules.length > 0 && (
            <div className="flex items-center space-x-1 text-xs text-green-600">
              <span>💰</span>
              <span>{employee.bonusRules.length} bonus{employee.bonusRules.length > 1 ? 'es' : ''}</span>
            </div>
          )}
          {employee.deductionRules.length > 0 && (
            <div className="flex items-center space-x-1 text-xs text-orange-600">
              <span>📉</span>
              <span>{employee.deductionRules.length} deduction{employee.deductionRules.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
