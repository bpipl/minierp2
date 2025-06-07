// WhatsApp Provider Manager
// Unified service layer for managing multiple WhatsApp providers

import { 
  WhatsAppProvider, 
  WhatsAppProviderConfig, 
  WhatsAppProviderInterface, 
  WhatsAppMessage, 
  WhatsAppInteractiveMessage,
  ApprovalWorkflow 
} from '@/types/whatsappProvider'
import { MetaCloudAPIProvider } from './whatsappProviders/MetaCloudAPIProvider'
import { N8NEvolutionProvider } from './whatsappProviders/N8NEvolutionProvider'
import { supabase } from '@/lib/supabase'

export class WhatsAppProviderManager {
  private providers: Map<WhatsAppProvider, WhatsAppProviderInterface> = new Map()
  private config: WhatsAppProviderConfig | null = null

  async initialize(): Promise<void> {
    await this.loadConfiguration()
    await this.initializeProviders()
  }

  async sendMessage(
    to: string, 
    message: string, 
    options: {
      priority?: 'low' | 'medium' | 'high' | 'urgent'
      provider?: WhatsAppProvider
      fallback?: boolean
    } = {}
  ): Promise<WhatsAppMessage> {
    const provider = this.selectProvider(options.priority, options.provider)
    
    try {
      return await provider.sendTextMessage(to, message)
    } catch (error) {
      if (options.fallback !== false) {
        return this.sendWithFallback(to, message, provider)
      }
      throw error
    }
  }

  async sendTemplateMessage(
    to: string, 
    templateName: string, 
    parameters: Record<string, string>,
    options: {
      priority?: 'low' | 'medium' | 'high' | 'urgent'
      provider?: WhatsAppProvider
    } = {}
  ): Promise<WhatsAppMessage> {
    const provider = this.selectProvider(options.priority, options.provider)
    
    try {
      return await provider.sendTemplateMessage(to, templateName, parameters)
    } catch (error) {
      return this.sendWithFallback(to, `Template: ${templateName}`, provider)
    }
  }

  async sendInteractiveMessage(
    to: string, 
    interactive: WhatsAppInteractiveMessage,
    options: {
      provider?: WhatsAppProvider
    } = {}
  ): Promise<WhatsAppMessage> {
    // Interactive messages only work with Meta Cloud API
    const provider = options.provider === 'n8n_evolution_api' 
      ? this.providers.get('n8n_evolution_api')!
      : this.providers.get('meta_cloud_api')!
    
    return await provider.sendInteractiveMessage(to, interactive)
  }

  // Send interactive approval message with buttons
  async sendInteractiveApprovalMessage(data: {
    type: string
    workflowId: string
    title: string
    message: string
    buttons: { id: string; title: string }[]
    recipients: string[]
    priority?: 'low' | 'medium' | 'high' | 'urgent'
  }): Promise<WhatsAppMessage> {
    try {
      // Use Meta Cloud API for interactive buttons
      const provider = this.selectProvider(data.priority || 'high', 'meta_cloud_api')
      
      if (provider instanceof MetaCloudAPIProvider) {
        // Get recipient phone numbers from groups
        const phoneNumbers = await this.getPhoneNumbersFromGroups(data.recipients)
        
        // Send to first recipient (for now - can be enhanced for multiple)
        if (phoneNumbers.length > 0) {
          return provider.sendInteractiveMessage(phoneNumbers[0], {
            type: 'button',
            header: { type: 'text', text: data.title },
            body: { text: data.message },
            action: {
              buttons: data.buttons.map(btn => ({
                type: 'reply',
                reply: { id: `${data.workflowId}:${btn.id}`, title: btn.title }
              }))
            }
          })
        }
      }
      
      // Fallback to text message with N8N
      const fallbackMessage = `${data.title}\n\n${data.message}\n\nReply with:\n${data.buttons.map(btn => `• ${btn.title}`).join('\n')}`
      return this.sendMessage(data.recipients[0] || 'directors', fallbackMessage, { priority: data.priority })
      
    } catch (error) {
      console.error('Failed to send interactive approval message:', error)
      throw error
    }
  }

  async sendApprovalWorkflow(workflow: ApprovalWorkflow): Promise<WhatsAppMessage[]> {
    const messages: WhatsAppMessage[] = []
    
    // Use Meta Cloud API for interactive approval buttons if available
    const provider = this.providers.get('meta_cloud_api') || this.providers.get('n8n_evolution_api')!
    
    for (const approver of workflow.approvers) {
      try {
        let message: WhatsAppMessage
        
        if (provider instanceof MetaCloudAPIProvider) {
          message = await provider.sendApprovalMessage(approver, workflow.type, {
            workflowId: workflow.id,
            orderUid: workflow.orderLineId,
            ...workflow.context
          })
        } else {
          // Fallback to N8N text-based approval
          message = await (provider as N8NEvolutionProvider).sendApprovalMessage(approver, workflow.type, {
            workflowId: workflow.id,
            orderUid: workflow.orderLineId,
            ...workflow.context
          })
        }
        
        messages.push(message)
        
        // Store workflow in database
        await this.storeApprovalWorkflow(workflow)
        
      } catch (error) {
        console.error(`Failed to send approval to ${approver}:`, error)
      }
    }
    
    return messages
  }

  async processApprovalResponse(
    workflowId: string, 
    responderId: string, 
    response: 'approve' | 'reject'
  ): Promise<boolean> {
    try {
      // Get workflow from database
      const { data: workflow, error } = await supabase
        .from('whatsapp_approval_workflows')
        .select('*')
        .eq('id', workflowId)
        .single()

      if (error || !workflow) {
        console.error('Workflow not found:', workflowId)
        return false
      }

      // Check if already responded or expired
      if (workflow.status !== 'pending' || new Date(workflow.expires_at) < new Date()) {
        return false
      }

      // Update workflow with response
      const updatedResponses = [
        ...(workflow.responses || []),
        {
          responderId,
          response,
          timestamp: new Date().toISOString(),
          messageId: crypto.randomUUID()
        }
      ]

      const finalStatus = response === 'approve' ? 'approved' : 'rejected'
      const statusField = response === 'approve' ? 'approved_at' : 'rejected_at'

      await supabase
        .from('whatsapp_approval_workflows')
        .update({
          responses: updatedResponses,
          status: finalStatus,
          [statusField]: new Date().toISOString()
        })
        .eq('id', workflowId)

      // Execute workflow action based on response
      await this.executeWorkflowAction(workflow, response)

      return true
    } catch (error) {
      console.error('Failed to process approval response:', error)
      return false
    }
  }

  async switchProvider(newProvider: WhatsAppProvider): Promise<boolean> {
    try {
      if (!this.config) {
        throw new Error('No configuration loaded')
      }

      this.config.provider = newProvider
      
      // Update configuration in database
      await supabase
        .from('whatsapp_provider_configs')
        .update({
          provider: newProvider,
          updated_at: new Date().toISOString()
        })
        .eq('is_active', true)

      return true
    } catch (error) {
      console.error('Failed to switch provider:', error)
      return false
    }
  }

  async getProviderStatus(): Promise<{
    activeProvider: WhatsAppProvider
    metaApiStatus: boolean
    n8nStatus: boolean
    fallbackAvailable: boolean
  }> {
    const metaProvider = this.providers.get('meta_cloud_api')
    const n8nProvider = this.providers.get('n8n_evolution_api')

    return {
      activeProvider: this.config?.provider || 'n8n_evolution_api',
      metaApiStatus: metaProvider ? await metaProvider.validateConfig() : false,
      n8nStatus: n8nProvider ? await n8nProvider.validateConfig() : false,
      fallbackAvailable: this.config?.fallbackProvider !== undefined
    }
  }

  private selectProvider(
    priority?: 'low' | 'medium' | 'high' | 'urgent', 
    preferredProvider?: WhatsAppProvider
  ): WhatsAppProviderInterface {
    if (preferredProvider) {
      const provider = this.providers.get(preferredProvider)
      if (provider) return provider
    }

    if (!this.config) {
      throw new Error('WhatsApp provider not configured')
    }

    // Cost optimization logic with safe access
    if (this.config.costOptimization?.useMetaForCritical && 
        (priority === 'urgent' || priority === 'high')) {
      const metaProvider = this.providers.get('meta_cloud_api')
      if (metaProvider) return metaProvider
    }

    if (this.config.costOptimization?.useN8NForBulk && 
        (priority === 'low' || priority === 'medium')) {
      const n8nProvider = this.providers.get('n8n_evolution_api')
      if (n8nProvider) return n8nProvider
    }

    // Default to configured provider
    const defaultProvider = this.providers.get(this.config.provider)
    if (defaultProvider) return defaultProvider

    throw new Error('No WhatsApp provider available')
  }

  private async sendWithFallback(
    to: string, 
    message: string, 
    _failedProvider: WhatsAppProviderInterface
  ): Promise<WhatsAppMessage> {
    if (!this.config?.fallbackProvider) {
      throw new Error('No fallback provider configured')
    }

    const fallbackProvider = this.providers.get(this.config.fallbackProvider)
    if (!fallbackProvider) {
      throw new Error('Fallback provider not available')
    }

    console.warn('Primary provider failed, using fallback')
    return await fallbackProvider.sendTextMessage(to, message)
  }

  private async loadConfiguration(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_provider_configs')
        .select('*')
        .eq('is_active', true)
        .single()

      if (error) {
        console.warn('No WhatsApp provider configuration found, using defaults')
        this.config = this.getDefaultConfig()
        return
      }

      const configData = data as WhatsAppProviderConfig
      // Ensure costOptimization exists with defaults
      if (!configData.costOptimization) {
        configData.costOptimization = {
          useMetaForCritical: false,
          useN8NForBulk: true
        }
      }
      this.config = configData
    } catch (error) {
      console.error('Failed to load WhatsApp configuration:', error)
      this.config = this.getDefaultConfig()
    }
  }

  private async initializeProviders(): Promise<void> {
    if (!this.config) return

    // Initialize Meta Cloud API provider if configured
    if (this.config.metaConfig) {
      try {
        const metaProvider = new MetaCloudAPIProvider(this.config.metaConfig)
        this.providers.set('meta_cloud_api', metaProvider)
      } catch (error) {
        console.error('Failed to initialize Meta Cloud API provider:', error)
      }
    }

    // Initialize N8N Evolution provider if configured
    if (this.config.n8nConfig) {
      try {
        const n8nProvider = new N8NEvolutionProvider(this.config.n8nConfig)
        this.providers.set('n8n_evolution_api', n8nProvider)
      } catch (error) {
        console.error('Failed to initialize N8N Evolution provider:', error)
      }
    }
  }

  private getDefaultConfig(): WhatsAppProviderConfig {
    return {
      provider: 'n8n_evolution_api',
      isActive: true,
      fallbackProvider: undefined,
      n8nConfig: {
        webhookUrl: import.meta.env.VITE_N8N_WEBHOOK_URL || '',
      },
      costOptimization: {
        useMetaForCritical: false,
        useN8NForBulk: true
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  private async storeApprovalWorkflow(workflow: ApprovalWorkflow): Promise<void> {
    await supabase
      .from('whatsapp_approval_workflows')
      .insert([{
        id: workflow.id,
        type: workflow.type,
        order_line_id: workflow.orderLineId,
        requested_by: workflow.requestedBy,
        approvers: workflow.approvers,
        context: workflow.context,
        message: workflow.message,
        status: workflow.status,
        expires_at: workflow.expiresAt,
        created_at: workflow.createdAt
      }])
  }

  // Get phone numbers from group names
  private async getPhoneNumbersFromGroups(groupNames: string[]): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_groups')
        .select('members')
        .in('name', groupNames.map(name => name.toLowerCase()))
        .eq('is_active', true)

      if (error) throw error
      
      const phoneNumbers: string[] = []
      data?.forEach(group => {
        if (group.members && Array.isArray(group.members)) {
          phoneNumbers.push(...group.members)
        }
      })
      
      return [...new Set(phoneNumbers)] // Remove duplicates
    } catch (error) {
      console.error('Failed to get phone numbers from groups:', error)
      return []
    }
  }

  private async executeWorkflowAction(workflow: any, response: 'approve' | 'reject'): Promise<void> {
    // Implement workflow-specific actions based on approval/rejection
    switch (workflow.type) {
      case 'ct_duplicate_approval':
        if (response === 'approve') {
          // Allow CT duplicate usage
          console.log('CT duplicate approved for order:', workflow.order_line_id)
        } else {
          // Reject CT assignment, require new CT
          console.log('CT duplicate rejected for order:', workflow.order_line_id)
        }
        break
      
      case 'qc_rejection_approval':
        if (response === 'approve') {
          // Proceed with QC rejection workflow
          console.log('QC rejection approved for order:', workflow.order_line_id)
        }
        break
      
      // Add other workflow types as needed
    }
  }
}