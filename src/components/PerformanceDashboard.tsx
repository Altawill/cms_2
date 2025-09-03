import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

interface PerformanceDashboardProps {
  className?: string
  variant?: 'full' | 'summary' | 'widget'
  autoRefresh?: boolean
  refreshInterval?: number
}

export default function PerformanceDashboard(props: PerformanceDashboardProps) {
  // Temporary stub - functionality disabled until performanceService is restored
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Performance monitoring temporarily disabled</p>
      </CardContent>
    </Card>
  )
}
