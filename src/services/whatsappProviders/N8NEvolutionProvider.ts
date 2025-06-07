// N8N Evolution API Provider
// Existing implementation enhanced for provider abstraction

import { 
  WhatsAppProviderInterface, 
  WhatsAppMessage, 
  WhatsAppInteractiveMessage, 
  WhatsAppMessageStatus,
  N8NEvolutionAPIConfig 
} from '@/types/whatsappProvider'

export class N8NEvolutionProvider implements WhatsAppProviderInterface {
  private config: N8NEvolutionAPIConfig

  constructor(config: N8NEvolutionAPIConfig) {
    this.config = config
  }

  async sendTextMessage(to: string, message: string): Promise<WhatsAppMessage> {
    try {
      const payload = {
        messageType: 'manual',
        content: message,
        recipients: [to],
        recipientGroups: [],
        triggeredBy: 'system',
        priority: 'medium'
      }

      await this.makeWebhookCall(payload)

      return {
        id: crypto.randomUUID(),
        provider: 'n8n_evolution_api',
        to,
        type: 'text',
        content: message,
        status: 'sent',
        sentAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('N8N Evolution text message failed:', error)
      throw error
    }
  }

  async sendTemplateMessage(to: string, templateName: string, parameters: Record<string, string>): Promise<WhatsAppMessage> {
    try {
      // Process template with parameters (simplified version)
      let processedContent = templateName
      Object.entries(parameters).forEach(([key, value]) => {
        processedContent = processedContent.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
      })

      const payload = {
        messageType: 'template',
        content: processedContent,
        recipients: [to],
        recipientGroups: [],
        templateName,
        templateParameters: parameters,
        triggeredBy: 'system',
        priority: 'medium'
      }

      await this.makeWebhookCall(payload)

      return {
        id: crypto.randomUUID(),
        provider: 'n8n_evolution_api',
        to,
        type: 'template',
        content: processedContent,
        templateName,
        templateParameters: parameters,
        status: 'sent',
        sentAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('N8N Evolution template message failed:', error)
      throw error
    }
  }

  async sendInteractiveMessage(to: string, interactive: WhatsAppInteractiveMessage): Promise<WhatsAppMessage> {
    try {
      // N8N/Evolution API doesn't support interactive messages natively
      // Convert to text with button options
      let textContent = interactive.body.text

      if (interactive.action.buttons) {
        textContent += '\n\nOptions:'
        interactive.action.buttons.forEach((button, index) => {
          textContent += `\n${index + 1}. ${button.reply.title}`
        })
        textContent += '\n\nPlease reply with the number of your choice.'
      }

      return this.sendTextMessage(to, textContent)
    } catch (error) {
      console.error('N8N Evolution interactive message failed:', error)
      throw error
    }
  }

  async getMessageStatus(messageId: string): Promise<WhatsAppMessageStatus> {
    // N8N Evolution doesn't provide status tracking
    // Return default status
    return {
      id: messageId,
      status: 'sent',
      timestamp: new Date().toISOString(),
      recipient_id: ''
    }
  }

  async validateConfig(): Promise<boolean> {
    try {
      // Test webhook with a validation payload
      const testPayload = {
        messageType: 'validation',
        content: 'Configuration validation test',
        recipients: [],
        recipientGroups: [],
        triggeredBy: 'system-validation',
        priority: 'low'
      }

      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.authToken && { 'Authorization': `Bearer ${this.config.authToken}` }),
          ...(this.config.headers || {})
        },
        body: JSON.stringify(testPayload)
      })

      return response.ok
    } catch (error) {
      console.error('N8N Evolution config validation failed:', error)
      return false
    }
  }

  // Send approval message (fallback to text format)
  async sendApprovalMessage(
    to: string, 
    workflowType: string, 
    context: Record<string, any>
  ): Promise<WhatsAppMessage> {
    const messageText = this.getApprovalMessageText(workflowType, context)
    return this.sendTextMessage(to, messageText)
  }

  // Make webhook call to N8N
  private async makeWebhookCall(payload: any): Promise<void> {
    const response = await fetch(this.config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.authToken && { 'Authorization': `Bearer ${this.config.authToken}` }),
        ...(this.config.headers || {})
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`N8N Webhook Error: ${response.status} ${response.statusText}`)
    }
  }

  // Generate approval message text
  private getApprovalMessageText(workflowType: string, context: Record<string, any>): string {
    const baseMessage = this.getWorkflowMessage(workflowType, context)
    return `${baseMessage}\n\n✅ Reply "APPROVE" to approve\n❌ Reply "REJECT" to reject\n\n⏰ This request expires in 30 minutes.`
  }

  private getWorkflowMessage(workflowType: string, context: Record<string, any>): string {
    switch (workflowType) {
      case 'ct_duplicate_approval':
        return `🔍 CT DUPLICATE DETECTED\n\nOrder: ${context.orderUid}\nCT Number: ${context.ctNumber}\nExisting Order: ${context.existingOrder}\n\nDuplicate CT usage requires approval.`
      
      case 'qc_rejection_approval':
        return `⚠️ QC REJECTION ALERT\n\nOrder: ${context.orderUid}\nPart: ${context.partNumber}\nReason: ${context.rejectionReason}\n\nQC rejection requires management approval.`
      
      case 'part_mapping_approval':
        return `🔗 PART MAPPING APPROVAL\n\nCustomer Part: ${context.customerPartNumber}\nOur Description: ${context.bpiDescription}\nOrder: ${context.orderUid}\n\nPart mapping requires approval before processing.`
      
      case 'transfer_authorization':
        return `📦 TRANSFER AUTHORIZATION\n\nOrder: ${context.orderUid}\nQuantity: ${context.quantity}\nFrom: SB Location\nTo: NP Location\n\nTransfer authorization required.`
      
      default:
        return `🔔 APPROVAL REQUIRED\n\nWorkflow: ${workflowType}\nOrder: ${context.orderUid}\n\nPlease review and respond.`
    }
  }
}