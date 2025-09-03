import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, Download, FileText, Settings, Users, Building2, TrendingUp } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { PDFReportGenerator, ReportConfig, prepareSiteProgressData, prepareClientStatusData } from '../../utils/reportGenerator'
import type { Site } from '../SiteManagement'
import type { SiteTask } from '../sites/tasks/SiteTasks'
import type { TaskApproval } from '../sites/tasks/ApprovalWorkflow'

interface PDFReportGeneratorProps {
  site: Site
  tasks: SiteTask[]
  approvals: TaskApproval[]
  onClose?: () => void
}

export default function PDFReportGeneratorComponent({ 
  site, 
  tasks, 
  approvals, 
  onClose 
}: PDFReportGeneratorProps) {
  const [reportType, setReportType] = useState<'site-progress' | 'client-status'>('site-progress')
  const [language, setLanguage] = useState<'en' | 'ar'>('en')
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date()
  })
  const [config, setConfig] = useState<ReportConfig>({
    language: 'en',
    theme: 'light',
    includeLogo: true,
    includeSignatures: true,
    includeTimestamp: true,
    customBranding: {
      companyName: 'Construction Management Corp',
      address: '123 Business District, Construction City',
      phone: '+1 (555) 123-4567',
      email: 'contact@constructionmgmt.com'
    }
  })
  const [clientInfo, setClientInfo] = useState({
    name: 'ABC Development Ltd.',
    contactPerson: 'John Smith',
    email: 'john.smith@abcdev.com',
    phone: '+1 (555) 987-6543'
  })
  const [isGenerating, setIsGenerating] = useState(false)

  // Update config when language changes
  React.useEffect(() => {
    setConfig(prev => ({ ...prev, language }))
  }, [language])

  const reportSummary = useMemo(() => {
    const filteredTasks = tasks.filter(task => {
      const taskDate = new Date(task.createdAt)
      return taskDate >= dateRange.startDate && taskDate <= dateRange.endDate
    })

    const totalTasks = filteredTasks.length
    const completedTasks = filteredTasks.filter(t => t.status === 'completed').length
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return {
      totalTasks,
      completedTasks,
      completionRate,
      dateRange: `${format(dateRange.startDate, 'MMM dd, yyyy')} - ${format(dateRange.endDate, 'MMM dd, yyyy')}`
    }
  }, [tasks, dateRange])

  const generateReport = async () => {
    setIsGenerating(true)
    
    try {
      const generator = new PDFReportGenerator(config)
      let pdfDataUri: string

      if (reportType === 'site-progress') {
        const reportData = prepareSiteProgressData(
          site,
          tasks,
          approvals,
          dateRange.startDate.toISOString().split('T')[0],
          dateRange.endDate.toISOString().split('T')[0]
        )
        pdfDataUri = generator.generateSiteProgressReport(reportData)
      } else {
        const reportData = prepareClientStatusData(site, tasks, clientInfo)
        pdfDataUri = generator.generateClientStatusReport(reportData)
      }

      // Create download link
      const link = document.createElement('a')
      link.href = pdfDataUri
      link.download = `${reportType}-${site.name.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

    } catch (error) {
      console.error('Error generating PDF report:', error)
      alert('Failed to generate PDF report. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">PDF Report Generator</h2>
          <p className="text-muted-foreground">
            Generate professional bilingual reports for {site.name}
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
          {/* Report Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Report Type
              </CardTitle>
              <CardDescription>
                Choose the type of report to generate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className={cn(
                    "border rounded-lg p-4 cursor-pointer transition-colors",
                    reportType === 'site-progress' 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => setReportType('site-progress')}
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-medium">Site Progress Report</h3>
                      <p className="text-sm text-muted-foreground">
                        Detailed progress analysis and task breakdown
                      </p>
                    </div>
                  </div>
                </div>

                <div 
                  className={cn(
                    "border rounded-lg p-4 cursor-pointer transition-colors",
                    reportType === 'client-status' 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => setReportType('client-status')}
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-medium">Client Status Report</h3>
                      <p className="text-sm text-muted-foreground">
                        Project overview for client presentation
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Report Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Language and Date Range */}
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

                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select 
                    value={config.theme} 
                    onValueChange={(value: 'light' | 'dark') => 
                      setConfig(prev => ({ ...prev, theme: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date Range (for Site Progress Report) */}
              {reportType === 'site-progress' && (
                <div className="space-y-4">
                  <Label>Report Period</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
              )}

              {/* Options */}
              <div className="space-y-4">
                <Label>Report Options</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeLogo" 
                      checked={config.includeLogo}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ ...prev, includeLogo: !!checked }))
                      }
                    />
                    <Label htmlFor="includeLogo">Include Company Logo</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeSignatures" 
                      checked={config.includeSignatures}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ ...prev, includeSignatures: !!checked }))
                      }
                    />
                    <Label htmlFor="includeSignatures">Include Signature Section</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeTimestamp" 
                      checked={config.includeTimestamp}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ ...prev, includeTimestamp: !!checked }))
                      }
                    />
                    <Label htmlFor="includeTimestamp">Include Generation Timestamp</Label>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Company Branding */}
              <div className="space-y-4">
                <Label>Company Branding</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={config.customBranding?.companyName || ''}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        customBranding: {
                          ...prev.customBranding!,
                          companyName: e.target.value
                        }
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={config.customBranding?.email || ''}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        customBranding: {
                          ...prev.customBranding!,
                          email: e.target.value
                        }
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={config.customBranding?.phone || ''}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        customBranding: {
                          ...prev.customBranding!,
                          phone: e.target.value
                        }
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={config.customBranding?.address || ''}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        customBranding: {
                          ...prev.customBranding!,
                          address: e.target.value
                        }
                      }))}
                    />
                  </div>
                </div>
              </div>

              {/* Client Information (for Client Status Reports) */}
              {reportType === 'client-status' && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <Label>Client Information</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="clientName">Client Name</Label>
                        <Input
                          id="clientName"
                          value={clientInfo.name}
                          onChange={(e) => setClientInfo(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contactPerson">Contact Person</Label>
                        <Input
                          id="contactPerson"
                          value={clientInfo.contactPerson}
                          onChange={(e) => setClientInfo(prev => ({ ...prev, contactPerson: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="clientEmail">Client Email</Label>
                        <Input
                          id="clientEmail"
                          type="email"
                          value={clientInfo.email}
                          onChange={(e) => setClientInfo(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="clientPhone">Client Phone</Label>
                        <Input
                          id="clientPhone"
                          value={clientInfo.phone}
                          onChange={(e) => setClientInfo(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          {/* Report Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Report Preview
              </CardTitle>
              <CardDescription>
                Summary of the report to be generated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Site:</span>
                  <span className="text-sm text-muted-foreground">{site.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Report Type:</span>
                  <Badge variant="secondary">
                    {reportType === 'site-progress' ? 'Site Progress' : 'Client Status'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Language:</span>
                  <Badge variant="outline">
                    {language === 'en' ? 'English' : 'العربية'}
                  </Badge>
                </div>
                {reportType === 'site-progress' && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Period:</span>
                    <span className="text-sm text-muted-foreground">{reportSummary.dateRange}</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Data Summary */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Data Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Tasks:</span>
                    <span className="font-medium">{reportSummary.totalTasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completed:</span>
                    <span className="font-medium text-green-600">{reportSummary.completedTasks}</span>
                  </div>
                  <div className="flex justify-between col-span-2">
                    <span>Completion Rate:</span>
                    <span className="font-medium">{reportSummary.completionRate}%</span>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <Button 
                className="w-full" 
                onClick={generateReport}
                disabled={isGenerating}
              >
                <Download className="mr-2 h-4 w-4" />
                {isGenerating ? 'Generating...' : 'Generate PDF Report'}
              </Button>
            </CardContent>
          </Card>

          {/* Report Features */}
          <Card>
            <CardHeader>
              <CardTitle>Report Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {reportType === 'site-progress' ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span>Comprehensive task analysis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>Category breakdown charts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full" />
                      <span>Progress timeline visualization</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full" />
                      <span>Performance metrics</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span>Project milestone tracking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>Financial summary</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      <span>Issues and concerns</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      <span>Upcoming deadlines</span>
                    </div>
                  </>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full" />
                  <span>Professional formatting</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                  <span>Bilingual support</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
