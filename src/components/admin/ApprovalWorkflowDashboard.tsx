// Approval Workflow Dashboard
// Admin interface for monitoring and managing approval workflows

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  AlertTriangle,
  Truck,
  Settings,
  RotateCcw
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useApprovalWorkflow } from '@/hooks/useApprovalWorkflow'

interface ApprovalWorkflow {
  id: string
  type: string
  order_line_id: string
  status: string
  data: any
  created_at: string
  expires_at: string
  approved_by?: string
  approved_at?: string
  rejected_at?: string
  notes?: string
}

export function ApprovalWorkflowDashboard() {
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)
  const { cleanupExpiredWorkflows } = useApprovalWorkflow()

  useEffect(() => {
    loadWorkflows()
  }, [statusFilter])

  const loadWorkflows = async () => {
    setIsLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('whatsapp_approval_workflows')
        .select('*')
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setWorkflows(data || [])
    } catch (error) {
      console.error('Failed to load approval workflows:', error)
      setError(error instanceof Error ? error.message : 'Failed to load workflows')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCleanupExpired = async () => {
    const result = await cleanupExpiredWorkflows()
    if (result.success) {
      await loadWorkflows()
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ct_duplicate':
        return <Settings className="h-4 w-4" />
      case 'qc_rejection':
        return <XCircle className="h-4 w-4" />
      case 'part_mapping':
        return <Settings className="h-4 w-4" />
      case 'transfer_authorization':
        return <Truck className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="text-orange-600 bg-orange-100">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      case 'approved':
        return <Badge variant="secondary" className="text-green-600 bg-green-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      case 'rejected':
        return <Badge variant="secondary" className="text-red-600 bg-red-100">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      case 'expired':
        return <Badge variant="secondary" className="text-gray-600 bg-gray-100">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ct_duplicate':
        return 'CT Duplicate Approval'
      case 'qc_rejection':
        return 'QC Rejection Approval'
      case 'part_mapping':
        return 'Part Mapping Approval'
      case 'transfer_authorization':
        return 'Transfer Authorization'
      default:
        return type.replace('_', ' ')
    }
  }

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  const pendingCount = workflows.filter(w => w.status === 'pending').length
  const approvedCount = workflows.filter(w => w.status === 'approved').length
  const rejectedCount = workflows.filter(w => w.status === 'rejected').length
  const expiredCount = workflows.filter(w => w.status === 'expired').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Approval Workflows</h2>
          <p className="text-sm text-gray-600">Monitor and manage WhatsApp approval workflows</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleCleanupExpired}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Cleanup Expired
          </Button>
          <Button variant="outline" size="sm" onClick={loadWorkflows}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <AlertTriangle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{expiredCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex space-x-2">
        {['all', 'pending', 'approved', 'rejected', 'expired'].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {/* Workflows List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading workflows...</div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Workflows</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={loadWorkflows} variant="outline">
              Try Again
            </Button>
          </div>
        ) : workflows.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No approval workflows found
          </div>
        ) : (
          workflows.map((workflow) => (
            <Card key={workflow.id} className={isExpired(workflow.expires_at) && workflow.status === 'pending' ? 'border-red-200' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getTypeIcon(workflow.type)}
                    <div>
                      <CardTitle className="text-lg">{getTypeLabel(workflow.type)}</CardTitle>
                      <div className="text-sm text-gray-500">
                        Order: {workflow.order_line_id} • ID: {workflow.id.slice(0, 8)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(workflow.status)}
                    {isExpired(workflow.expires_at) && workflow.status === 'pending' && (
                      <Badge variant="destructive" className="text-xs">
                        Expired
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Workflow Data */}
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(workflow.data || {}).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Created: {new Date(workflow.created_at).toLocaleString()}</span>
                    <span>Expires: {new Date(workflow.expires_at).toLocaleString()}</span>
                  </div>

                  {/* Approval Details */}
                  {workflow.approved_at && (
                    <div className="text-sm text-green-600">
                      ✅ Approved on {new Date(workflow.approved_at).toLocaleString()}
                    </div>
                  )}
                  {workflow.rejected_at && (
                    <div className="text-sm text-red-600">
                      ❌ Rejected on {new Date(workflow.rejected_at).toLocaleString()}
                    </div>
                  )}
                  {workflow.notes && (
                    <div className="text-sm">
                      <span className="text-gray-600">Notes:</span> {workflow.notes}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}