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
  ChevronDown,
  Printer,
  FileSpreadsheet,
  Plus,
  Import,
  QrCode,
  Image,
  LayoutTemplate,
  Network,
  ListChecks,
  ClipboardList,
  MessageSquare,
  Shield,
  UserCog,
  Gauge,
  AlertCircle,
  FileBarChart,
  TrendingUp,
  FileDown,
  Clock,
  CheckSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect, useRef } from 'react'
import { RealtimeIndicator } from '@/components/ui/realtime-indicator'
import { ConnectionStatus } from '@/components/ui/connection-status'

interface SubMenuItem {
  name: string
  href: string
  icon?: any
  description?: string
}

interface NavigationItem {
  name: string
  href: string
  icon: any
  show: boolean
  subItems?: SubMenuItem[]
}

export function NavigationWithSubmenus() {
  const { user, signOut, hasPermission } = useAuth()
  const location = useLocation()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      
      // Check all dropdown refs
      Object.entries(dropdownRefs.current).forEach(([key, ref]) => {
        if (ref && !ref.contains(event.target as Node)) {
          if (activeDropdown === key) {
            setActiveDropdown(null)
          }
        }
      })
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [activeDropdown])

  const navigationItems: NavigationItem[] = [
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
      subItems: [
        { name: 'All Orders', href: '/orders', icon: Package },
        { name: 'Create Order', href: '/orders/create', icon: Plus },
        { name: 'Import Orders', href: '/orders/import', icon: Import },
        { name: 'CT Management', href: '/orders/ct-management', icon: QrCode },
        { name: 'FAI Documents', href: '/orders/fai', icon: Image },
      ]
    },
    {
      name: 'Printing',
      href: '/printing',
      icon: Printer,
      show: hasPermission('VIEW_ALL_ORDERS') || hasPermission('ACCESS_ADMIN_PANEL'),
      subItems: [
        { name: 'Label Designer', href: '/label-designer', icon: LayoutTemplate },
        { name: 'Label Templates', href: '/printing/templates', icon: FileSpreadsheet },
        { name: 'Print Queue', href: '/printing/queue', icon: ListChecks },
        { name: 'Printer Status', href: '/printing/status', icon: Network },
        { name: 'Quick Print', href: '/printing/quick', icon: Printer },
      ]
    },
    {
      name: 'Kitting/Packing',
      href: '/kitting',
      icon: Package,
      show: hasPermission('MANAGE_KITTING_PACKING'),
      subItems: [
        { name: 'Kitting Dashboard', href: '/kitting', icon: Gauge },
        { name: 'Work Queue', href: '/kitting/queue', icon: ListChecks },
        { name: 'On Hold Items', href: '/kitting/holds', icon: AlertCircle },
      ]
    },
    {
      name: 'Screening/QC',
      href: '/qc',
      icon: BarChart3,
      show: hasPermission('MANAGE_SCREENING_QC'),
      subItems: [
        { name: 'QC Dashboard', href: '/qc', icon: Gauge },
        { name: 'QC Models', href: '/qc/models', icon: Settings },
        { name: 'QC Reports', href: '/qc/reports', icon: FileBarChart },
        { name: 'Hold Management', href: '/qc/holds', icon: AlertCircle },
        { name: 'Rejection History', href: '/qc/rejections', icon: ClipboardList },
      ]
    },
    {
      name: 'NPQC',
      href: '/npqc',
      icon: Building2,
      show: hasPermission('MANAGE_NPQC'),
      subItems: [
        { name: 'NP Dashboard', href: '/npqc', icon: Gauge },
        { name: 'Transfers', href: '/npqc/transfers', icon: Truck },
        { name: 'Testing Queue', href: '/npqc/queue', icon: ListChecks },
      ]
    },
    {
      name: 'Invoicing',
      href: '/invoicing',
      icon: FileText,
      show: hasPermission('ACCESS_INVOICING'),
      subItems: [
        { name: 'Create Invoice', href: '/invoicing/create', icon: Plus },
        { name: 'Pending Invoices', href: '/invoicing/pending', icon: Clock },
        { name: 'Invoice History', href: '/invoicing/history', icon: FileText },
      ]
    },
    {
      name: 'Procurement',
      href: '/procurement',
      icon: Truck,
      show: hasPermission('ACCESS_PROCUREMENT'),
      subItems: [
        { name: 'Vendor Management', href: '/procurement/vendors', icon: Building2 },
        { name: 'Purchase Orders', href: '/procurement/orders', icon: FileText },
        { name: 'Stock Requests', href: '/procurement/requests', icon: ClipboardList },
      ]
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: FileBarChart,
      show: hasPermission('VIEW_ALL_ORDERS') || hasPermission('ACCESS_ADMIN_PANEL'),
      subItems: [
        { name: 'Order Reports', href: '/reports/orders', icon: Package },
        { name: 'QC Analytics', href: '/reports/qc', icon: BarChart3 },
        { name: 'Quantity Tracking', href: '/reports/quantities', icon: TrendingUp },
        { name: 'Export Data', href: '/reports/export', icon: FileDown },
      ]
    },
    {
      name: 'Users',
      href: '/users',
      icon: Users,
      show: hasPermission('MANAGE_USERS'),
      subItems: [
        { name: 'All Users', href: '/users', icon: Users },
        { name: 'Roles & Permissions', href: '/users/roles', icon: Shield },
        { name: 'Activity Log', href: '/users/activity', icon: ClipboardList },
      ]
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      show: hasPermission('ACCESS_ADMIN_PANEL'),
      subItems: [
        { name: 'General Settings', href: '/settings', icon: Settings },
        { name: 'Label Templates', href: '/settings?tab=labels', icon: LayoutTemplate },
        { name: 'Printer Config', href: '/settings?tab=printers', icon: Printer },
        { name: 'WhatsApp Settings', href: '/settings?tab=whatsapp', icon: MessageSquare },
        { name: 'Approval Workflows', href: '/settings?tab=approvals', icon: CheckSquare },
        { name: 'System Config', href: '/settings?tab=system', icon: UserCog },
      ]
    },
  ]

  const visibleItems = navigationItems.filter(item => item.show)

  const handleMouseEnter = (itemName: string) => {
    setActiveDropdown(itemName)
  }

  const handleMouseLeave = (itemName: string) => {
    // Small delay to allow moving to submenu
    setTimeout(() => {
      if (activeDropdown === itemName) {
        setActiveDropdown(null)
      }
    }, 100)
  }

  return (
    <nav className="bg-white shadow-sm border-b relative z-50">
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
                  const isActive = location.pathname === item.href || 
                    (item.subItems && item.subItems.some(sub => location.pathname === sub.href))
                  const hasSubmenu = item.subItems && item.subItems.length > 0
                  
                  return (
                    <div
                      key={item.name}
                      className="relative"
                      ref={(el) => dropdownRefs.current[item.name] = el}
                      onMouseEnter={() => hasSubmenu && handleMouseEnter(item.name)}
                      onMouseLeave={() => hasSubmenu && handleMouseLeave(item.name)}
                    >
                      <Link
                        to={item.href}
                        className={cn(
                          "px-2 py-1.5 rounded-md text-xs font-medium flex items-center transition-all duration-200",
                          isActive
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                          hasSubmenu && "pr-1"
                        )}
                      >
                        <Icon className="mr-1.5 h-3.5 w-3.5" />
                        {item.name}
                        {hasSubmenu && (
                          <ChevronDown className={cn(
                            "ml-0.5 h-3 w-3 transition-transform duration-200",
                            activeDropdown === item.name && "rotate-180"
                          )} />
                        )}
                      </Link>
                      
                      {/* Submenu dropdown */}
                      {hasSubmenu && activeDropdown === item.name && (
                        <div className="absolute left-0 mt-1 w-56 bg-white rounded-md shadow-lg border animate-in fade-in-0 zoom-in-95 duration-200">
                          <div className="py-1">
                            {item.subItems!.map((subItem) => {
                              const SubIcon = subItem.icon
                              return (
                                <Link
                                  key={subItem.href}
                                  to={subItem.href}
                                  className={cn(
                                    "block px-3 py-2 text-xs hover:bg-gray-50 transition-colors",
                                    location.pathname === subItem.href
                                      ? "bg-gray-50 text-gray-900 font-medium"
                                      : "text-gray-700"
                                  )}
                                  onClick={() => setActiveDropdown(null)}
                                >
                                  <div className="flex items-center">
                                    {SubIcon && <SubIcon className="mr-2 h-3.5 w-3.5 text-gray-400" />}
                                    <div>
                                      <div className="font-medium">{subItem.name}</div>
                                      {subItem.description && (
                                        <div className="text-[10px] text-gray-500 mt-0.5">
                                          {subItem.description}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </Link>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            
            {/* Compact navigation for medium screens */}
            <div className="hidden md:block lg:hidden">
              <div className="ml-6 flex items-baseline space-x-1">
                {visibleItems.slice(0, 5).map((item) => {
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
                <ChevronDown className={cn(
                  "ml-1 h-3 w-3 transition-transform duration-200",
                  showUserMenu && "rotate-180"
                )} />
              </Button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border z-50 animate-in fade-in-0 zoom-in-95 duration-200">
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

      {/* Mobile menu - remains simple for mobile */}
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            return (
              <div key={item.name}>
                <Link
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
                {/* Show submenu items on mobile as indented items */}
                {item.subItems && isActive && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.href}
                        to={subItem.href}
                        className="block px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
                      >
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </nav>
  )
}