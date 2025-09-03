import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  MapPin,
  Users,
  Vault,
  Receipt,
  TrendingUp,
  Calculator,
  FileText,
  Settings,
  UserCheck,
  CheckCircle,
  Building,
  ClipboardList,
  BarChart3,
  Shield,
  Network,
} from 'lucide-react'
import { useAuth } from '../state/useAuth'
import { useUI } from '../state/useUI'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  roles?: string[]
  badge?: number
}

export default function Sidebar() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { sidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen } = useUI()
  const location = useLocation()

  const getNavItems = (): NavItem[] => {
    const baseItems = [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        label: 'Sites',
        href: '/sites',
        icon: MapPin,
      },
    ]

    const roleSpecificItems: Record<string, NavItem[]> = {
      PMO: [
        {
          label: 'Organization Units',
          href: '/org-units',
          icon: Network,
        },
        {
          label: 'Users Management',
          href: '/users',
          icon: UserCheck,
        },
        {
          label: 'Approvals',
          href: '/approvals',
          icon: CheckCircle,
        },
        {
          label: 'Reports',
          href: '/reports',
          icon: BarChart3,
        },
        {
          label: 'Audit Logs',
          href: '/audit',
          icon: Shield,
        },
        {
          label: 'System Settings',
          href: '/settings',
          icon: Settings,
        },
      ],
      AREA_MANAGER: [
        {
          label: 'Expenses',
          href: '/expenses',
          icon: Receipt,
        },
        {
          label: 'Tasks',
          href: '/tasks',
          icon: ClipboardList,
        },
        {
          label: 'Team Management',
          href: '/team',
          icon: Users,
        },
        {
          label: 'Approvals',
          href: '/approvals',
          icon: CheckCircle,
        },
        {
          label: 'Reports',
          href: '/reports',
          icon: BarChart3,
        },
      ],
      PROJECT_MANAGER: [
        {
          label: 'Expenses',
          href: '/expenses',
          icon: Receipt,
        },
        {
          label: 'Tasks',
          href: '/tasks',
          icon: ClipboardList,
        },
        {
          label: 'Team',
          href: '/team',
          icon: Users,
        },
        {
          label: 'Approvals',
          href: '/approvals',
          icon: CheckCircle,
        },
        {
          label: 'Reports',
          href: '/reports',
          icon: FileText,
        },
      ],
      ZONE_MANAGER: [
        {
          label: 'Expenses',
          href: '/expenses',
          icon: Receipt,
        },
        {
          label: 'Tasks',
          href: '/tasks',
          icon: ClipboardList,
        },
        {
          label: 'Team',
          href: '/team',
          icon: Users,
        },
        {
          label: 'Approvals',
          href: '/approvals',
          icon: CheckCircle,
        },
      ],
      SITE_ENGINEER: [
        {
          label: 'Tasks',
          href: '/tasks',
          icon: ClipboardList,
        },
        {
          label: 'Expenses',
          href: '/expenses',
          icon: Receipt,
        },
      ],
    }

    const userRole = user?.role
    const roleItems = userRole && roleSpecificItems[userRole] ? roleSpecificItems[userRole] : []
    
    return [...baseItems, ...roleItems]
  }

  const navItems = getNavItems()

  // Filter navigation items based on user role
  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true
    return user?.role && item.roles.includes(user.role)
  })

  const handleNavClick = () => {
    if (mobileSidebarOpen) {
      setMobileSidebarOpen(false)
    }
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`
        hidden lg:flex flex-col bg-card border-r border-border transition-all duration-300 z-30
        ${sidebarCollapsed ? 'w-16' : 'w-64'}
      `}>
        {/* Sidebar Header */}
        <div className={`p-4 border-b border-border ${sidebarCollapsed ? 'px-2' : ''}`}>
          {!sidebarCollapsed ? (
            <h1 className="text-lg font-semibold text-foreground truncate">
              Management System
            </h1>
          ) : (
            <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">MS</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href || 
                              (item.href !== '/dashboard' && location.pathname.startsWith(item.href))

              return (
                <li key={item.href}>
                  <NavLink
                    to={item.href}
                    className={`
                      flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                      ${isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }
                      ${sidebarCollapsed ? 'justify-center px-2' : ''}
                    `}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <>
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto bg-destructive text-destructive-foreground text-xs rounded-full px-2 py-1">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User Info */}
        {!sidebarCollapsed && user && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-medium">
                  {user.firstName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-muted-foreground capitalize truncate">
                  {user.role.toLowerCase().replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 lg:hidden
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border">
          <h1 className="text-lg font-semibold text-foreground">
            Management System
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href || 
                              (item.href !== '/dashboard' && location.pathname.startsWith(item.href))

              return (
                <li key={item.href}>
                  <NavLink
                    to={item.href}
                    onClick={handleNavClick}
                    className={`
                      flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                      ${isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-destructive text-destructive-foreground text-xs rounded-full px-2 py-1">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User Info */}
        {user && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-medium">
                  {user.firstName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-muted-foreground capitalize truncate">
                  {user.role.toLowerCase().replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
