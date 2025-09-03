import React, { useState } from 'react'
import { Employee, Site } from '../../types'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { PlusIcon, TrashIcon } from 'lucide-react'

interface EmployeeFormProps {
  employee?: Employee
  sites: Site[]
  onSave: (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
  loading?: boolean
}

export function EmployeeForm({ employee, sites, onSave, onCancel, loading = false }: EmployeeFormProps) {
  const [formData, setFormData] = useState<Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>>({
    // Personal Information
    firstName: employee?.firstName || '',
    lastName: employee?.lastName || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    nationalId: employee?.nationalId || '',
    dateOfBirth: employee?.dateOfBirth || undefined,
    address: employee?.address || '',
    
    // Employment Information
    employeeNumber: employee?.employeeNumber || '',
    position: employee?.position || '',
    department: employee?.department || '',
    hireDate: employee?.hireDate || new Date(),
    terminationDate: employee?.terminationDate || undefined,
    status: employee?.status || 'ACTIVE',
    
    // Site Assignment
    siteId: employee?.siteId || '',
    
    // Payroll Information
    salary: {
      type: employee?.salary?.type || 'MONTHLY',
      amount: employee?.salary?.amount || 0,
      currency: 'LYD' as const,
    },
    
    // Payroll Settings
    payrollSettings: {
      overtimeRate: employee?.payrollSettings?.overtimeRate || 1.5,
      allowances: employee?.payrollSettings?.allowances || [],
      deductions: employee?.payrollSettings?.deductions || [],
    },
    
    // Legacy fields for compatibility
    name: employee?.name || '',
    baseSalary: employee?.baseSalary || 0,
    overtimeRate: employee?.overtimeRate || 1.5,
    deductionRules: employee?.deductionRules || [],
    bonusRules: employee?.bonusRules || [],
    joinedAt: employee?.joinedAt || new Date(),
    
    // Metadata
    createdBy: employee?.createdBy || '',
    active: employee?.active ?? true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const updatedData = {
        ...prev,
        [field]: value
      }
      
      // Auto-generate name from first and last name
      if (field === 'firstName' || field === 'lastName') {
        const firstName = field === 'firstName' ? value : prev.firstName
        const lastName = field === 'lastName' ? value : prev.lastName
        updatedData.name = `${firstName} ${lastName}`.trim()
      }
      
      return updatedData
    })
    
    // Sync salary amount with baseSalary
    if (field === 'salary') {
      setFormData(prev => ({
        ...prev,
        baseSalary: value.amount
      }))
    }
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }
    if (!formData.employeeNumber.trim()) {
      newErrors.employeeNumber = 'Employee number is required'
    }
    if (!formData.position.trim()) {
      newErrors.position = 'Position is required'
    }
    if (!formData.siteId) {
      newErrors.siteId = 'Site assignment is required'
    }
    if (formData.salary.amount <= 0) {
      newErrors.salary = 'Salary amount must be greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSave(formData)
    }
  }

  const addAllowance = () => {
    setFormData(prev => ({
      ...prev,
      payrollSettings: {
        ...prev.payrollSettings,
        allowances: [
          ...(prev.payrollSettings.allowances || []),
          { name: '', amount: 0, type: 'FIXED' as const }
        ]
      }
    }))
  }

  const removeAllowance = (index: number) => {
    setFormData(prev => ({
      ...prev,
      payrollSettings: {
        ...prev.payrollSettings,
        allowances: prev.payrollSettings.allowances?.filter((_, i) => i !== index) || []
      }
    }))
  }

  const updateAllowance = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      payrollSettings: {
        ...prev.payrollSettings,
        allowances: prev.payrollSettings.allowances?.map((allowance, i) => 
          i === index ? { ...allowance, [field]: value } : allowance
        ) || []
      }
    }))
  }

  const addDeduction = () => {
    setFormData(prev => ({
      ...prev,
      payrollSettings: {
        ...prev.payrollSettings,
        deductions: [
          ...(prev.payrollSettings.deductions || []),
          { name: '', amount: 0, type: 'FIXED' as const, mandatory: false }
        ]
      }
    }))
  }

  const removeDeduction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      payrollSettings: {
        ...prev.payrollSettings,
        deductions: prev.payrollSettings.deductions?.filter((_, i) => i !== index) || []
      }
    }))
  }

  const updateDeduction = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      payrollSettings: {
        ...prev.payrollSettings,
        deductions: prev.payrollSettings.deductions?.map((deduction, i) => 
          i === index ? { ...deduction, [field]: value } : deduction
        ) || []
      }
    }))
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {employee ? 'Edit Employee' : 'Add New Employee'}
          </h2>
          <div className="space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Employee'}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="salary">Salary & Payroll</TabsTrigger>
            <TabsTrigger value="allowances">Allowances & Deductions</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={errors.firstName ? 'border-red-500' : ''}
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={errors.lastName ? 'border-red-500' : ''}
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nationalId">National ID</Label>
                    <Input
                      id="nationalId"
                      value={formData.nationalId}
                      onChange={(e) => handleInputChange('nationalId', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth ? formData.dateOfBirth.toISOString().split('T')[0] : ''}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value ? new Date(e.target.value) : undefined)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employment">
            <Card>
              <CardHeader>
                <CardTitle>Employment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employeeNumber">Employee Number *</Label>
                    <Input
                      id="employeeNumber"
                      value={formData.employeeNumber}
                      onChange={(e) => handleInputChange('employeeNumber', e.target.value)}
                      className={errors.employeeNumber ? 'border-red-500' : ''}
                    />
                    {errors.employeeNumber && (
                      <p className="text-red-500 text-sm mt-1">{errors.employeeNumber}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="position">Position *</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      className={errors.position ? 'border-red-500' : ''}
                    />
                    {errors.position && (
                      <p className="text-red-500 text-sm mt-1">{errors.position}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="siteId">Site Assignment *</Label>
                    <Select value={formData.siteId} onValueChange={(value) => handleInputChange('siteId', value)}>
                      <SelectTrigger className={errors.siteId ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select a site" />
                      </SelectTrigger>
                      <SelectContent>
                        {sites.map((site) => (
                          <SelectItem key={site.id} value={site.id}>
                            {site.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.siteId && (
                      <p className="text-red-500 text-sm mt-1">{errors.siteId}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hireDate">Hire Date</Label>
                    <Input
                      id="hireDate"
                      type="date"
                      value={formData.hireDate.toISOString().split('T')[0]}
                      onChange={(e) => handleInputChange('hireDate', new Date(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                        <SelectItem value="TERMINATED">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="salary">
            <Card>
              <CardHeader>
                <CardTitle>Salary & Payroll Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="salaryType">Salary Type</Label>
                    <Select 
                      value={formData.salary.type} 
                      onValueChange={(value) => handleInputChange('salary', { ...formData.salary, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                        <SelectItem value="HOURLY">Hourly</SelectItem>
                        <SelectItem value="FIXED">Fixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="salaryAmount">Amount (LYD) *</Label>
                    <Input
                      id="salaryAmount"
                      type="number"
                      min="0"
                      step="0.001"
                      value={formData.salary.amount}
                      onChange={(e) => handleInputChange('salary', { 
                        ...formData.salary, 
                        amount: parseFloat(e.target.value) || 0 
                      })}
                      className={errors.salary ? 'border-red-500' : ''}
                    />
                    {errors.salary && (
                      <p className="text-red-500 text-sm mt-1">{errors.salary}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="overtimeRate">Overtime Rate</Label>
                    <Input
                      id="overtimeRate"
                      type="number"
                      min="1"
                      step="0.1"
                      value={formData.payrollSettings.overtimeRate}
                      onChange={(e) => handleInputChange('payrollSettings', {
                        ...formData.payrollSettings,
                        overtimeRate: parseFloat(e.target.value) || 1.5
                      })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="allowances">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Allowances</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={addAllowance}>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Allowance
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {formData.payrollSettings.allowances?.length === 0 ? (
                    <p className="text-muted-foreground">No allowances configured</p>
                  ) : (
                    <div className="space-y-3">
                      {formData.payrollSettings.allowances?.map((allowance, index) => (
                        <div key={index} className="grid grid-cols-4 gap-3 items-end">
                          <div>
                            <Label>Name</Label>
                            <Input
                              value={allowance.name}
                              onChange={(e) => updateAllowance(index, 'name', e.target.value)}
                              placeholder="e.g., Transportation"
                            />
                          </div>
                          <div>
                            <Label>Amount</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.001"
                              value={allowance.amount}
                              onChange={(e) => updateAllowance(index, 'amount', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <Label>Type</Label>
                            <Select 
                              value={allowance.type} 
                              onValueChange={(value) => updateAllowance(index, 'type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="FIXED">Fixed Amount</SelectItem>
                                <SelectItem value="PERCENTAGE">Percentage of Salary</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeAllowance(index)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Deductions</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={addDeduction}>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Deduction
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {formData.payrollSettings.deductions?.length === 0 ? (
                    <p className="text-muted-foreground">No deductions configured</p>
                  ) : (
                    <div className="space-y-3">
                      {formData.payrollSettings.deductions?.map((deduction, index) => (
                        <div key={index} className="grid grid-cols-5 gap-3 items-end">
                          <div>
                            <Label>Name</Label>
                            <Input
                              value={deduction.name}
                              onChange={(e) => updateDeduction(index, 'name', e.target.value)}
                              placeholder="e.g., Tax"
                            />
                          </div>
                          <div>
                            <Label>Amount</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.001"
                              value={deduction.amount}
                              onChange={(e) => updateDeduction(index, 'amount', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <Label>Type</Label>
                            <Select 
                              value={deduction.type} 
                              onValueChange={(value) => updateDeduction(index, 'type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="FIXED">Fixed Amount</SelectItem>
                                <SelectItem value="PERCENTAGE">Percentage of Salary</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`mandatory-${index}`}
                              checked={deduction.mandatory}
                              onChange={(e) => updateDeduction(index, 'mandatory', e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <Label htmlFor={`mandatory-${index}`} className="text-sm">
                              Mandatory
                            </Label>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeDeduction(index)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  )
}
