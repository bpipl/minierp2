import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { OrderLine } from '@/types'

// Extended order line type for UI display
export type OrderLineWithDetails = OrderLine & {
  customer_name?: string
  category_name?: string
  quantities?: {
    order_line_id: string
    total_order_quantity: number
    pending_procurement: number
    requested_from_stock: number
    awaiting_kitting_packing: number
    in_kitting_packing: number
    on_hold_kitting: number
    kitted_awaiting_qc: number
    in_screening_qc: number
    on_hold_qc: number
    qc_passed_ready_invoice: number
    qc_rejected: number
    invoiced: number
    shipped_delivered: number
    cancelled: number
    updated_at: string
  }
  // UI-specific computed fields
  globalPendingForHP?: number
  currentEtaStatus?: 'rfq' | 'first' | 'second' | 'third' | 'final' | 'overdue'
  isBlinking?: boolean
}

// Utility function to determine ETA status based on dates
function determineEtaStatus(orderLine: any): 'rfq' | 'first' | 'second' | 'third' | 'final' | 'overdue' {
  const currentDate = new Date()
  const etaDate = new Date(orderLine.current_eta)
  
  // If ETA is in the past, it's overdue
  if (etaDate < currentDate) {
    return 'overdue'
  }
  
  // For now, return 'first' as default - can be enhanced based on ETA tracking logic
  // This would need to be expanded based on the actual ETA history in the database
  if (orderLine.first_eta_date) return 'first'
  if (orderLine.second_eta_date) return 'second'
  if (orderLine.third_eta_date) return 'third'
  if (orderLine.final_eta_date) return 'final'
  
  return 'rfq'
}

// Utility function to format dates from database to DDMMYY format
function formatDateToDDMMYY(dateString?: string): string {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear().toString().slice(-2)
  
  return `${day}${month}${year}`
}

// Main query function to fetch orders data
async function fetchOrdersData(): Promise<OrderLineWithDetails[]> {
  const { data, error } = await supabase
    .from('order_lines')
    .select(`
      *,
      customer:customers(name),
      product_category:product_categories(name),
      quantities:order_line_quantities(*)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching orders:', error)
    throw new Error(`Failed to fetch orders: ${error.message}`)
  }

  // Transform the data for UI consumption
  const transformedData: OrderLineWithDetails[] = data.map((item: any) => {
    // Calculate global pending for HP (total - cancelled - completed stages)
    const quantities = item.quantities
    const globalPendingForHP = quantities 
      ? quantities.total_order_quantity - quantities.cancelled - quantities.invoiced - quantities.shipped_delivered
      : item.order_quantity

    // Determine ETA status and blinking
    const currentEtaStatus = determineEtaStatus(item)
    const isBlinking = currentEtaStatus === 'overdue'

    return {
      ...item,
      // Add computed customer and category names
      customer_name: item.customer?.name,
      category_name: item.product_category?.name,
      
      // Format dates to DDMMYY for display
      po_date: formatDateToDDMMYY(item.po_date),
      current_eta: formatDateToDDMMYY(item.current_eta),
      
      // Add UI-specific computed fields
      globalPendingForHP,
      currentEtaStatus,
      isBlinking,
      
      // Flatten quantities for easier access
      quantities: quantities ? {
        order_line_id: quantities.order_line_id,
        total_order_quantity: quantities.total_order_quantity,
        pending_procurement: quantities.pending_procurement,
        requested_from_stock: quantities.requested_from_stock,
        awaiting_kitting_packing: quantities.awaiting_kitting_packing,
        in_kitting_packing: quantities.in_kitting_packing,
        on_hold_kitting: quantities.on_hold_kitting,
        kitted_awaiting_qc: quantities.kitted_awaiting_qc,
        in_screening_qc: quantities.in_screening_qc,
        on_hold_qc: quantities.on_hold_qc,
        qc_passed_ready_invoice: quantities.qc_passed_ready_invoice,
        qc_rejected: quantities.qc_rejected,
        invoiced: quantities.invoiced,
        shipped_delivered: quantities.shipped_delivered,
        cancelled: quantities.cancelled,
        updated_at: quantities.updated_at
      } : undefined
    }
  })

  return transformedData
}

// Custom hook to manage real-time subscriptions (singleton pattern)
let subscriptionsSetup = false
let activeSubscriptions: any[] = []

function setupRealtimeSubscriptions(queryClient: any) {
  if (subscriptionsSetup) {
    console.log('🔄 Real-time subscriptions already active, skipping setup')
    return
  }

  console.log('🔄 Setting up real-time subscriptions for orders...')
  subscriptionsSetup = true

  // Create a single subscription channel for all table changes
  const ordersChannel = supabase
    .channel('orders_realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'order_lines'
      },
      (payload) => {
        console.log('📦 Order line changed:', payload.eventType)
        queryClient.invalidateQueries({ queryKey: ['orders'] })
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'order_line_quantities'
      },
      (payload) => {
        console.log('📊 Quantities changed:', payload.eventType)
        queryClient.invalidateQueries({ queryKey: ['orders'] })
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'customers'
      },
      (payload) => {
        console.log('👥 Customer changed:', payload.eventType)
        queryClient.invalidateQueries({ queryKey: ['orders'] })
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'product_categories'
      },
      (payload) => {
        console.log('🏷️ Category changed:', payload.eventType)
        queryClient.invalidateQueries({ queryKey: ['orders'] })
      }
    )
    .subscribe((status) => {
      console.log('📡 Subscription status:', status)
    })

  activeSubscriptions.push(ordersChannel)
}

function cleanupRealtimeSubscriptions() {
  if (!subscriptionsSetup) return

  console.log('🔌 Cleaning up real-time subscriptions...')
  activeSubscriptions.forEach(subscription => {
    supabase.removeChannel(subscription)
  })
  activeSubscriptions = []
  subscriptionsSetup = false
}

export function useOrders() {
  const queryClient = useQueryClient()

  // Set up real-time subscriptions (only once)
  useEffect(() => {
    setupRealtimeSubscriptions(queryClient)

    // Cleanup only happens when the last component unmounts
    return () => {
      // We don't cleanup immediately, let other components use the same subscriptions
      // Cleanup will happen when the app unmounts or page refreshes
    }
  }, [queryClient])

  return useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrdersData,
    refetchOnWindowFocus: true,
    staleTime: 1000 * 30, // Consider data stale after 30 seconds
    // Fallback polling in case real-time fails
    refetchInterval: 60000, // Every minute as backup
  })
}

// Cleanup function for app-level cleanup
export function cleanupOrdersSubscriptions() {
  cleanupRealtimeSubscriptions()
}

// Hook for getting order statistics
export function useOrderStats() {
  const { data: orders, isLoading } = useOrders()
  
  if (isLoading || !orders) {
    return {
      totalOrders: 0,
      pendingTotal: 0,
      inQCTotal: 0,
      completedTotal: 0,
      isLoading
    }
  }

  const stats = orders.reduce((acc, order) => {
    const quantities = order.quantities
    if (quantities) {
      acc.pendingTotal += quantities.pending_procurement
      acc.inQCTotal += quantities.in_screening_qc
      acc.completedTotal += quantities.qc_passed_ready_invoice
    }
    return acc
  }, {
    totalOrders: orders.length,
    pendingTotal: 0,
    inQCTotal: 0,
    completedTotal: 0
  })

  return {
    ...stats,
    isLoading
  }
}