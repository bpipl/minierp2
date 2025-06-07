import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { OrderLineWithDetails } from './useOrders'

// Types for optimistic updates
export interface QuantityUpdate {
  orderLineId: string
  field: string
  newValue: number
  oldValue: number
}

export interface StatusUpdate {
  orderLineId: string
  newStatus: string
  oldStatus: string
}

// Hook for optimistic quantity updates
export function useOptimisticQuantityUpdate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ orderLineId, updates }: { 
      orderLineId: string
      updates: Record<string, number>
    }) => {
      const { data, error } = await supabase
        .from('order_line_quantities')
        .update(updates)
        .eq('order_line_id', orderLineId)
        .select()

      if (error) {
        throw new Error(`Failed to update quantities: ${error.message}`)
      }

      return data[0]
    },
    onMutate: async ({ orderLineId, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['orders'] })

      // Snapshot the previous value
      const previousOrders = queryClient.getQueryData<OrderLineWithDetails[]>(['orders'])

      // Optimistically update the cache
      queryClient.setQueryData<OrderLineWithDetails[]>(['orders'], (oldOrders) => {
        if (!oldOrders) return oldOrders

        return oldOrders.map(order => {
          if (order.id === orderLineId && order.quantities) {
            return {
              ...order,
              quantities: {
                ...order.quantities,
                ...updates,
                updated_at: new Date().toISOString()
              }
            }
          }
          return order
        })
      })

      // Return a context object with the snapshot
      return { previousOrders }
    },
    onError: (err, _variables, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousOrders) {
        queryClient.setQueryData(['orders'], context.previousOrders)
      }
      console.error('Optimistic update failed:', err)
    },
    onSuccess: () => {
      // Invalidate and refetch to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

// Hook for optimistic status updates
export function useOptimisticStatusUpdate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ orderLineId, status }: { 
      orderLineId: string
      status: string
    }) => {
      const { data, error } = await supabase
        .from('order_lines')
        .update({ current_status: status, updated_at: new Date().toISOString() })
        .eq('id', orderLineId)
        .select()

      if (error) {
        throw new Error(`Failed to update status: ${error.message}`)
      }

      return data[0]
    },
    onMutate: async ({ orderLineId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['orders'] })

      const previousOrders = queryClient.getQueryData<OrderLineWithDetails[]>(['orders'])

      queryClient.setQueryData<OrderLineWithDetails[]>(['orders'], (oldOrders) => {
        if (!oldOrders) return oldOrders

        return oldOrders.map(order => {
          if (order.id === orderLineId) {
            return {
              ...order,
              current_status: status,
              updated_at: new Date().toISOString()
            }
          }
          return order
        })
      })

      return { previousOrders }
    },
    onError: (err, _variables, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(['orders'], context.previousOrders)
      }
      console.error('Status update failed:', err)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

// Hook to create a new order optimistically
export function useOptimisticOrderCreate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newOrder: Partial<OrderLineWithDetails>) => {
      const { data, error } = await supabase
        .from('order_lines')
        .insert([newOrder])
        .select(`
          *,
          customer:customers(name),
          product_category:product_categories(name),
          quantities:order_line_quantities(*)
        `)

      if (error) {
        throw new Error(`Failed to create order: ${error.message}`)
      }

      return data[0]
    },
    onMutate: async (newOrder) => {
      await queryClient.cancelQueries({ queryKey: ['orders'] })

      const previousOrders = queryClient.getQueryData<OrderLineWithDetails[]>(['orders'])

      // Create a temporary ID for optimistic update
      const tempId = `temp-${Date.now()}`
      const optimisticOrder: OrderLineWithDetails = {
        ...newOrder as OrderLineWithDetails,
        id: tempId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      queryClient.setQueryData<OrderLineWithDetails[]>(['orders'], (oldOrders) => {
        if (!oldOrders) return [optimisticOrder]
        return [optimisticOrder, ...oldOrders]
      })

      return { previousOrders }
    },
    onError: (err, _variables, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(['orders'], context.previousOrders)
      }
      console.error('Order creation failed:', err)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}