import React, { useState, useEffect } from 'react'
import { Employee, Site } from '../types'
import { EmployeeList } from '../components/employees/EmployeeList'
import { EmployeeForm } from '../components/employees/EmployeeForm'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog'
import { useToast } from '../components/ui/use-toast'
import { employeesRepo, sitesRepo } from '../services/repository'
import { useAuth } from '../state/useAuth'

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Dialog states
  const [showForm, setShowForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>()
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | undefined>()

  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [employeesData, sitesData] = await Promise.all([
        employeesRepo.getAll(),
        sitesRepo.getAll()
      ])
      setEmployees(employeesData as Employee[])
      setSites(sitesData as Site[])
    } catch (error) {
      console.error('Failed to load data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load employees and sites',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddEmployee = () => {
    setEditingEmployee(undefined)
    setShowForm(true)
  }

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee)
    setShowForm(true)
  }

  const handleViewEmployee = (employee: Employee) => {
    // TODO: Implement employee details view
    console.log('Viewing employee:', employee)
    toast({
      title: 'Feature Coming Soon',
      description: 'Employee details view will be implemented soon.',
    })
  }

  const handleDeleteEmployee = (employee: Employee) => {
    setDeletingEmployee(employee)
  }

  const handleSaveEmployee = async (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setSaving(true)
      
      // Prepare the employee data with proper legacy field mapping
      const preparedData = {
        ...employeeData,
        name: `${employeeData.firstName} ${employeeData.lastName}`.trim(),
        baseSalary: employeeData.salary.amount,
        overtimeRate: employeeData.payrollSettings.overtimeRate || 1.5,
        joinedAt: employeeData.hireDate,
        createdBy: user?.id || 'system'
      }

      let savedEmployee: Employee

      if (editingEmployee) {
        await employeesRepo.update(editingEmployee.id, preparedData as any)
        savedEmployee = { ...editingEmployee, ...preparedData, updatedAt: new Date() }
        setEmployees(prev => prev.map(emp => emp.id === editingEmployee.id ? savedEmployee : emp))
        toast({
          title: 'Success',
          description: 'Employee updated successfully',
        })
      } else {
        savedEmployee = await employeesRepo.create({
          ...preparedData,
          createdAt: new Date(),
          updatedAt: new Date()
        }) as Employee
        setEmployees(prev => [...prev, savedEmployee])
        toast({
          title: 'Success',
          description: 'Employee created successfully',
        })
      }

      setShowForm(false)
      setEditingEmployee(undefined)
    } catch (error) {
      console.error('Failed to save employee:', error)
      toast({
        title: 'Error',
        description: 'Failed to save employee. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const confirmDeleteEmployee = async () => {
    if (!deletingEmployee) return

    try {
      await employeesRepo.delete(deletingEmployee.id)
      setEmployees(prev => prev.filter(emp => emp.id !== deletingEmployee.id))
      toast({
        title: 'Success',
        description: 'Employee deleted successfully',
      })
    } catch (error) {
      console.error('Failed to delete employee:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete employee. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setDeletingEmployee(undefined)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <EmployeeList
        employees={employees}
        sites={sites}
        onAddEmployee={handleAddEmployee}
        onEditEmployee={handleEditEmployee}
        onViewEmployee={handleViewEmployee}
        onDeleteEmployee={handleDeleteEmployee}
        loading={loading}
      />

      {/* Add/Edit Employee Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
            </DialogTitle>
          </DialogHeader>
          <EmployeeForm
            employee={editingEmployee}
            sites={sites}
            onSave={handleSaveEmployee}
            onCancel={() => setShowForm(false)}
            loading={saving}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingEmployee} onOpenChange={() => setDeletingEmployee(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingEmployee?.name}? This action cannot be undone.
              This will permanently remove the employee and all associated payroll records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteEmployee} className="bg-red-600 hover:bg-red-700">
              Delete Employee
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
