// WhatsApp Provider Configuration Types
// Dual provider system: Meta Cloud API + N8N/Evolution API

export type WhatsAppProvider = 'meta_cloud_api' | 'n8n_evolution_api'

export interface MetaCloudAPIConfig {
  appId: string
  appSecret: string
  businessAccountId: string
  phoneNumberId: string
  accessToken: string
  webhookVerifyToken: string
  apiVersion: string // e.g., 'v21.0'
}

export interface N8NEvolutionAPIConfig {
  webhookUrl: string
  authToken?: string
  headers?: Record<string, string>
}

export interface WhatsAppProviderConfig {
  provider: WhatsAppProvider
  isActive: boolean
  fallbackProvider?: WhatsAppProvider
  metaConfig?: MetaCloudAPIConfig
  n8nConfig?: N8NEvolutionAPIConfig
  costOptimization: {
    useMetaForCritical: boolean // Use Meta API for urgent/critical messages
    useN8NForBulk: boolean // Use N8N for bulk/non-critical messages
    maxMetaMessagesPerDay?: number
  }
  createdAt: string
  updatedAt: string
}

export interface WhatsAppMessage {
  id: string
  provider: WhatsAppProvider
  to: string
  type: 'text' | 'template' | 'interactive'
  content: string
  templateName?: string
  templateLanguage?: string
  templateParameters?: Record<string, string>
  interactive?: WhatsAppInteractiveMessage
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  messageId?: string // Provider's message ID
  error?: string
  sentAt?: string
  deliveredAt?: string
  readAt?: string
}

export interface WhatsAppInteractiveMessage {
  type: 'button' | 'list'
  header?: {
    type: 'text' | 'image' | 'video' | 'document'
    text?: string
    media?: {
      id: string
      link?: string
    }
  }
  body: {
    text: string
  }
  footer?: {
    text: string
  }
  action: WhatsAppInteractiveAction
}

export interface WhatsAppInteractiveAction {
  buttons?: WhatsAppButton[]
  button?: string // For list messages
  sections?: WhatsAppSection[]
}

export interface WhatsAppButton {
  type: 'reply'
  reply: {
    id: string
    title: string
  }
}

export interface WhatsAppSection {
  title: string
  rows: WhatsAppRow[]
}

export interface WhatsAppRow {
  id: string
  title: string
  description?: string
}

// Webhook payload for button responses
export interface WhatsAppWebhookPayload {
  object: string
  entry: WhatsAppWebhookEntry[]
}

export interface WhatsAppWebhookEntry {
  id: string
  changes: WhatsAppWebhookChange[]
}

export interface WhatsAppWebhookChange {
  value: {
    messaging_product: string
    metadata: {
      display_phone_number: string
      phone_number_id: string
    }
    messages?: WhatsAppIncomingMessage[]
    statuses?: WhatsAppMessageStatus[]
  }
  field: string
}

export interface WhatsAppIncomingMessage {
  from: string
  id: string
  timestamp: string
  type: 'text' | 'interactive'
  text?: {
    body: string
  }
  interactive?: {
    type: 'button_reply' | 'list_reply'
    button_reply?: {
      id: string
      title: string
    }
    list_reply?: {
      id: string
      title: string
      description?: string
    }
  }
}

export interface WhatsAppMessageStatus {
  id: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: string
  recipient_id: string
  errors?: Array<{
    code: number
    title: string
    message: string
  }>
}

// Provider abstraction for unified messaging
export interface WhatsAppProviderInterface {
  sendTextMessage(to: string, message: string): Promise<WhatsAppMessage>
  sendTemplateMessage(to: string, templateName: string, parameters: Record<string, string>): Promise<WhatsAppMessage>
  sendInteractiveMessage(to: string, interactive: WhatsAppInteractiveMessage): Promise<WhatsAppMessage>
  getMessageStatus(messageId: string): Promise<WhatsAppMessageStatus>
  validateConfig(): Promise<boolean>
}

// Approval workflow types
export interface ApprovalWorkflow {
  id: string
  type: 'ct_duplicate_approval' | 'qc_rejection_approval' | 'part_mapping_approval' | 'transfer_authorization'
  orderLineId: string
  requestedBy: string
  approvers: string[] // Phone numbers or user IDs
  context: Record<string, any> // Workflow-specific data
  message: WhatsAppInteractiveMessage
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  responses: ApprovalResponse[]
  expiresAt: string
  createdAt: string
  approvedAt?: string
  rejectedAt?: string
}

export interface ApprovalResponse {
  responderId: string // Phone number
  response: 'approve' | 'reject'
  timestamp: string
  messageId: string
}

// Cost tracking
export interface ProviderCostTracking {
  provider: WhatsAppProvider
  date: string
  messagesSent: number
  cost: number
  currency: string
  messageTypes: {
    text: number
    template: number
    interactive: number
  }
}