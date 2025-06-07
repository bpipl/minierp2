// WhatsApp Integration Hook
// Core hook for sending messages with dual provider support (Meta Cloud API + N8N)

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { WhatsAppProviderManager } from '@/services/WhatsAppProviderManager'
import { 
  WhatsAppTemplate, 
  WhatsAppMessage, 
  WhatsAppWebhookPayload, 
  MessageType,
  OrderLineData,
  MessagePriority
} from '@/types/whatsapp'

export function useWhatsApp() {
  const [isLoading, setIsLoading] = useState(false)
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
  const [providerManager] = useState(() => new WhatsAppProviderManager())
  const { user } = useAuth()

  // Initialize provider manager
  useEffect(() => {
    providerManager.initialize().catch(console.error)
  }, [])

  // Load WhatsApp templates
  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      setTemplates(data || [])
      return data || []
    } catch (error) {
      console.error('Failed to load WhatsApp templates:', error)
      return []
    }
  }

  // Send WhatsApp message via N8N webhook
  const sendMessage = async ({
    content,
    recipients = [],
    recipientGroups = [],
    messageType = 'manual',
    orderLineId,
    templateId,
    priority = 'medium'
  }: {
    content: string
    recipients?: string[]
    recipientGroups?: string[]
    messageType?: MessageType
    orderLineId?: string
    templateId?: string
    priority?: MessagePriority
  }): Promise<{ success: boolean; messageId?: string; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'User not authenticated' }
    }

    setIsLoading(true)

    try {
      // Get order line data if provided
      let orderData: OrderLineData | undefined
      if (orderLineId) {
        orderData = await getOrderLineData(orderLineId)
      }

      // Create message record in database
      const messageRecord = {
        template_id: templateId,
        content,
        recipients,
        recipient_groups: recipientGroups,
        order_line_id: orderLineId,
        triggered_by: user.id,
        message_type: messageType,
        status: 'pending',
        sent_at: new Date().toISOString()
      }

      const { data: insertedMessage, error: insertError } = await supabase
        .from('whatsapp_messages')
        .insert([messageRecord])
        .select()
        .single()

      if (insertError) throw insertError

      // Send to N8N webhook
      const webhookUrl = await getWebhookUrl(messageType)
      if (!webhookUrl) {
        throw new Error('No webhook configured for this message type')
      }

      const payload: WhatsAppWebhookPayload = {
        messageType,
        content,
        recipients,
        recipientGroups,
        orderData,
        templateId,
        triggeredBy: user.id,
        priority
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`)
      }

      // Update message status to sent
      await supabase
        .from('whatsapp_messages')
        .update({ 
          status: 'sent',
          delivery_status: 'pending'
        })
        .eq('id', insertedMessage.id)

      return { success: true, messageId: insertedMessage.id }

    } catch (error) {
      console.error('Failed to send WhatsApp message:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      // Update message status to failed if we have a message ID
      // Note: This would need the message ID from a partial success scenario
      
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  // Get order line data for WhatsApp message
  const getOrderLineData = async (orderLineId: string): Promise<OrderLineData | undefined> => {
    try {
      const { data, error } = await supabase
        .from('order_lines')
        .select(`
          uid,
          customer_part_number,
          bpi_description,
          order_quantity,
          po_number,
          current_eta,
          customers!inner(name),
          order_line_quantities(
            pending_procurement,
            requested_from_stock,
            awaiting_kitting_packing,
            in_kitting_packing,
            kitted_awaiting_qc,
            in_screening_qc,
            qc_passed_ready_invoice,
            qc_rejected
          ),
          ct_numbers(ct_number)
        `)
        .eq('uid', orderLineId)
        .single()

      if (error) throw error

      // Determine current status based on quantities
      let currentStatus = 'Pending Procurement'
      const quantities = data.order_line_quantities[0]
      if (quantities) {
        if (quantities.qc_rejected > 0) currentStatus = 'QC Rejected'
        else if (quantities.qc_passed_ready_invoice > 0) currentStatus = 'Ready for Invoice'
        else if (quantities.in_screening_qc > 0) currentStatus = 'In QC'
        else if (quantities.kitted_awaiting_qc > 0) currentStatus = 'Awaiting QC'
        else if (quantities.in_kitting_packing > 0) currentStatus = 'In Kitting'
        else if (quantities.awaiting_kitting_packing > 0) currentStatus = 'Awaiting Kitting'
        else if (quantities.requested_from_stock > 0) currentStatus = 'Requested from Stock'
      }

      return {
        uid: data.uid,
        customerName: (data.customers as any)?.name || 'Unknown Customer',
        customerPartNumber: data.customer_part_number,
        bpiDescription: data.bpi_description || '',
        orderQuantity: data.order_quantity,
        currentStatus,
        ctNumbers: data.ct_numbers.map(ct => ct.ct_number),
        poNumber: data.po_number || undefined,
        eta: data.current_eta || undefined
      }
    } catch (error) {
      console.error('Failed to get order line data:', error)
      return undefined
    }
  }

  // Get webhook URL for message type
  const getWebhookUrl = async (messageType: MessageType): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_webhook_configs')
        .select('url')
        .eq('message_type', messageType)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        // Fallback to environment variable
        return import.meta.env.VITE_N8N_WEBHOOK_URL || null
      }

      return data.url
    } catch (error) {
      console.error('Failed to get webhook URL:', error)
      return import.meta.env.VITE_N8N_WEBHOOK_URL || null
    }
  }

  // Process template with placeholders
  const processTemplate = (template: string, orderData?: OrderLineData, customData?: Record<string, string>): string => {
    let processed = template

    // Order data placeholders
    if (orderData) {
      processed = processed
        .replace(/\{\{UID\}\}/g, orderData.uid)
        .replace(/\{\{CustomerName\}\}/g, orderData.customerName)
        .replace(/\{\{CustomerPartNumber\}\}/g, orderData.customerPartNumber)
        .replace(/\{\{BPIDescription\}\}/g, orderData.bpiDescription)
        .replace(/\{\{OrderQuantity\}\}/g, orderData.orderQuantity.toString())
        .replace(/\{\{CurrentStatus\}\}/g, orderData.currentStatus)
        .replace(/\{\{CTNumbers\}\}/g, orderData.ctNumbers?.join(', ') || 'Not assigned')
        .replace(/\{\{PONumber\}\}/g, orderData.poNumber || 'Not set')
        .replace(/\{\{ETA\}\}/g, orderData.eta || 'Not set')
    }

    // User and system placeholders
    if (user) {
      processed = processed
        .replace(/\{\{UserName\}\}/g, user.email?.split('@')[0] || 'Unknown')
    }

    processed = processed
      .replace(/\{\{DateTime\}\}/g, new Date().toLocaleString())

    // Custom data placeholders
    if (customData) {
      Object.entries(customData).forEach(([key, value]) => {
        processed = processed.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
      })
    }

    return processed
  }

  // Get message history for order
  const getMessageHistory = async (orderLineId: string): Promise<WhatsAppMessage[]> => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('order_line_id', orderLineId)
        .order('sent_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get message history:', error)
      return []
    }
  }

  // Auto-trigger notifications based on order status changes
  const triggerAutoNotification = async (
    orderLineId: string, 
    notificationType: MessageType,
    customData?: Record<string, string>
  ): Promise<void> => {
    try {
      // Find appropriate template
      const relevantTemplates = templates.filter(t => {
        switch (notificationType) {
          case 'qc_rejection':
            return t.category === 'qc_alerts' && t.name.toLowerCase().includes('rejection')
          case 'part_mapping_approval':
            return t.category === 'approvals' && t.name.toLowerCase().includes('mapping')
          case 'transfer_notification':
            return t.category === 'transfers'
          default:
            return false
        }
      })

      const template = relevantTemplates.find(t => t.isDefault) || relevantTemplates[0]
      if (!template) {
        console.warn(`No template found for notification type: ${notificationType}`)
        return
      }

      // Get order data
      const orderData = await getOrderLineData(orderLineId)
      if (!orderData) {
        console.error('Failed to get order data for auto notification')
        return
      }

      // Process template content
      const content = processTemplate(template.content, orderData, customData)

      // Get default recipient groups based on notification type
      const recipientGroups = getDefaultRecipientGroups(notificationType)

      // Send notification
      await sendMessage({
        content,
        recipientGroups,
        messageType: notificationType,
        orderLineId,
        templateId: template.id,
        priority: notificationType === 'qc_rejection' ? 'urgent' : 'high'
      })

    } catch (error) {
      console.error('Failed to trigger auto notification:', error)
    }
  }

  // Get default recipient groups for notification type
  const getDefaultRecipientGroups = (notificationType: MessageType): string[] => {
    switch (notificationType) {
      case 'qc_rejection':
      case 'part_mapping_approval':
        return ['directors', 'sbStaff']
      case 'transfer_notification':
        return ['npStaff']
      case 'security_alert':
        return ['directors']
      default:
        return ['directors']
    }
  }

  return {
    isLoading,
    templates,
    loadTemplates,
    sendMessage,
    processTemplate,
    getMessageHistory,
    triggerAutoNotification
  }
}