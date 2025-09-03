import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useAuth } from '../state/useAuth'
import { useUI } from '../state/useUI'

export default function Shell() {
  const { user } = useAuth()
  const { sidebarCollapsed, mobileSidebarOpen } = useUI()

  if (!user) {
    return null // This should be handled by route protection
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => useUI.getState().setMobileSidebarOpen(false)}
        />
      )}
      
      {/* Main content area */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      }`}>
        {/* Top bar */}
        <Topbar />
        
        {/* Page content */}
        <main className="flex-1 overflow-auto bg-muted/10">
          <div className="container mx-auto p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
