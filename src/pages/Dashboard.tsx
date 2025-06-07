import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Database, Users, Package, FileText, Settings } from 'lucide-react'

export function Dashboard() {
  const { user, permissions, hasPermission } = useAuth()

  const stats = [
    {
      name: 'Total Orders',
      value: '---',
      description: 'Pending database setup',
      icon: Package,
      show: hasPermission('VIEW_ALL_ORDERS') || hasPermission('VIEW_OWN_ORDERS'),
    },
    {
      name: 'Pending QC',
      value: '---',
      description: 'Awaiting QC completion',
      icon: FileText,
      show: hasPermission('MANAGE_SCREENING_QC'),
    },
    {
      name: 'Ready for Invoice',
      value: '---',
      description: 'Completed items',
      icon: FileText,
      show: hasPermission('ACCESS_INVOICING'),
    },
    {
      name: 'Active Users',
      value: '---',
      description: 'Currently online',
      icon: Users,
      show: hasPermission('MANAGE_USERS'),
    },
  ]

  const visibleStats = stats.filter(stat => stat.show)

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.first_name}!
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Here's what's happening with your orders today.
        </p>
      </div>

      {/* Database Status Alert */}
      <Alert>
        <Database className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>
              <strong>Database Setup Pending:</strong> MCP connection configured, waiting for direct API access to create tables and initial data.
            </span>
            <Badge variant="outline">Ready to Deploy</Badge>
          </div>
        </AlertDescription>
      </Alert>

      {/* User Role Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Your Access Level
          </CardTitle>
          <CardDescription>
            Current role and permissions in the Mini-ERP system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium text-gray-600">Role:</span>
              <Badge className="ml-2" variant="secondary">
                {user?.role?.name}
              </Badge>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-600">Permissions:</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {permissions && Object.entries(permissions)
                  .filter(([_, value]) => value === true)
                  .slice(0, 8) // Show first 8 permissions
                  .map(([key]) => (
                    <Badge key={key} variant="outline" className="text-xs">
                      {key.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                {permissions && Object.values(permissions).filter(v => v).length > 8 && (
                  <Badge variant="outline" className="text-xs">
                    +{Object.values(permissions).filter(v => v).length - 8} more
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      {visibleStats.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {visibleStats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.name}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.name}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            System Status
          </CardTitle>
          <CardDescription>
            Current application setup progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Project Foundation</span>
              <Badge variant="default">✓ Complete</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Authentication System</span>
              <Badge variant="default">✓ Complete</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Database Schema</span>
              <Badge variant="secondary">Ready to Deploy</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Order Management UI</span>
              <Badge variant="outline">In Progress</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">MCP Database Access</span>
              <Badge variant="outline">Pending Activation</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}