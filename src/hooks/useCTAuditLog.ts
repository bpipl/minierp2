import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface CTAuditLog {
  id: string
  ct_number: string
  order_line_id: string
  action_type: 'assigned' | 'duplicate_detected' | 'override_requested' | 'override_approved' | 'override_denied' | 'status_changed' | 'deleted'
  performed_by: string
  previous_data?: Record<string, any>
  new_data?: Record<string, any>
  metadata?: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface CreateAuditLogData {
  ct_number: string
  order_line_id: string
  action_type: CTAuditLog['action_type']
  performed_by: string
  previous_data?: Record<string, any>
  new_data?: Record<string, any>
  metadata?: Record<string, any>
}

// Hook to create audit log entries
export function useCreateCTAuditLog() {
  return useMutation({
    mutationFn: async (logData: CreateAuditLogData) => {
      // Get browser information for audit trail
      const userAgent = navigator.userAgent
      
      const auditEntry = {
        ...logData,
        user_agent: userAgent,
        metadata: {
          timestamp: new Date().toISOString(),
          browser: userAgent,
          ...logData.metadata
        }
      }

      const { data, error } = await supabase
        .from('ct_audit_logs')
        .insert([auditEntry])
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create audit log: ${error.message}`)
      }

      console.log('📋 CT Audit log created:', logData.action_type, logData.ct_number)
      return data
    },
    onError: (error) => {
      console.error('❌ Failed to create CT audit log:', error)
    }
  })
}

// Hook to get audit logs for a specific CT number
export function useCTAuditLogs(ctNumber?: string) {
  return useQuery({
    queryKey: ['ct_audit_logs', ctNumber],
    queryFn: async (): Promise<CTAuditLog[]> => {
      if (!ctNumber) return []

      const { data, error } = await supabase
        .from('ct_audit_logs')
        .select(`
          *,
          user:users(first_name, last_name, email)
        `)
        .eq('ct_number', ctNumber)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch CT audit logs: ${error.message}`)
      }

      return data || []
    },
    enabled: !!ctNumber
  })
}

// Hook to get audit logs for an order line
export function useOrderLineCTAuditLogs(orderLineId?: string) {
  return useQuery({
    queryKey: ['ct_audit_logs', 'order_line', orderLineId],
    queryFn: async (): Promise<CTAuditLog[]> => {
      if (!orderLineId) return []

      const { data, error } = await supabase
        .from('ct_audit_logs')
        .select(`
          *,
          user:users(first_name, last_name, email)
        `)
        .eq('order_line_id', orderLineId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch order line CT audit logs: ${error.message}`)
      }

      return data || []
    },
    enabled: !!orderLineId
  })
}

// Utility function to log CT assignment
export async function logCTAssignment(
  ctNumber: string,
  orderLineId: string,
  performedBy: string,
  metadata?: Record<string, any>
) {
  const { error } = await supabase
    .from('ct_audit_logs')
    .insert([{
      ct_number: ctNumber,
      order_line_id: orderLineId,
      action_type: 'assigned',
      performed_by: performedBy,
      new_data: { status: 'assigned', assigned_at: new Date().toISOString() },
      metadata: {
        auto_logged: true,
        ...metadata
      }
    }])

  if (error) {
    console.error('Failed to log CT assignment:', error)
  }
}

// Utility function to log duplicate detection
export async function logCTDuplicateDetection(
  ctNumber: string,
  orderLineId: string,
  performedBy: string,
  existingOrderUid: string,
  metadata?: Record<string, any>
) {
  const { error } = await supabase
    .from('ct_audit_logs')
    .insert([{
      ct_number: ctNumber,
      order_line_id: orderLineId,
      action_type: 'duplicate_detected',
      performed_by: performedBy,
      metadata: {
        existing_order_uid: existingOrderUid,
        warning_shown: true,
        auto_logged: true,
        ...metadata
      }
    }])

  if (error) {
    console.error('Failed to log CT duplicate detection:', error)
  }
}