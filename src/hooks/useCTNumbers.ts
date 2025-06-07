import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { CTDuplicateCheck } from '@/utils/ctNumberValidation'
// import { logCTAssignment, logCTDuplicateDetection } from './useCTAuditLog'

export interface CTNumber {
  id: string
  order_line_id: string
  ct_number: string
  assigned_at: string
  assigned_by: string
  status: 'assigned' | 'in_use' | 'completed'
  created_at: string
  updated_at: string
}

export interface CTNumberCreate {
  order_line_id: string
  ct_number: string
  assigned_by: string
}

// Manage real-time subscriptions for CT numbers
let ctSubscriptionsSetup = false
let activeCTSubscriptions: any[] = []

function setupCTRealtimeSubscriptions(queryClient: any, orderLineId?: string) {
  if (ctSubscriptionsSetup) {
    console.log('🔄 CT real-time subscriptions already active, skipping setup')
    return
  }

  console.log('🔄 Setting up real-time subscriptions for CT numbers...')
  ctSubscriptionsSetup = true

  // Create subscription for CT number changes
  const ctChannel = supabase
    .channel('ct_numbers_realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'ct_numbers'
      },
      (payload) => {
        console.log('🏷️ CT number changed:', payload.eventType, (payload.new as any)?.ct_number || 'Unknown')
        
        // Invalidate CT queries for all order lines
        queryClient.invalidateQueries({ queryKey: ['ct_numbers'] })
        
        // If we have a specific order line, invalidate it specifically
        if (orderLineId) {
          queryClient.invalidateQueries({ queryKey: ['ct_numbers', orderLineId] })
        }
      }
    )
    .subscribe((status) => {
      console.log('📡 CT Subscription status:', status)
    })

  activeCTSubscriptions.push(ctChannel)
}

function cleanupCTRealtimeSubscriptions() {
  if (!ctSubscriptionsSetup) return

  console.log('🔌 Cleaning up CT real-time subscriptions...')
  activeCTSubscriptions.forEach(subscription => {
    supabase.removeChannel(subscription)
  })
  activeCTSubscriptions = []
  ctSubscriptionsSetup = false
}

// Hook to get CT numbers for a specific order line with real-time updates
export function useCTNumbers(orderLineId: string) {
  const queryClient = useQueryClient()

  // Set up real-time subscriptions for CT numbers
  useEffect(() => {
    setupCTRealtimeSubscriptions(queryClient, orderLineId)

    return () => {
      // Don't cleanup immediately, let other components use the same subscriptions
    }
  }, [queryClient, orderLineId])

  return useQuery({
    queryKey: ['ct_numbers', orderLineId],
    queryFn: async (): Promise<CTNumber[]> => {
      const { data, error } = await supabase
        .from('ct_numbers')
        .select('*')
        .eq('order_line_id', orderLineId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch CT numbers: ${error.message}`)
      }

      return data || []
    },
    enabled: !!orderLineId,
    refetchOnWindowFocus: true,
    staleTime: 1000 * 10, // Consider data stale after 10 seconds for more frequent updates
  })
}

// Cleanup function for app-level cleanup
export function cleanupCTSubscriptions() {
  cleanupCTRealtimeSubscriptions()
}

// Hook to check for duplicate CT numbers
export function useCTDuplicateCheck() {
  return useMutation({
    mutationFn: async (ctNumbers: string[]): Promise<CTDuplicateCheck[]> => {
      if (ctNumbers.length === 0) return []

      const { data, error } = await supabase
        .from('ct_numbers')
        .select(`
          ct_number,
          order_line_id,
          assigned_at,
          status,
          order_line:order_lines!inner(uid)
        `)
        .in('ct_number', ctNumbers)

      if (error) {
        throw new Error(`Failed to check CT duplicates: ${error.message}`)
      }

      // Map results to CT duplicate check format
      return ctNumbers.map(ctNumber => {
        const existing = data.find(d => d.ct_number === ctNumber)
        
        if (existing) {
          const orderUid = (existing.order_line as any)?.uid || 'Unknown'
          
          // Log duplicate detection for audit trail
          // Note: We don't have user context here, will log from the component instead
          
          return {
            isDuplicate: true,
            existingOrderUid: orderUid,
            lastUsedDate: existing.assigned_at,
            canOverride: existing.status === 'completed', // Can override completed CTs
            warningMessage: `CT ${ctNumber} was previously assigned to order ${orderUid} on ${new Date(existing.assigned_at).toLocaleDateString()}`
          }
        }

        return {
          isDuplicate: false,
          canOverride: true
        }
      })
    }
  })
}

// Hook to save CT numbers to an order line
export function useSaveCTNumbers() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      orderLineId, 
      ctNumbers, 
      assignedBy 
    }: { 
      orderLineId: string
      ctNumbers: string[]
      assignedBy: string
    }) => {
      // First, check for duplicates
      const duplicateCheck = await supabase
        .from('ct_numbers')
        .select('ct_number')
        .in('ct_number', ctNumbers)
        .eq('status', 'assigned')

      if (duplicateCheck.error) {
        throw new Error(`Failed to check duplicates: ${duplicateCheck.error.message}`)
      }

      if (duplicateCheck.data.length > 0) {
        const duplicates = duplicateCheck.data.map(d => d.ct_number)
        throw new Error(`Duplicate CT numbers found: ${duplicates.join(', ')}`)
      }

      // Prepare CT records for insertion
      const ctRecords: Omit<CTNumber, 'id' | 'created_at' | 'updated_at'>[] = ctNumbers.map(ctNumber => ({
        order_line_id: orderLineId,
        ct_number: ctNumber,
        assigned_at: new Date().toISOString(),
        assigned_by: assignedBy,
        status: 'assigned' as const
      }))

      // Insert CT numbers
      const { data, error } = await supabase
        .from('ct_numbers')
        .insert(ctRecords)
        .select()

      if (error) {
        throw new Error(`Failed to save CT numbers: ${error.message}`)
      }

      return data
    },
    onSuccess: (data, variables) => {
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['ct_numbers', variables.orderLineId] })
      queryClient.invalidateQueries({ queryKey: ['orders'] }) // Refresh orders in case CT count affects display
      
      console.log('✅ CT numbers saved successfully:', data?.length)
    },
    onError: (error) => {
      console.error('❌ Failed to save CT numbers:', error)
    }
  })
}

// Hook to get CT number statistics for an order line
export function useCTNumberStats(orderLineId: string) {
  const { data: ctNumbers = [] } = useCTNumbers(orderLineId)

  return {
    total: ctNumbers.length,
    assigned: ctNumbers.filter(ct => ct.status === 'assigned').length,
    in_use: ctNumbers.filter(ct => ct.status === 'in_use').length,
    completed: ctNumbers.filter(ct => ct.status === 'completed').length,
    isComplete: false // Will implement based on order quantity later
  }
}

// Hook to update CT number status (e.g., mark as used)
export function useUpdateCTStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      ctId, 
      status 
    }: { 
      ctId: string
      status: 'assigned' | 'in_use' | 'completed'
    }) => {
      const { data, error } = await supabase
        .from('ct_numbers')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', ctId)
        .select()

      if (error) {
        throw new Error(`Failed to update CT status: ${error.message}`)
      }

      return data[0]
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['ct_numbers'] })
      console.log('✅ CT status updated:', data.ct_number, data.status)
    }
  })
}

// Hook to delete/remove CT numbers
export function useDeleteCTNumbers() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ctIds: string[]) => {
      const { error } = await supabase
        .from('ct_numbers')
        .delete()
        .in('id', ctIds)

      if (error) {
        throw new Error(`Failed to delete CT numbers: ${error.message}`)
      }

      return ctIds
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ct_numbers'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      console.log('✅ CT numbers deleted successfully')
    }
  })
}

// Utility function to get last used CT for a customer part number
export async function getLastUsedCTForPart(customerPartNumber: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('ct_numbers')
    .select(`
      ct_number,
      assigned_at,
      order_line:order_lines!inner(customer_part_number)
    `)
    .eq('order_line.customer_part_number', customerPartNumber)
    .order('assigned_at', { ascending: false })
    .limit(1)

  if (error || !data || data.length === 0) {
    return null
  }

  return data[0].ct_number
}