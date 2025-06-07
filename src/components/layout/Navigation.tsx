import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { 
  LogOut, 
  Home, 
  Package, 
  Users, 
  FileText, 
  Settings, 
  BarChart3,
  Truck,
  Building2,
  User,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect, useRef } from 'react'
import { RealtimeIndicator } from '@/components/ui/realtime-indicator'
import { ConnectionStatus } from '@/components/ui/connection-status'

export function Navigation() {
  const { user, signOut, hasPermission } = useAuth()
  const location = useLocation()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: Home,
      show: true,
    },
    {
      name: 'Orders',
      href: '/orders',
      icon: Package,
      show: hasPermission('VIEW_ALL_ORDERS') || hasPermission('VIEW_OWN_ORDERS'),
    },
    {
      name: 'Kitting/Packing',
      href: '/kitting',
      icon: Package,
      show: hasPermission('MANAGE_KITTING_PACKING'),
    },
    {
      name: 'Screening/QC',
      href: '/qc',
      icon: BarChart3,
      show: hasPermission('MANAGE_SCREENING_QC'),
    },
    {
      name: 'NPQC',
      href: '/npqc',
      icon: Building2,
      show: hasPermission('MANAGE_NPQC'),
    },
    {
      name: 'Invoicing',
      href: '/invoicing',
      icon: FileText,
      show: hasPermission('ACCESS_INVOICING'),
    },
    {
      name: 'Procurement',
      href: '/procurement',
      icon: Truck,
      show: hasPermission('ACCESS_PROCUREMENT'),
    },
    {
      name: 'Users',
      href: '/users',
      icon: Users,
      show: hasPermission('MANAGE_USERS'),
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      show: hasPermission('ACCESS_ADMIN_PANEL'),
    },
  ]

  const visibleItems = navigationItems.filter(item => item.show)

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-full mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between h-12">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-lg font-bold text-gray-900">
                Mini-ERP
              </h1>
            </div>
            <div className="hidden lg:block">
              <div className="ml-8 flex items-baseline space-x-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        "px-2 py-1.5 rounded-md text-xs font-medium flex items-center transition-colors",
                        isActive
                          ? "bg-gray-100 text-gray-900"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      )}
                    >
                      <Icon className="mr-1.5 h-3.5 w-3.5" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
            
            {/* Compact navigation for medium screens */}
            <div className="hidden md:block lg:hidden">
              <div className="ml-6 flex items-baseline space-x-1">
                {visibleItems.slice(0, 4).map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        "px-2 py-1.5 rounded-md text-xs font-medium flex items-center transition-colors",
                        isActive
                          ? "bg-gray-100 text-gray-900"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      )}
                      title={item.name}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Connection status indicators */}
            <ConnectionStatus />
            <RealtimeIndicator />
            
            {/* User menu dropdown */}
            <div className="relative" ref={userMenuRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center text-xs px-2 py-1"
              >
                <User className="mr-1.5 h-3.5 w-3.5" />
                <span className="hidden sm:block">{user?.first_name}</span>
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border z-50">
                  <div className="py-1">
                    <div className="px-3 py-2 text-xs text-gray-500 border-b">
                      <div className="font-medium text-gray-900">{user?.first_name} {user?.last_name}</div>
                      <div className="text-xs">{user?.role?.name}</div>
                    </div>
                    <Link
                      to="/preferences"
                      className="block px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="inline mr-2 h-3 w-3" />
                      User Preferences
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="inline mr-2 h-3 w-3" />
                      System Settings
                    </Link>
                    <button
                      onClick={() => { signOut(); setShowUserMenu(false) }}
                      className="block w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="inline mr-2 h-3 w-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium flex items-center transition-colors",
                  isActive
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}