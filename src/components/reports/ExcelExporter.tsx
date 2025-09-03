import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, Download, FileSpreadsheet, Filter, Users } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { ExcelExporter, ExcelExportConfig, ExportFilter, downloadTasksAsExcel, downloadSiteReportAsExcel } from '../../utils/excelExporter'
import type { Site } from '../SiteManagement'
import type { SiteTask } from '../sites/tasks/SiteTasks'
import type { TaskApproval } from '../sites/tasks/ApprovalWorkflow'

interface ExcelExporterProps {
  site: Site
  tasks: SiteTask[]
  approvals: TaskApproval[]
  onClose?: () => void
}

export default function ExcelExporterComponent({ 
  site, 
  tasks, 
  approvals, 
  onClose 
}: ExcelExporterProps) {
  const [exportType, setExportType] = useState<'tasks-only' | 'comprehensive'>('comprehensive')
  const [language, setLanguage] = useState<'en' | 'ar'>('en')
  const [includeFormatting, setIncludeFormatting] = useState(true)
  const [includeFormulas, setIncludeFormulas] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date()
  })
  const [enableDateFilter, setEnableDateFilter] = useState(false)
  
  // Filter states
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([])
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])
  const [isExporting, setIsExporting] = useState(false)

  // Get unique values for filters
  const uniqueValues = useMemo(() => {
    return {
      statuses: [...new Set(tasks.map(t => t.status))],
      categories: [...new Set(tasks.map(t => t.category))],
      priorities: [...new Set(tasks.map(t => t.priority))],
      assignees: [...new Set(tasks.map(t => t.assignedTo))]
    }
  }, [tasks])

  // Build export filter
  const exportFilter = useMemo((): ExportFilter => {
    const filter: ExportFilter = {}

    if (selectedStatuses.length > 0) {
      filter.status = selectedStatuses
    }
    if (selectedCategories.length > 0) {
      filter.category = selectedCategories
    }
    if (selectedPriorities.length > 0) {
      filter.priority = selectedPriorities
    }
    if (selectedAssignees.length > 0) {
      filter.assignedTo = selectedAssignees
    }
    if (enableDateFilter) {
      filter.dateRange = {
        startDate: dateRange.startDate.toISOString().split('T')[0],
        endDate: dateRange.endDate.toISOString().split('T')[0]
      }
    }

    return filter
  }, [selectedStatuses, selectedCategories, selectedPriorities, selectedAssignees, enableDateFilter, dateRange])

  // Calculate filtered task count
  const filteredTaskCount = useMemo(() => {
    let filtered = tasks

    if (exportFilter.status) {
      filtered = filtered.filter(t => exportFilter.status!.includes(t.status))
    }
    if (exportFilter.category) {
      filtered = filtered.filter(t => exportFilter.category!.includes(t.category))
    }
    if (exportFilter.priority) {
      filtered = filtered.filter(t => exportFilter.priority!.includes(t.priority))
    }
    if (exportFilter.assignedTo) {
      filtered = filtered.filter(t => exportFilter.assignedTo!.includes(t.assignedTo))
    }
    if (exportFilter.dateRange) {
      filtered = filtered.filter(task => {
        const taskDate = new Date(task.createdAt)
        const startDate = new Date(exportFilter.dateRange!.startDate)
        const endDate = new Date(exportFilter.dateRange!.endDate)
        return taskDate >= startDate && taskDate <= endDate
      })
    }

    return filtered.length
  }, [tasks, exportFilter])

  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      const config: Partial<ExcelExportConfig> = {
        language,
        includeFormatting,
        includeFormulas,
        includeCharts: false,
        sheetNames: {
          summary: language === 'ar' ? 'الملخص' : 'Summary',
          tasks: language === 'ar' ? 'المهام' : 'Tasks',
          approvals: language === 'ar' ? 'الموافقات' : 'Approvals',
          timeline: language === 'ar' ? 'الجدول الزمني' : 'Timeline',
          categories: language === 'ar' ? 'تحليل الفئات' : 'Category Analysis'
        }
      }

      const filename = `${site.name.replace(/\s+/g, '-')}-${exportType}-${format(new Date(), 'yyyy-MM-dd')}`

      if (exportType === 'tasks-only') {
        downloadTasksAsExcel(tasks, filename, config, exportFilter)
      } else {
        downloadSiteReportAsExcel(site, tasks, approvals, filename, config, exportFilter)
      }

    } catch (error) {
      console.error('Error exporting to Excel:', error)
      alert('Failed to export to Excel. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleFilterChange = (
    type: 'status' | 'category' | 'priority' | 'assignee',
    value: string,
    checked: boolean
  ) => {
    const setters = {
      status: setSelectedStatuses,
      category: setSelectedCategories,
      priority: setSelectedPriorities,
      assignee: setSelectedAssignees
    }

    setters[type](prev => 
      checked 
        ? [...prev, value]
        : prev.filter(item => item !== value)
    )
  }

  const clearAllFilters = () => {
    setSelectedStatuses([])
    setSelectedCategories([])
    setSelectedPriorities([])
    setSelectedAssignees([])
    setEnableDateFilter(false)
  }

  const getStatusTranslation = (status: string) => {
    const translations: Record<string, string> = {
      'not-started': 'Not Started',
      'in-progress': 'In Progress',
      'completed': 'Completed',
      'on-hold': 'On Hold',
      'cancelled': 'Cancelled'
    }
    return translations[status] || status
  }

  const getCategoryTranslation = (category: string) => {
    const translations: Record<string, string> = {
      construction: 'Construction',
      safety: 'Safety',
      inspection: 'Inspection',
      maintenance: 'Maintenance',
      planning: 'Planning',
      other: 'Other'
    }
    return translations[category] || category
  }

  const getPriorityTranslation = (priority: string) => {
    const translations: Record<string, string> = {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      critical: 'Critical'
    }
    return translations[priority] || priority
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Excel Export</h2>
          <p className="text-muted-foreground">
            Export tasks and data to Excel format for {site.name}
          </p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Export Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Export Type
              </CardTitle>
              <CardDescription>
                Choose what data to include in the export
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className={cn(
                    "border rounded-lg p-4 cursor-pointer transition-colors",
                    exportType === 'tasks-only' 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => setExportType('tasks-only')}
                >
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-medium">Tasks Only</h3>
                      <p className="text-sm text-muted-foreground">
                        Export task list with basic information
                      </p>
                    </div>
                  </div>
                </div>

                <div 
                  className={cn(
                    "border rounded-lg p-4 cursor-pointer transition-colors",
                    exportType === 'comprehensive' 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => setExportType('comprehensive')}
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-medium">Comprehensive Report</h3>
                      <p className="text-sm text-muted-foreground">
                        Multiple sheets with analysis and summaries
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Language and Formatting */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={language} onValueChange={(value: 'en' | 'ar') => setLanguage(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">العربية (Arabic)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Export Features */}
              <div className="space-y-4">
                <Label>Export Features</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeFormatting" 
                      checked={includeFormatting}
                      onCheckedChange={(checked) => setIncludeFormatting(!!checked)}
                    />
                    <Label htmlFor="includeFormatting">Include Cell Formatting</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeFormulas" 
                      checked={includeFormulas}
                      onCheckedChange={(checked) => setIncludeFormulas(!!checked)}
                    />
                    <Label htmlFor="includeFormulas">Include Excel Formulas</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Data Filters
              </CardTitle>
              <CardDescription>
                Filter which tasks to include in the export
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Range Filter */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="enableDateFilter" 
                    checked={enableDateFilter}
                    onCheckedChange={(checked) => setEnableDateFilter(!!checked)}
                  />
                  <Label htmlFor="enableDateFilter">Filter by Date Range</Label>
                </div>

                {enableDateFilter && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !dateRange.startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.startDate ? format(dateRange.startDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={dateRange.startDate}
                            onSelect={(date) => date && setDateRange(prev => ({ ...prev, startDate: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !dateRange.endDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.endDate ? format(dateRange.endDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={dateRange.endDate}
                            onSelect={(date) => date && setDateRange(prev => ({ ...prev, endDate: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Status Filter */}
              <div className="space-y-3">
                <Label>Task Status</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {uniqueValues.statuses.map(status => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`status-${status}`}
                        checked={selectedStatuses.includes(status)}
                        onCheckedChange={(checked) => 
                          handleFilterChange('status', status, !!checked)
                        }
                      />
                      <Label htmlFor={`status-${status}`} className="text-sm">
                        {getStatusTranslation(status)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div className="space-y-3">
                <Label>Task Category</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {uniqueValues.categories.map(category => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`category-${category}`}
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={(checked) => 
                          handleFilterChange('category', category, !!checked)
                        }
                      />
                      <Label htmlFor={`category-${category}`} className="text-sm">
                        {getCategoryTranslation(category)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priority Filter */}
              <div className="space-y-3">
                <Label>Task Priority</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {uniqueValues.priorities.map(priority => (
                    <div key={priority} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`priority-${priority}`}
                        checked={selectedPriorities.includes(priority)}
                        onCheckedChange={(checked) => 
                          handleFilterChange('priority', priority, !!checked)
                        }
                      />
                      <Label htmlFor={`priority-${priority}`} className="text-sm">
                        {getPriorityTranslation(priority)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assignee Filter */}
              <div className="space-y-3">
                <Label>Assigned To</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {uniqueValues.assignees.map(assignee => (
                    <div key={assignee} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`assignee-${assignee}`}
                        checked={selectedAssignees.includes(assignee)}
                        onCheckedChange={(checked) => 
                          handleFilterChange('assignee', assignee, !!checked)
                        }
                      />
                      <Label htmlFor={`assignee-${assignee}`} className="text-sm">
                        {assignee}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={clearAllFilters}>
                  Clear All Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          {/* Export Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Export Preview</CardTitle>
              <CardDescription>
                Summary of the data to be exported
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Site:</span>
                  <span className="text-sm text-muted-foreground">{site.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Export Type:</span>
                  <Badge variant="secondary">
                    {exportType === 'tasks-only' ? 'Tasks Only' : 'Comprehensive'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Language:</span>
                  <Badge variant="outline">
                    {language === 'en' ? 'English' : 'العربية'}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Data Summary */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Data to Export</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Tasks (filtered):</span>
                    <span className="font-medium">{filteredTaskCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Tasks:</span>
                    <span className="text-muted-foreground">{tasks.length}</span>
                  </div>
                  {exportType === 'comprehensive' && (
                    <>
                      <div className="flex justify-between">
                        <span>Approvals:</span>
                        <span className="font-medium">{approvals.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sheets:</span>
                        <span className="font-medium">5</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Active Filters */}
              {(selectedStatuses.length > 0 || selectedCategories.length > 0 || 
                selectedPriorities.length > 0 || selectedAssignees.length > 0 || 
                enableDateFilter) && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Active Filters</h4>
                    <div className="space-y-1">
                      {selectedStatuses.length > 0 && (
                        <div className="text-xs">
                          <span className="font-medium">Status:</span> {selectedStatuses.map(s => getStatusTranslation(s)).join(', ')}
                        </div>
                      )}
                      {selectedCategories.length > 0 && (
                        <div className="text-xs">
                          <span className="font-medium">Category:</span> {selectedCategories.map(c => getCategoryTranslation(c)).join(', ')}
                        </div>
                      )}
                      {selectedPriorities.length > 0 && (
                        <div className="text-xs">
                          <span className="font-medium">Priority:</span> {selectedPriorities.map(p => getPriorityTranslation(p)).join(', ')}
                        </div>
                      )}
                      {selectedAssignees.length > 0 && (
                        <div className="text-xs">
                          <span className="font-medium">Assignees:</span> {selectedAssignees.slice(0, 2).join(', ')}{selectedAssignees.length > 2 && ` +${selectedAssignees.length - 2} more`}
                        </div>
                      )}
                      {enableDateFilter && (
                        <div className="text-xs">
                          <span className="font-medium">Date Range:</span> {format(dateRange.startDate, 'MMM dd')} - {format(dateRange.endDate, 'MMM dd, yyyy')}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Export Button */}
              <Button 
                className="w-full" 
                onClick={handleExport}
                disabled={isExporting || filteredTaskCount === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? 'Exporting...' : 'Export to Excel'}
              </Button>

              {filteredTaskCount === 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  No tasks match the current filters
                </p>
              )}
            </CardContent>
          </Card>

          {/* Sheet Information */}
          {exportType === 'comprehensive' && (
            <Card>
              <CardHeader>
                <CardTitle>Export Contents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Summary - Project overview and statistics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Tasks - Detailed task list with all fields</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    <span>Approvals - Approval workflow data</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    <span>Category Analysis - Breakdown by categories</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                    <span>Timeline - 30-day activity timeline</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
