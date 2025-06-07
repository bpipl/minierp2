// Meta WhatsApp Cloud API Provider
// Official WhatsApp Business API integration

import { 
  WhatsAppProviderInterface, 
  WhatsAppMessage, 
  WhatsAppInteractiveMessage, 
  WhatsAppMessageStatus,
  MetaCloudAPIConfig 
} from '@/types/whatsappProvider'

export class MetaCloudAPIProvider implements WhatsAppProviderInterface {
  private config: MetaCloudAPIConfig
  private baseUrl: string

  constructor(config: MetaCloudAPIConfig) {
    this.config = config
    this.baseUrl = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`
  }

  async sendTextMessage(to: string, message: string): Promise<WhatsAppMessage> {
    try {
      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: this.formatPhoneNumber(to),
        type: "text",
        text: {
          body: message
        }
      }

      const response = await this.makeAPICall(payload)
      
      return {
        id: crypto.randomUUID(),
        provider: 'meta_cloud_api',
        to,
        type: 'text',
        content: message,
        status: 'sent',
        messageId: response.messages[0].id,
        sentAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Meta API text message failed:', error)
      throw error
    }
  }

  async sendTemplateMessage(to: string, templateName: string, parameters: Record<string, string>): Promise<WhatsAppMessage> {
    try {
      // Convert parameters to Meta template format
      const templateParameters = Object.values(parameters).map(value => ({
        type: "text",
        text: value
      }))

      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: this.formatPhoneNumber(to),
        type: "template",
        template: {
          name: templateName,
          language: {
            code: "en" // TODO: Make configurable
          },
          components: [
            {
              type: "body",
              parameters: templateParameters
            }
          ]
        }
      }

      const response = await this.makeAPICall(payload)

      return {
        id: crypto.randomUUID(),
        provider: 'meta_cloud_api',
        to,
        type: 'template',
        content: `Template: ${templateName}`,
        templateName,
        templateParameters: parameters,
        status: 'sent',
        messageId: response.messages[0].id,
        sentAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Meta API template message failed:', error)
      throw error
    }
  }

  async sendInteractiveMessage(to: string, interactive: WhatsAppInteractiveMessage): Promise<WhatsAppMessage> {
    try {
      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: this.formatPhoneNumber(to),
        type: "interactive",
        interactive: this.formatInteractiveMessage(interactive)
      }

      const response = await this.makeAPICall(payload)

      return {
        id: crypto.randomUUID(),
        provider: 'meta_cloud_api',
        to,
        type: 'interactive',
        content: interactive.body.text,
        interactive,
        status: 'sent',
        messageId: response.messages[0].id,
        sentAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Meta API interactive message failed:', error)
      throw error
    }
  }

  async getMessageStatus(messageId: string): Promise<WhatsAppMessageStatus> {
    try {
      // Meta API doesn't have a direct status endpoint, status comes via webhooks
      // This is a placeholder implementation
      return {
        id: messageId,
        status: 'sent',
        timestamp: new Date().toISOString(),
        recipient_id: ''
      }
    } catch (error) {
      console.error('Meta API status check failed:', error)
      throw error
    }
  }

  async validateConfig(): Promise<boolean> {
    try {
      // Test the configuration by making a simple API call
      const testUrl = `https://graph.facebook.com/${this.config.apiVersion}/${this.config.phoneNumberId}`
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      return response.ok
    } catch (error) {
      console.error('Meta API config validation failed:', error)
      return false
    }
  }

  // Create approval workflow with interactive buttons
  async sendApprovalMessage(
    to: string, 
    workflowType: string, 
    context: Record<string, any>
  ): Promise<WhatsAppMessage> {
    const interactive: WhatsAppInteractiveMessage = {
      type: 'button',
      header: {
        type: 'text',
        text: '🔔 Approval Required'
      },
      body: {
        text: this.getApprovalMessageText(workflowType, context)
      },
      footer: {
        text: 'Mini-ERP Order Management System'
      },
      action: {
        buttons: [
          {
            type: 'reply',
            reply: {
              id: `approve_${context.workflowId}`,
              title: '✅ Approve'
            }
          },
          {
            type: 'reply',
            reply: {
              id: `reject_${context.workflowId}`,
              title: '❌ Reject'
            }
          }
        ]
      }
    }

    return this.sendInteractiveMessage(to, interactive)
  }

  // Format phone number for Meta API (must include country code)
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '')
    
    // If doesn't start with country code, assume India (+91)
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
      return `91${cleaned}`
    }
    
    return cleaned
  }

  // Format interactive message for Meta API
  private formatInteractiveMessage(interactive: WhatsAppInteractiveMessage): any {
    const formatted: any = {
      type: interactive.type,
      body: interactive.body
    }

    if (interactive.header) {
      formatted.header = interactive.header
    }

    if (interactive.footer) {
      formatted.footer = interactive.footer
    }

    if (interactive.type === 'button' && interactive.action.buttons) {
      formatted.action = {
        buttons: interactive.action.buttons
      }
    } else if (interactive.type === 'list' && interactive.action.sections) {
      formatted.action = {
        button: interactive.action.button || 'Select Option',
        sections: interactive.action.sections
      }
    }

    return formatted
  }

  // Make API call to Meta WhatsApp Cloud API
  private async makeAPICall(payload: any): Promise<any> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Meta API Error: ${error.error?.message || response.statusText}`)
    }

    return response.json()
  }

  // Generate approval message text based on workflow type
  private getApprovalMessageText(workflowType: string, context: Record<string, any>): string {
    switch (workflowType) {
      case 'ct_duplicate_approval':
        return `🔍 CT Duplicate Detected\n\nOrder: ${context.orderUid}\nCT Number: ${context.ctNumber}\nExisting Order: ${context.existingOrder}\n\nApprove duplicate usage?`
      
      case 'qc_rejection_approval':
        return `⚠️ QC Rejection Alert\n\nOrder: ${context.orderUid}\nPart: ${context.partNumber}\nReason: ${context.rejectionReason}\n\nApprove rejection and notify relevant teams?`
      
      case 'part_mapping_approval':
        return `🔗 Part Mapping Approval\n\nCustomer Part: ${context.customerPartNumber}\nOur Description: ${context.bpiDescription}\nOrder: ${context.orderUid}\n\nApprove this part mapping?`
      
      case 'transfer_authorization':
        return `📦 Transfer Authorization\n\nOrder: ${context.orderUid}\nQuantity: ${context.quantity}\nFrom: SB Location\nTo: NP Location\n\nAuthorize this transfer?`
      
      default:
        return `Approval required for ${workflowType}\n\nOrder: ${context.orderUid}\n\nPlease review and respond.`
    }
  }
}