import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { performanceMonitor, usePerformanceMonitor } from '../../utils/performance'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock,
  BarChart3,
  Settings,
  X,
  RefreshCw
} from 'lucide-react'

interface PerformanceSettings {
  enableVirtualization: boolean
  enableLazyLoading: boolean
  enableMemoization: boolean
  enablePerformanceMonitoring: boolean
  maxListSize: number
  imageQuality: 'low' | 'medium' | 'high'
  debounceDelay: number
}

interface PerformanceContextType {
  settings: PerformanceSettings
  updateSettings: (settings: Partial<PerformanceSettings>) => void
  metrics: Record<string, any>
  refreshMetrics: () => void
}

const defaultSettings: PerformanceSettings = {
  enableVirtualization: true,
  enableLazyLoading: true,
  enableMemoization: true,
  enablePerformanceMonitoring: true,
  maxListSize: 1000,
  imageQuality: 'medium',
  debounceDelay: 300
}

const PerformanceContext = createContext<PerformanceContextType | null>(null)

export function usePerformanceSettings() {
  const context = useContext(PerformanceContext)
  if (!context) {
    throw new Error('usePerformanceSettings must be used within PerformanceProvider')
  }
  return context
}

interface PerformanceProviderProps {
  children: React.ReactNode
  initialSettings?: Partial<PerformanceSettings>
}

export function PerformanceProvider({ 
  children, 
  initialSettings = {} 
}: PerformanceProviderProps) {
  const [settings, setSettings] = useState<PerformanceSettings>({
    ...defaultSettings,
    ...initialSettings
  })
  const [metrics, setMetrics] = useState<Record<string, any>>({})

  const updateSettings = useCallback((newSettings: Partial<PerformanceSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings }
      
      // Persist settings to localStorage
      try {
        localStorage.setItem('performance-settings', JSON.stringify(updated))
      } catch (error) {
        console.warn('Failed to save performance settings:', error)
      }
      
      return updated
    })
  }, [])

  const refreshMetrics = useCallback(() => {
    if (settings.enablePerformanceMonitoring) {
      const allMetrics = performanceMonitor.getAllMetrics()
      setMetrics(allMetrics)
    }
  }, [settings.enablePerformanceMonitoring])

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('performance-settings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings(prev => ({ ...prev, ...parsed }))
      }
    } catch (error) {
      console.warn('Failed to load performance settings:', error)
    }
  }, [])

  // Periodically refresh metrics
  useEffect(() => {
    if (!settings.enablePerformanceMonitoring) return

    const interval = setInterval(refreshMetrics, 2000)
    return () => clearInterval(interval)
  }, [settings.enablePerformanceMonitoring, refreshMetrics])

  const contextValue: PerformanceContextType = {
    settings,
    updateSettings,
    metrics,
    refreshMetrics
  }

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
    </PerformanceContext.Provider>
  )
}

// Performance indicator widget
interface PerformanceIndicatorProps {
  className?: string
  variant?: 'minimal' | 'detailed'
}

export const PerformanceIndicator: React.FC<PerformanceIndicatorProps> = React.memo(({
  className,
  variant = 'minimal'
}) => {
  const { settings, metrics } = usePerformanceSettings()
  const [isExpanded, setIsExpanded] = useState(false)

  if (!settings.enablePerformanceMonitoring) return null

  const metricKeys = Object.keys(metrics)
  const totalOps = metricKeys.reduce((sum, key) => sum + (metrics[key]?.count || 0), 0)
  const avgTime = metricKeys.length > 0 
    ? metricKeys.reduce((sum, key) => sum + (metrics[key]?.average || 0), 0) / metricKeys.length
    : 0

  const getPerformanceColor = (time: number) => {
    if (time < 16) return 'text-green-600'
    if (time < 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (variant === 'minimal') {
    return (
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`fixed bottom-4 right-4 z-50 flex items-center space-x-2 px-3 py-2 bg-background border border-border rounded-lg shadow-lg hover:shadow-xl transition-all ${className}`}
      >
        <Activity className={`h-4 w-4 ${getPerformanceColor(avgTime)}`} />
        <span className="text-xs font-medium">
          {avgTime.toFixed(1)}ms
        </span>
        {totalOps > 0 && (
          <Badge variant="outline" className="text-xs">
            {totalOps}
          </Badge>
        )}
      </button>
    )
  }

  return (
    <Card className={`fixed bottom-4 right-4 z-50 w-80 ${isExpanded ? '' : 'w-auto'} ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Performance</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? <X className="h-3 w-3" /> : <BarChart3 className="h-3 w-3" />}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-3">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className={`text-lg font-bold ${getPerformanceColor(avgTime)}`}>
                {avgTime.toFixed(1)}ms
              </div>
              <div className="text-xs text-muted-foreground">Avg Time</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {totalOps}
              </div>
              <div className="text-xs text-muted-foreground">Operations</div>
            </div>
          </div>

          {/* Individual Metrics */}
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {metricKeys.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-2">
                No metrics recorded yet
              </div>
            ) : (
              metricKeys.map(key => {
                const metric = metrics[key]
                return (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="truncate flex-1 mr-2">{key}</span>
                    <div className="flex items-center space-x-2">
                      <span className={getPerformanceColor(metric.average)}>
                        {metric.average.toFixed(1)}ms
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {metric.count}
                      </Badge>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Performance Status */}
          <div className="border-t pt-2">
            <div className="flex items-center justify-between text-xs">
              <span>Status:</span>
              <div className="flex items-center space-x-1">
                {avgTime < 16 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-green-600">Excellent</span>
                  </>
                ) : avgTime < 50 ? (
                  <>
                    <Clock className="h-3 w-3 text-yellow-600" />
                    <span className="text-yellow-600">Good</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 text-red-600" />
                    <span className="text-red-600">Needs Improvement</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 border-t pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                performanceMonitor.clear()
                refreshMetrics()
              }}
              className="flex-1 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
})

PerformanceIndicator.displayName = 'PerformanceIndicator'

// Performance settings panel
interface PerformanceSettingsPanelProps {
  onClose?: () => void
}

export const PerformanceSettingsPanel: React.FC<PerformanceSettingsPanelProps> = ({ onClose }) => {
  const { settings, updateSettings } = usePerformanceSettings()

  const handleSettingChange = useCallback((key: keyof PerformanceSettings, value: any) => {
    updateSettings({ [key]: value })
  }, [updateSettings])

  return (
    <Card className="w-96">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Performance Settings</span>
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Virtualization Settings */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Rendering Optimizations</h4>
          
          <div className="flex items-center justify-between">
            <label className="text-sm">Enable Virtualization</label>
            <input
              type="checkbox"
              checked={settings.enableVirtualization}
              onChange={(e) => handleSettingChange('enableVirtualization', e.target.checked)}
              className="h-4 w-4"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm">Enable Lazy Loading</label>
            <input
              type="checkbox"
              checked={settings.enableLazyLoading}
              onChange={(e) => handleSettingChange('enableLazyLoading', e.target.checked)}
              className="h-4 w-4"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm">Enable Memoization</label>
            <input
              type="checkbox"
              checked={settings.enableMemoization}
              onChange={(e) => handleSettingChange('enableMemoization', e.target.checked)}
              className="h-4 w-4"
            />
          </div>
        </div>

        {/* Performance Monitoring */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Monitoring</h4>
          
          <div className="flex items-center justify-between">
            <label className="text-sm">Performance Monitoring</label>
            <input
              type="checkbox"
              checked={settings.enablePerformanceMonitoring}
              onChange={(e) => handleSettingChange('enablePerformanceMonitoring', e.target.checked)}
              className="h-4 w-4"
            />
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Advanced</h4>
          
          <div className="space-y-2">
            <label className="text-sm">Max List Size</label>
            <input
              type="number"
              value={settings.maxListSize}
              onChange={(e) => handleSettingChange('maxListSize', parseInt(e.target.value))}
              className="w-full px-2 py-1 text-sm border border-border rounded"
              min="100"
              max="10000"
              step="100"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm">Image Quality</label>
            <select
              value={settings.imageQuality}
              onChange={(e) => handleSettingChange('imageQuality', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-border rounded"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm">Debounce Delay (ms)</label>
            <input
              type="number"
              value={settings.debounceDelay}
              onChange={(e) => handleSettingChange('debounceDelay', parseInt(e.target.value))}
              className="w-full px-2 py-1 text-sm border border-border rounded"
              min="100"
              max="1000"
              step="100"
            />
          </div>
        </div>

        {/* Reset to defaults */}
        <div className="border-t pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateSettings(defaultSettings)}
            className="w-full text-xs"
          >
            Reset to Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Performance monitor component for debugging
export const PerformanceMonitor: React.FC = React.memo(() => {
  const { settings, metrics, refreshMetrics } = usePerformanceSettings()
  const [isVisible, setIsVisible] = useState(false)

  if (!settings.enablePerformanceMonitoring) return null

  const metricEntries = Object.entries(metrics)
  const totalOperations = metricEntries.reduce((sum, [, metric]) => sum + (metric.count || 0), 0)
  const avgResponseTime = metricEntries.length > 0
    ? metricEntries.reduce((sum, [, metric]) => sum + (metric.average || 0), 0) / metricEntries.length
    : 0

  const getPerformanceGrade = (avgTime: number) => {
    if (avgTime < 16) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-100' }
    if (avgTime < 33) return { grade: 'B', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    if (avgTime < 50) return { grade: 'C', color: 'text-orange-600', bg: 'bg-orange-100' }
    return { grade: 'D', color: 'text-red-600', bg: 'bg-red-100' }
  }

  const { grade, color, bg } = getPerformanceGrade(avgResponseTime)

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className={`fixed bottom-4 left-4 z-40 flex items-center space-x-2 px-3 py-2 ${bg} ${color} rounded-lg shadow-lg hover:shadow-xl transition-all`}
      >
        <Activity className="h-4 w-4" />
        <span className="text-sm font-bold">{grade}</span>
        <span className="text-xs">{avgResponseTime.toFixed(1)}ms</span>
      </button>
    )
  }

  return (
    <Card className="fixed bottom-4 left-4 z-40 w-80 max-h-96 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Performance Monitor</span>
            <Badge className={`${bg} ${color}`}>{grade}</Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className={`text-lg font-bold ${color}`}>
              {avgResponseTime.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">Avg (ms)</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600">
              {totalOperations}
            </div>
            <div className="text-xs text-muted-foreground">Operations</div>
          </div>
          <div>
            <div className="text-lg font-bold text-purple-600">
              {metricEntries.length}
            </div>
            <div className="text-xs text-muted-foreground">Metrics</div>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="border-t pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">Operations</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshMetrics}
              className="h-5 w-5 p-0"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {metricEntries.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-2">
                No metrics recorded
              </div>
            ) : (
              metricEntries
                .sort((a, b) => b[1].average - a[1].average)
                .slice(0, 10) // Show top 10 slowest operations
                .map(([name, metric]) => (
                  <div key={name} className="flex items-center justify-between">
                    <span className="text-xs truncate flex-1 mr-2" title={name}>
                      {name.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs ${getPerformanceColor(metric.average)}`}>
                        {metric.average.toFixed(1)}ms
                      </span>
                      <Badge variant="outline" className="text-xs h-4">
                        {metric.count}
                      </Badge>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Performance Recommendations */}
        {avgResponseTime > 50 && (
          <div className="border-t pt-2">
            <div className="text-xs font-medium mb-1">💡 Recommendations</div>
            <div className="text-xs text-muted-foreground space-y-1">
              {!settings.enableVirtualization && (
                <div>• Enable virtualization for large lists</div>
              )}
              {!settings.enableLazyLoading && (
                <div>• Enable lazy loading for images</div>
              )}
              {!settings.enableMemoization && (
                <div>• Enable component memoization</div>
              )}
              {settings.imageQuality === 'high' && (
                <div>• Consider reducing image quality</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
})

PerformanceMonitor.displayName = 'PerformanceMonitor'

// Quick performance actions component
export const PerformanceQuickActions: React.FC = React.memo(() => {
  const { settings, updateSettings } = usePerformanceSettings()

  const handleOptimizeForSpeed = useCallback(() => {
    updateSettings({
      enableVirtualization: true,
      enableLazyLoading: true,
      enableMemoization: true,
      imageQuality: 'low',
      maxListSize: 500,
      debounceDelay: 500
    })
  }, [updateSettings])

  const handleOptimizeForQuality = useCallback(() => {
    updateSettings({
      enableVirtualization: false,
      enableLazyLoading: true,
      enableMemoization: true,
      imageQuality: 'high',
      maxListSize: 2000,
      debounceDelay: 200
    })
  }, [updateSettings])

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleOptimizeForSpeed}
        className="text-xs"
      >
        <Zap className="h-3 w-3 mr-1" />
        Speed
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleOptimizeForQuality}
        className="text-xs"
      >
        <BarChart3 className="h-3 w-3 mr-1" />
        Quality
      </Button>
    </div>
  )
})

PerformanceQuickActions.displayName = 'PerformanceQuickActions'
