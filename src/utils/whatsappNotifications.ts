// WhatsApp Automated Notifications
// Utility functions for triggering automated WhatsApp notifications

import { supabase } from '@/lib/supabase'
import { MessageType } from '@/types/whatsapp'

export interface NotificationTrigger {
  orderLineId: string
  notificationType: MessageType
  customData?: Record<string, string>
  priority?: 'low' | 'medium' | 'high' | 'urgent'
}

export interface OrderStatusChange {
  orderLineId: string
  previousStatus: string
  newStatus: string
  userId: string
  reason?: string
}

// Trigger WhatsApp notification for status changes
export async function triggerStatusChangeNotification(change: OrderStatusChange): Promise<void> {
  try {
    const { orderLineId, previousStatus, newStatus, userId, reason } = change

    // Determine if this status change requires WhatsApp notification
    const notificationType = getNotificationTypeForStatusChange(previousStatus, newStatus)
    if (!notificationType) {
      console.log('No notification required for status change:', previousStatus, '->', newStatus)
      return
    }

    // Get order data for notification
    const orderData = await getOrderDataForNotification(orderLineId)
    if (!orderData) {
      console.error('Failed to get order data for notification:', orderLineId)
      return
    }

    // Find appropriate template
    const template = await getTemplateForNotificationType(notificationType)
    if (!template) {
      console.warn(`No template found for notification type: ${notificationType}`)
      return
    }

    // Process template with order data and custom data
    const customData = {
      Reason: reason || 'Status updated',
      PreviousStatus: previousStatus,
      NewStatus: newStatus
    }

    const processedContent = processTemplateContent(template.content, orderData, customData)

    // Get recipient groups for this notification type
    const recipientGroups = getRecipientGroupsForNotification(notificationType, orderData)

    // Create webhook payload
    const webhookPayload = {
      messageType: notificationType,
      content: processedContent,
      recipients: [],
      recipientGroups,
      orderData,
      templateId: template.id,
      triggeredBy: userId,
      priority: getNotificationPriority(notificationType)
    }

    // Send to N8N webhook
    await sendToWebhook(webhookPayload)

    // Log the notification in database
    await logNotificationToDatabase({
      templateId: template.id,
      content: processedContent,
      recipients: [],
      recipientGroups,
      orderLineId,
      triggeredBy: userId,
      messageType: notificationType,
      status: 'sent',
      priority: getNotificationPriority(notificationType)
    })

    console.log('✅ WhatsApp notification sent for status change:', orderLineId, notificationType)

  } catch (error) {
    console.error('Failed to trigger WhatsApp notification:', error)
  }
}

// Trigger QC rejection notification (high priority)
export async function triggerQCRejectionNotification(
  orderLineId: string, 
  rejectionReason: string, 
  userId: string
): Promise<void> {
  await triggerStatusChangeNotification({
    orderLineId,
    previousStatus: 'In Screening QC',
    newStatus: 'QC Rejected',
    userId,
    reason: rejectionReason
  })
}

// Trigger part mapping approval request
export async function triggerPartMappingApprovalRequest(
  orderLineId: string,
  userId: string
): Promise<void> {
  await triggerStatusChangeNotification({
    orderLineId,
    previousStatus: 'Pending Approval',
    newStatus: 'Awaiting Part Mapping Approval',
    userId,
    reason: 'Part mapping requires approval'
  })
}

// Trigger transfer to NP notification
export async function triggerTransferToNPNotification(
  orderLineId: string,
  transferQuantity: number,
  ctNumbers: string[],
  userId: string
): Promise<void> {
  await triggerStatusChangeNotification({
    orderLineId,
    previousStatus: 'SB Processing',
    newStatus: 'Transferred to NP',
    userId,
    reason: `Transferred ${transferQuantity} units (CT: ${ctNumbers.join(', ')})`
  })
}

// Trigger new device login security alert
export async function triggerNewDeviceLoginAlert(
  userEmail: string,
  deviceInfo: {
    browser: string
    os: string
    ipLocation: string
  }
): Promise<void> {
  try {
    // Find security alert template
    const template = await getTemplateForNotificationType('security_alert')
    if (!template) {
      console.warn('No security alert template found')
      return
    }

    // Process template with device info
    const customData = {
      UserName: userEmail.split('@')[0],
      DateTime: new Date().toLocaleString(),
      Browser: deviceInfo.browser,
      OS: deviceInfo.os,
      IPLocation: deviceInfo.ipLocation
    }

    const processedContent = processTemplateContent(template.content, undefined, customData)

    // Send to directors group only
    const webhookPayload = {
      messageType: 'security_alert' as MessageType,
      content: processedContent,
      recipients: [],
      recipientGroups: ['directors'],
      templateId: template.id,
      triggeredBy: 'system',
      priority: 'urgent' as const
    }

    await sendToWebhook(webhookPayload)

    console.log('✅ Security alert sent for new device login:', userEmail)

  } catch (error) {
    console.error('Failed to send security alert:', error)
  }
}

// Determine notification type based on status change
function getNotificationTypeForStatusChange(previousStatus: string, newStatus: string): MessageType | null {
  // QC Rejection notifications
  if (newStatus.toLowerCase().includes('rejected') || newStatus.toLowerCase().includes('qc rejected')) {
    return 'qc_rejection'
  }

  // Transfer notifications
  if (newStatus.toLowerCase().includes('transferred to np') || newStatus.toLowerCase().includes('transfer')) {
    return 'transfer_notification'
  }

  // Part mapping approval requests
  if (newStatus.toLowerCase().includes('awaiting approval') || newStatus.toLowerCase().includes('part mapping')) {
    return 'part_mapping_approval'
  }

  // ETA updates
  if (previousStatus.includes('ETA') || newStatus.includes('ETA')) {
    return 'eta_update'
  }

  // Procurement requests
  if (newStatus.toLowerCase().includes('procurement') || newStatus.toLowerCase().includes('pull from stock')) {
    return 'procurement_request'
  }

  return null
}

// Get order data for notification
async function getOrderDataForNotification(orderLineId: string) {
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
        ct_numbers(ct_number)
      `)
      .eq('uid', orderLineId)
      .single()

    if (error) throw error

    return {
      uid: data.uid,
      customerName: (data.customers as any)?.name || 'Unknown Customer',
      customerPartNumber: data.customer_part_number,
      bpiDescription: data.bpi_description || '',
      orderQuantity: data.order_quantity,
      currentStatus: 'Processing', // This would be determined by status logic
      ctNumbers: data.ct_numbers?.map(ct => ct.ct_number) || [],
      poNumber: data.po_number || undefined,
      eta: data.current_eta || undefined
    }
  } catch (error) {
    console.error('Failed to get order data:', error)
    return null
  }
}

// Get template for notification type
async function getTemplateForNotificationType(notificationType: MessageType) {
  try {
    const categoryMap: Record<string, string> = {
      qc_rejection: 'qc_alerts',
      part_mapping_approval: 'approvals',
      transfer_notification: 'transfers',
      security_alert: 'security',
      eta_update: 'general',
      procurement_request: 'procurement',
      manual: 'general'
    }

    const category = categoryMap[notificationType]
    if (!category) return null

    const { data, error } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .limit(1)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Failed to get template:', error)
    return null
  }
}

// Process template content with data
function processTemplateContent(
  template: string, 
  orderData?: any, 
  customData?: Record<string, string>
): string {
  let processed = template

  // Order data placeholders
  if (orderData) {
    processed = processed
      .replace(/\{\{UID\}\}/g, orderData.uid || '')
      .replace(/\{\{CustomerName\}\}/g, orderData.customerName || '')
      .replace(/\{\{CustomerPartNumber\}\}/g, orderData.customerPartNumber || '')
      .replace(/\{\{BPIDescription\}\}/g, orderData.bpiDescription || '')
      .replace(/\{\{OrderQuantity\}\}/g, orderData.orderQuantity?.toString() || '')
      .replace(/\{\{CurrentStatus\}\}/g, orderData.currentStatus || '')
      .replace(/\{\{CTNumbers\}\}/g, orderData.ctNumbers?.join(', ') || 'Not assigned')
      .replace(/\{\{PONumber\}\}/g, orderData.poNumber || 'Not set')
      .replace(/\{\{ETA\}\}/g, orderData.eta || 'Not set')
  }

  // System placeholders
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

// Get recipient groups for notification type
function getRecipientGroupsForNotification(notificationType: MessageType, _orderData?: any): string[] {
  switch (notificationType) {
    case 'qc_rejection':
      return ['directors', 'sbStaff'] // High priority - notify management and SB staff
    case 'part_mapping_approval':
      return ['directors'] // Directors only for approvals
    case 'transfer_notification':
      return ['npStaff', 'directors'] // NP staff and directors
    case 'security_alert':
      return ['directors'] // Directors only for security
    case 'eta_update':
      return ['directors', 'procurement'] // Directors and procurement team
    case 'procurement_request':
      return ['procurement', 'sbStaff'] // Procurement team and SB staff
    default:
      return ['directors'] // Default to directors
  }
}

// Get notification priority
function getNotificationPriority(notificationType: MessageType): 'low' | 'medium' | 'high' | 'urgent' {
  switch (notificationType) {
    case 'qc_rejection':
    case 'security_alert':
      return 'urgent'
    case 'part_mapping_approval':
    case 'transfer_notification':
      return 'high'
    case 'eta_update':
    case 'procurement_request':
      return 'medium'
    default:
      return 'medium'
  }
}

// Send to N8N webhook
async function sendToWebhook(payload: any): Promise<void> {
  try {
    // Get webhook URL from environment or database
    let webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL

    // Try to get specific webhook for message type
    if (!webhookUrl) {
      const { data, error } = await supabase
        .from('whatsapp_webhook_configs')
        .select('url')
        .eq('message_type', payload.messageType)
        .eq('is_active', true)
        .single()

      if (!error && data) {
        webhookUrl = data.url
      }
    }

    if (!webhookUrl) {
      console.warn('No webhook URL configured for WhatsApp notifications')
      return
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

    console.log('✅ Webhook sent successfully:', payload.messageType)

  } catch (error) {
    console.error('Failed to send webhook:', error)
    throw error
  }
}

// Log notification to database
async function logNotificationToDatabase(messageData: any): Promise<void> {
  try {
    const { error } = await supabase
      .from('whatsapp_messages')
      .insert([{
        ...messageData,
        sent_at: new Date().toISOString()
      }])

    if (error) throw error
  } catch (error) {
    console.error('Failed to log notification to database:', error)
  }
}