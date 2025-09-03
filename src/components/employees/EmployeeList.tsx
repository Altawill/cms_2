import React, { useState, useMemo, useCallback } from 'react'
import { Employee, Site } from '../../types'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import VirtualizedList from '../common/VirtualizedList'
import { 
  PlusIcon, 
  SearchIcon, 
  GridIcon, 
  ListIcon,
  MoreHorizontalIcon,
  EditIcon,
  TrashIcon,
  EyeIcon
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

interface EmployeeListProps {
  employees: Employee[]
  sites: Site[]
  onAddEmployee: () => void
  onEditEmployee: (employee: Employee) => void
  onViewEmployee: (employee: Employee) => void
  onDeleteEmployee: (employee: Employee) => void
  loading?: boolean
}

// Memoized Employee Card Component
interface EmployeeCardProps {
  employee: Employee
  site: string
  onView: () => void
  onEdit: () => void
  onDelete: () => void
  getStatusColor: (status: Employee['status']) => string
}

const EmployeeCard = React.memo<EmployeeCardProps>(({ 
  employee, 
  site, 
  onView, 
  onEdit, 
  onDelete, 
  getStatusColor 
}) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between">
        <div>
          <CardTitle className="text-lg">{employee.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {employee.employeeNumber}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onView}>
              <EyeIcon className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <EditIcon className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onDelete}
              className="text-red-600"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      <div>
        <p className="text-sm font-medium">{employee.position}</p>
        <p className="text-sm text-muted-foreground">{site}</p>
      </div>
      
      <div className="flex items-center justify-between">
        <Badge className={getStatusColor(employee.status)}>
          {employee.status.replace('_', ' ')}
        </Badge>
        <p className="text-sm font-medium">
          {employee.salary.amount.toLocaleString()} LYD
          <span className="text-xs text-muted-foreground ml-1">
            /{employee.salary.type.toLowerCase()}
          </span>
        </p>
      </div>

      <div className="text-xs text-muted-foreground">
        Hired: {employee.hireDate.toLocaleDateString()}
      </div>
    </CardContent>
  </Card>
))

EmployeeCard.displayName = 'EmployeeCard'

export default function EmployeeList({
  employees,
  sites,
  onAddEmployee,
  onEditEmployee,
  onViewEmployee,
  onDeleteEmployee,
  loading = false
}: EmployeeListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | Employee['status']>('ALL')
  const [siteFilter, setSiteFilter] = useState<string>('ALL')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  
  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      const matchesSearch = 
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.position.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'ALL' || employee.status === statusFilter
      const matchesSite = siteFilter === 'ALL' || employee.siteId === siteFilter

      return matchesSearch && matchesStatus && matchesSite
    })
  }, [employees, searchTerm, statusFilter, siteFilter])

  const getStatusColor = (status: Employee['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800'
      case 'ON_LEAVE':
        return 'bg-yellow-100 text-yellow-800'
      case 'TERMINATED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Site lookup
  const getSiteName = useCallback((siteId: string) => {
    const site = sites.find(s => s.id === siteId)
    return site?.name || 'Unknown Site'
  }, [sites])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Employees</h1>
        <Button onClick={onAddEmployee}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <SearchIcon className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                <SelectItem value="TERMINATED">Terminated</SelectItem>
              </SelectContent>
            </Select>

            <Select value={siteFilter} onValueChange={setSiteFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Site" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Sites</SelectItem>
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-1 border rounded-md p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <GridIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <ListIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredEmployees.length} of {employees.length} employees
        </span>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading employees...</div>
      ) : filteredEmployees.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'ALL' || siteFilter !== 'ALL'
                ? 'No employees match your filters'
                : 'No employees found'}
            </p>
            {(!searchTerm && statusFilter === 'ALL' && siteFilter === 'ALL') && (
              <Button onClick={onAddEmployee}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Your First Employee
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        // Grid view
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              site={getSiteName(employee.siteId)}
              onView={() => onViewEmployee(employee)}
              onEdit={() => onEditEmployee(employee)}
              onDelete={() => onDeleteEmployee(employee)}
              getStatusColor={getStatusColor}
            />
          ))}
        </div>
      ) : (
        // Table view
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left p-4 font-medium">Employee</th>
                  <th className="text-left p-4 font-medium">Position</th>
                  <th className="text-left p-4 font-medium">Site</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Salary</th>
                  <th className="text-left p-4 font-medium">Hire Date</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {employee.employeeNumber}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">{employee.position}</p>
                      {employee.department && (
                        <p className="text-xs text-muted-foreground">
                          {employee.department}
                        </p>
                      )}
                    </td>
                    <td className="p-4 text-sm">{getSiteName(employee.siteId)}</td>
                    <td className="p-4">
                      <Badge className={getStatusColor(employee.status)}>
                        {employee.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium">
                        {employee.salary.amount.toLocaleString()} LYD
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {employee.salary.type.toLowerCase()}
                      </p>
                    </td>
                    <td className="p-4 text-sm">
                      {employee.hireDate.toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewEmployee(employee)}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditEmployee(employee)}
                        >
                          <EditIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteEmployee(employee)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
