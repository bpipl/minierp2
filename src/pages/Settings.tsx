import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WhatsAppSettings } from '@/components/admin/WhatsAppSettings'
import { ApprovalWorkflowDashboard } from '@/components/admin/ApprovalWorkflowDashboard'
import { 
  Settings as SettingsIcon, 
  MessageSquare, 
  Users, 
  Database, 
  Shield,
  Bell,
  Palette,
  CheckSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function Settings() {
  const { hasPermission } = useAuth()
  const [activeSection, setActiveSection] = useState<'general' | 'whatsapp' | 'approvals' | 'users' | 'database' | 'security' | 'notifications' | 'appearance'>('whatsapp')

  // Check if user has admin access
  if (!hasPermission('ACCESS_ADMIN_PANEL')) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-500">
              You don't have permission to access the admin settings panel.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const settingsSections = [
    {
      id: 'general',
      name: 'General',
      icon: SettingsIcon,
      description: 'Basic application settings'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: MessageSquare,
      description: 'WhatsApp integration and messaging'
    },
    {
      id: 'approvals',
      name: 'Approval Workflows',
      icon: CheckSquare,
      description: 'Interactive approval workflow management'
    },
    {
      id: 'users',
      name: 'Users & Roles',
      icon: Users,
      description: 'User management and permissions'
    },
    {
      id: 'database',
      name: 'Database',
      icon: Database,
      description: 'Database configuration and maintenance'
    },
    {
      id: 'security',
      name: 'Security',
      icon: Shield,
      description: 'Security policies and access control'
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: Bell,
      description: 'Email and notification settings'
    },
    {
      id: 'appearance',
      name: 'Appearance',
      icon: Palette,
      description: 'UI themes and customization'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your Mini-ERP system configuration and integrations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {settingsSections.map((section) => {
                  const Icon = section.icon
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id as any)}
                      className={cn(
                        "w-full text-left px-4 py-3 flex items-center space-x-3 transition-colors",
                        activeSection === section.id
                          ? "bg-blue-50 border-r-2 border-blue-500 text-blue-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">{section.name}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {section.description}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {activeSection === 'whatsapp' && <WhatsAppSettings />}
          {activeSection === 'approvals' && <ApprovalWorkflowDashboard />}
          
          {activeSection === 'general' && (
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <SettingsIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">General Settings</h3>
                  <p className="text-gray-500">
                    General application settings will be implemented in the next phase.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'users' && (
            <Card>
              <CardHeader>
                <CardTitle>Users & Roles Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">User Management</h3>
                  <p className="text-gray-500">
                    User and role management interface will be implemented in the next phase.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'database' && (
            <Card>
              <CardHeader>
                <CardTitle>Database Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Database Settings</h3>
                  <p className="text-gray-500">
                    Database configuration and maintenance tools will be implemented in the next phase.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Security Configuration</h3>
                  <p className="text-gray-500">
                    Security policies and access control settings will be implemented in the next phase.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Notification Configuration</h3>
                  <p className="text-gray-500">
                    Email and notification settings will be implemented in the next phase.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'appearance' && (
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Appearance Customization</h3>
                  <p className="text-gray-500">
                    UI themes and appearance settings will be implemented in the next phase.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}