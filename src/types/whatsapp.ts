// WhatsApp Integration Types
// Core types for WhatsApp messaging, templates, and N8N webhook integration

export interface WhatsAppTemplate {
  id: string
  name: string
  category: TemplateCategory
  content: string
  placeholders: string[]
  isActive: boolean
  isDefault: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface WhatsAppMessage {
  id: string
  templateId?: string
  content: string
  recipients: string[]
  recipientGroups: string[]
  orderLineId?: string
  triggeredBy: string
  messageType: MessageType
  status: MessageStatus
  deliveryStatus?: DeliveryStatus
  sentAt: string
  deliveredAt?: string
  errorMessage?: string
}

export interface WhatsAppGroup {
  id: string
  name: string
  description: string
  members: string[]
  permissions: string[]
  isActive: boolean
  createdAt: string
}

export interface WhatsAppUser {
  id: string
  name: string
  phoneNumber: string
  groups: string[]
  isActive: boolean
  role: string
}

export interface N8NWebhookConfig {
  id: string
  name: string
  url: string
  messageType: MessageType
  isActive: boolean
  authToken?: string
  headers?: Record<string, string>
}

export interface WhatsAppWebhookPayload {
  messageType: MessageType
  content: string
  recipients: string[]
  recipientGroups: string[]
  orderData?: OrderLineData
  templateId?: string
  triggeredBy: string
  priority: MessagePriority
}

export interface OrderLineData {
  uid: string
  customerName: string
  customerPartNumber: string
  bpiDescription: string
  orderQuantity: number
  currentStatus: string
  ctNumbers?: string[]
  poNumber?: string
  eta?: string
}

export type TemplateCategory = 
  | 'qc_alerts'
  | 'procurement' 
  | 'transfers'
  | 'approvals'
  | 'security'
  | 'general'

export type MessageType = 
  | 'manual'
  | 'qc_rejection'
  | 'part_mapping_approval'
  | 'transfer_notification'
  | 'security_alert'
  | 'eta_update'
  | 'procurement_request'

export type MessageStatus = 
  | 'pending'
  | 'sending'
  | 'sent'
  | 'failed'
  | 'cancelled'

export type DeliveryStatus = 
  | 'delivered'
  | 'read'
  | 'failed'
  | 'pending'

export type MessagePriority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent'

export interface WhatsAppSettings {
  isEnabled: boolean
  n8nWebhookConfigs: N8NWebhookConfig[]
  evolutionApiConfig?: {
    baseUrl: string
    instanceId: string
    token: string
  }
  defaultGroups: {
    directors: string
    sbStaff: string
    npStaff: string
    procurement: string
  }
  messageDefaults: {
    retryAttempts: number
    retryDelay: number
    enableFallback: boolean
  }
}

// Template placeholder definitions
export const TEMPLATE_PLACEHOLDERS = {
  '{{UID}}': 'Order UID (e.g., A001)',
  '{{CustomerName}}': 'Customer name',
  '{{CustomerPartNumber}}': 'Customer part number',
  '{{BPIDescription}}': 'Internal part description',
  '{{OrderQuantity}}': 'Order quantity',
  '{{CurrentStatus}}': 'Current order status',
  '{{CTNumbers}}': 'Assigned CT numbers',
  '{{PONumber}}': 'Purchase order number',
  '{{ETA}}': 'Current ETA',
  '{{UserName}}': 'Current user name',
  '{{DateTime}}': 'Current date and time',
  '{{Reason}}': 'Custom reason/notes'
} as const

// Default template content
export const DEFAULT_TEMPLATES: Omit<WhatsAppTemplate, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'QC Rejection Alert',
    category: 'qc_alerts',
    content: '🚨 QC REJECTION ALERT\n\nOrder: {{UID}}\nPart: {{CustomerPartNumber}}\nCT: {{CTNumbers}}\nReason: {{Reason}}\n\nImmediate attention required.',
    placeholders: ['{{UID}}', '{{CustomerPartNumber}}', '{{CTNumbers}}', '{{Reason}}'],
    isActive: true,
    isDefault: true
  },
  {
    name: 'Pull Part from Stock',
    category: 'procurement',
    content: '📦 STOCK PULL REQUEST\n\nOrder: {{UID}}\nPart: {{CustomerPartNumber}}\nDescription: {{BPIDescription}}\nQuantity: {{OrderQuantity}}\n\nPlease pull from stock and update system.',
    placeholders: ['{{UID}}', '{{CustomerPartNumber}}', '{{BPIDescription}}', '{{OrderQuantity}}'],
    isActive: true,
    isDefault: true
  },
  {
    name: 'Transfer to NP',
    category: 'transfers',
    content: '🔄 TRANSFER TO NP\n\nOrder: {{UID}}\nPart: {{CustomerPartNumber}}\nQuantity: {{OrderQuantity}}\nCT Numbers: {{CTNumbers}}\n\nReady for NP processing.',
    placeholders: ['{{UID}}', '{{CustomerPartNumber}}', '{{OrderQuantity}}', '{{CTNumbers}}'],
    isActive: true,
    isDefault: true
  },
  {
    name: 'Part Mapping Approval',
    category: 'approvals',
    content: '✅ APPROVE PART MAPPING\n\nCustomer Part: {{CustomerPartNumber}}\nOur Description: {{BPIDescription}}\nOrder: {{UID}}\nQuantity: {{OrderQuantity}}\n\nPlease confirm mapping is correct.',
    placeholders: ['{{CustomerPartNumber}}', '{{BPIDescription}}', '{{UID}}', '{{OrderQuantity}}'],
    isActive: true,
    isDefault: true
  },
  {
    name: 'New Device Login Alert',
    category: 'security',
    content: '🔐 SECURITY ALERT\n\nUser: {{UserName}}\nNew device login detected\nTime: {{DateTime}}\n\nIf this was not authorized, please investigate immediately.',
    placeholders: ['{{UserName}}', '{{DateTime}}'],
    isActive: true,
    isDefault: true
  }
]