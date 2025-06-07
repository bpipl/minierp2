import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { OrderLineFormData, Customer, ProductCategory } from '@/types'

interface CreateOrderData extends OrderLineFormData {
  created_by: string
}

// Hook to fetch customers for dropdown
function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async (): Promise<Customer[]> => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) {
        throw new Error(`Failed to fetch customers: ${error.message}`)
      }

      return data || []
    }
  })
}

// Hook to fetch product categories for dropdown
function useProductCategories() {
  return useQuery({
    queryKey: ['product_categories'],
    queryFn: async (): Promise<ProductCategory[]> => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) {
        throw new Error(`Failed to fetch categories: ${error.message}`)
      }

      return data || []
    }
  })
}

// Generate next UID based on existing orders
async function generateNextUID(): Promise<string> {
  const uidPrefix = import.meta.env.VITE_UID_PREFIX || 'A'
  
  // Get ALL UIDs with this prefix and find the highest number
  const { data, error } = await supabase
    .from('order_lines')
    .select('uid')
    .like('uid', `${uidPrefix}%`)
    .order('uid', { ascending: false })

  if (error) {
    throw new Error(`Failed to get existing UIDs: ${error.message}`)
  }

  let nextNumber = 1
  
  if (data && data.length > 0) {
    // Find the highest number from all UIDs
    const numbers = data
      .map(item => {
        const numberPart = item.uid.replace(uidPrefix, '')
        return parseInt(numberPart, 10)
      })
      .filter(num => !isNaN(num))
      .sort((a, b) => b - a) // Sort descending
    
    if (numbers.length > 0) {
      nextNumber = numbers[0] + 1
    }
  }

  // Format with leading zeros (3 digits)
  const formattedNumber = nextNumber.toString().padStart(3, '0')
  const newUID = `${uidPrefix}${formattedNumber}`
  
  console.log('🆔 Generated new UID:', newUID, 'from existing:', data?.map(d => d.uid))
  return newUID
}

// Convert DDMMYY string to ISO date format for database
function convertDateToISO(ddmmyy: string): string | null {
  if (!ddmmyy || ddmmyy.length !== 6) return null
  
  const day = ddmmyy.substring(0, 2)
  const month = ddmmyy.substring(2, 4)
  const year = `20${ddmmyy.substring(4, 6)}` // Assume 20xx years
  
  // Validate the date
  const date = new Date(`${year}-${month}-${day}`)
  if (isNaN(date.getTime())) return null
  
  return date.toISOString().split('T')[0] // Return YYYY-MM-DD format
}

// Main hook for order creation
export function useCreateOrder() {
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()
  
  // Fetch customers and categories
  const { data: customers = [] } = useCustomers()
  const { data: categories = [] } = useProductCategories()

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: CreateOrderData): Promise<string> => {
      setError(null)
      
      try {
        // Generate next UID
        const uid = await generateNextUID()
        
        // Prepare order data for database
        const dbOrderData = {
          uid,
          customer_id: orderData.customer_id,
          po_number: orderData.po_number || null,
          po_date: orderData.po_date ? convertDateToISO(orderData.po_date) : null,
          customer_part_number: orderData.customer_part_number.trim(),
          core_part_number: orderData.core_part_number?.trim() || null,
          customer_description: orderData.customer_description?.trim() || null,
          bpi_description: orderData.bpi_description?.trim() || null,
          product_category_id: orderData.product_category_id,
          order_quantity: orderData.order_quantity,
          price: orderData.price || null,
          lead_time: orderData.lead_time?.trim() || null,
          current_eta: orderData.current_eta ? convertDateToISO(orderData.current_eta) : null,
          vid: orderData.vid?.trim() || null,
          msc: orderData.msc?.trim() || null,
          misc_field_1: orderData.misc_field_1?.trim() || null,
          misc_field_2: orderData.misc_field_2?.trim() || null,
          misc_field_3: orderData.misc_field_3?.trim() || null,
          created_by: orderData.created_by,
          part_mapping_approved: false,
          assigned_user_ids: [],
          eta_delay_reasons: {}
        }

        // Insert the order
        const { data, error: insertError } = await supabase
          .from('order_lines')
          .insert([dbOrderData])
          .select()
          .single()

        if (insertError) {
          throw new Error(`Failed to create order: ${insertError.message}`)
        }

        if (!data) {
          throw new Error('Order created but no data returned')
        }

        // Create initial quantities record
        const quantitiesData = {
          order_line_id: data.id,
          total_order_quantity: orderData.order_quantity,
          pending_procurement: orderData.order_quantity, // Start with all quantity pending
          requested_from_stock: 0,
          awaiting_kitting_packing: 0,
          in_kitting_packing: 0,
          on_hold_kitting: 0,
          kitted_awaiting_qc: 0,
          in_screening_qc: 0,
          on_hold_qc: 0,
          qc_passed_ready_invoice: 0,
          qc_rejected: 0,
          invoiced: 0,
          shipped_delivered: 0,
          cancelled: 0
        }

        const { error: quantitiesError } = await supabase
          .from('order_line_quantities')
          .insert([quantitiesData])

        if (quantitiesError) {
          console.error('Failed to create quantities record:', quantitiesError)
          // Don't throw here as the order was created successfully
          // The quantities can be created manually or through migration
        }

        console.log('✅ Order created successfully:', uid)
        return uid

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
        setError(errorMessage)
        throw err
      }
    },
    onSuccess: (uid) => {
      // Invalidate orders query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      console.log('🔄 Orders list refreshed after creating:', uid)
    },
    onError: (err) => {
      console.error('❌ Failed to create order:', err)
    }
  })

  // Main create function
  const createOrder = async (orderData: CreateOrderData): Promise<string> => {
    return createOrderMutation.mutateAsync(orderData)
  }

  return {
    customers,
    categories,
    createOrder,
    isLoading: createOrderMutation.isPending,
    error,
    reset: () => {
      setError(null)
      createOrderMutation.reset()
    }
  }
}

// Export individual hooks for specific use cases
export { useCustomers, useProductCategories }