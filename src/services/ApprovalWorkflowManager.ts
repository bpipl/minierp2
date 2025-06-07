// Interactive Approval Workflow Manager
// Handles WhatsApp button-based approval workflows with Meta Cloud API

import { supabase } from '@/lib/supabase'
import { WhatsAppProviderManager } from './WhatsAppProviderManager'

export interface ApprovalWorkflow {
  id: string
  type: 'ct_duplicate' | 'qc_rejection' | 'part_mapping' | 'transfer_authorization'
  orderLineId: string
  requestedBy: string
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  data: Record<string, any>
  createdAt: string
  expiresAt: string
}

export interface ApprovalResponse {
  workflowId: string
  action: 'approve' | 'reject'
  approvedBy: string
  timestamp: string
  notes?: string
}

export class ApprovalWorkflowManager {
  private providerManager: WhatsAppProviderManager

  constructor() {
    this.providerManager = new WhatsAppProviderManager()
  }

  // Initialize the manager
  async initialize() {
    await this.providerManager.initialize()
  }

  // Start CT duplicate approval workflow
  async startCTDuplicateApproval(data: {
    orderLineId: string
    ctNumber: string
    existingOrderId: string
    requestedBy: string
  }): Promise<string> {
    try {
      // Create approval workflow record
      const workflowId = await this.createWorkflowRecord({
        type: 'ct_duplicate',
        orderLineId: data.orderLineId,
        requestedBy: data.requestedBy,
        data: {
          ctNumber: data.ctNumber,
          existingOrderId: data.existingOrderId
        }
      })

      // Get order context
      const orderData = await this.getOrderContext(data.orderLineId)
      const existingOrderData = await this.getOrderContext(data.existingOrderId)

      // Send interactive approval message
      await this.providerManager.sendInteractiveApprovalMessage({
        type: 'ct_duplicate',
        workflowId,
        title: '🔄 CT Number Duplicate Approval Required',
        message: `CT Number: ${data.ctNumber}\n\nNew Order: ${orderData?.uid} - ${orderData?.customerPartNumber}\nExisting Order: ${existingOrderData?.uid} - ${existingOrderData?.customerPartNumber}\n\nApprove duplicate CT usage?`,
        buttons: [
          { id: 'approve', title: '✅ Approve Duplicate' },
          { id: 'reject', title: '❌ Reject & Generate New' }
        ],
        recipients: ['directors'],
        priority: 'high'
      })

      return workflowId
    } catch (error) {
      console.error('Failed to start CT duplicate approval:', error)
      throw error
    }
  }

  // Start QC rejection approval workflow
  async startQCRejectionApproval(data: {
    orderLineId: string
    rejectionReason: string
    qcStaffId: string
    ctNumbers: string[]
  }): Promise<string> {
    try {
      const workflowId = await this.createWorkflowRecord({
        type: 'qc_rejection',
        orderLineId: data.orderLineId,
        requestedBy: data.qcStaffId,
        data: {
          rejectionReason: data.rejectionReason,
          ctNumbers: data.ctNumbers
        }
      })

      const orderData = await this.getOrderContext(data.orderLineId)

      await this.providerManager.sendInteractiveApprovalMessage({
        type: 'qc_rejection',
        workflowId,
        title: '🚨 QC Rejection Approval Required',
        message: `Order: ${orderData?.uid} - ${orderData?.customerPartNumber}\nCT Numbers: ${data.ctNumbers.join(', ')}\n\nRejection Reason: ${data.rejectionReason}\n\nApprove QC rejection?`,
        buttons: [
          { id: 'approve', title: '✅ Approve Rejection' },
          { id: 'reject', title: '❌ Return to QC' }
        ],
        recipients: ['directors', 'sbStaff'],
        priority: 'urgent'
      })

      return workflowId
    } catch (error) {
      console.error('Failed to start QC rejection approval:', error)
      throw error
    }
  }

  // Start part mapping approval workflow
  async startPartMappingApproval(data: {
    orderLineId: string
    customerPartNumber: string
    proposedBPIDescription: string
    requestedBy: string
  }): Promise<string> {
    try {
      const workflowId = await this.createWorkflowRecord({
        type: 'part_mapping',
        orderLineId: data.orderLineId,
        requestedBy: data.requestedBy,
        data: {
          customerPartNumber: data.customerPartNumber,
          proposedBPIDescription: data.proposedBPIDescription
        }
      })

      const orderData = await this.getOrderContext(data.orderLineId)

      await this.providerManager.sendInteractiveApprovalMessage({
        type: 'part_mapping',
        workflowId,
        title: '🔍 Part Mapping Approval Required',
        message: `Order: ${orderData?.uid}\nCustomer: ${orderData?.customerName}\n\nCustomer Part: ${data.customerPartNumber}\nProposed BPI DSC: ${data.proposedBPIDescription}\n\nApprove part mapping?`,
        buttons: [
          { id: 'approve', title: '✅ Approve Mapping' },
          { id: 'reject', title: '❌ Request Changes' }
        ],
        recipients: ['directors'],
        priority: 'high'
      })

      return workflowId
    } catch (error) {
      console.error('Failed to start part mapping approval:', error)
      throw error
    }
  }

  // Start transfer authorization workflow
  async startTransferAuthorization(data: {
    orderLineId: string
    transferQuantity: number
    ctNumbers: string[]
    destination: 'NP' | 'SB'
    requestedBy: string
  }): Promise<string> {
    try {
      const workflowId = await this.createWorkflowRecord({
        type: 'transfer_authorization',
        orderLineId: data.orderLineId,
        requestedBy: data.requestedBy,
        data: {
          transferQuantity: data.transferQuantity,
          ctNumbers: data.ctNumbers,
          destination: data.destination
        }
      })

      const orderData = await this.getOrderContext(data.orderLineId)

      await this.providerManager.sendInteractiveApprovalMessage({
        type: 'transfer_authorization',
        workflowId,
        title: `📦 Transfer to ${data.destination} Authorization`,
        message: `Order: ${orderData?.uid} - ${orderData?.customerPartNumber}\nQuantity: ${data.transferQuantity}\nCT Numbers: ${data.ctNumbers.join(', ')}\nDestination: ${data.destination}\n\nAuthorize transfer?`,
        buttons: [
          { id: 'approve', title: '✅ Authorize Transfer' },
          { id: 'reject', title: '❌ Reject Transfer' }
        ],
        recipients: data.destination === 'NP' ? ['directors', 'npStaff'] : ['directors', 'sbStaff'],
        priority: 'medium'
      })

      return workflowId
    } catch (error) {
      console.error('Failed to start transfer authorization:', error)
      throw error
    }
  }

  // Process approval response from WhatsApp button
  async processApprovalResponse(response: ApprovalResponse): Promise<void> {
    try {
      // Update workflow status
      const { error: updateError } = await supabase
        .from('whatsapp_approval_workflows')
        .update({
          status: response.action === 'approve' ? 'approved' : 'rejected',
          approved_by: response.approvedBy,
          approved_at: response.timestamp,
          notes: response.notes
        })
        .eq('id', response.workflowId)

      if (updateError) throw updateError

      // Get workflow details
      const { data: workflow, error: fetchError } = await supabase
        .from('whatsapp_approval_workflows')
        .select('*')
        .eq('id', response.workflowId)
        .single()

      if (fetchError) throw fetchError

      // Execute workflow-specific actions
      await this.executeWorkflowAction(workflow, response.action)

      // Send confirmation message
      await this.sendConfirmationMessage(workflow, response)

    } catch (error) {
      console.error('Failed to process approval response:', error)
      throw error
    }
  }

  // Create workflow record in database
  private async createWorkflowRecord(data: {
    type: string
    orderLineId: string
    requestedBy: string
    data: Record<string, any>
  }): Promise<string> {
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 hour expiry

    const { data: workflow, error } = await supabase
      .from('whatsapp_approval_workflows')
      .insert([{
        type: data.type,
        order_line_id: data.orderLineId,
        requested_by: data.requestedBy,
        status: 'pending',
        data: data.data,
        expires_at: expiresAt.toISOString()
      }])
      .select()
      .single()

    if (error) throw error
    return workflow.id
  }

  // Get order context for approval messages
  private async getOrderContext(orderLineId: string) {
    try {
      const { data, error } = await supabase
        .from('order_lines')
        .select(`
          uid,
          customer_part_number,
          bpi_description,
          order_quantity,
          customers!inner(name)
        `)
        .eq('uid', orderLineId)
        .single()

      if (error) throw error

      return {
        uid: data.uid,
        customerName: (data.customers as any)?.name || 'Unknown',
        customerPartNumber: data.customer_part_number,
        bpiDescription: data.bpi_description || '',
        orderQuantity: data.order_quantity
      }
    } catch (error) {
      console.error('Failed to get order context:', error)
      return null
    }
  }

  // Execute workflow-specific actions based on approval
  private async executeWorkflowAction(workflow: any, action: 'approve' | 'reject'): Promise<void> {
    try {
      switch (workflow.type) {
        case 'ct_duplicate':
          if (action === 'approve') {
            // Allow CT duplicate usage
            await this.allowCTDuplicate(workflow.order_line_id, workflow.data.ctNumber)
          } else {
            // Generate new CT number
            await this.generateNewCTNumber(workflow.order_line_id)
          }
          break

        case 'qc_rejection':
          if (action === 'approve') {
            // Mark as QC rejected
            await this.markQCRejected(workflow.order_line_id, workflow.data.ctNumbers)
          } else {
            // Return to QC
            await this.returnToQC(workflow.order_line_id, workflow.data.ctNumbers)
          }
          break

        case 'part_mapping':
          if (action === 'approve') {
            // Approve part mapping
            await this.approvePartMapping(workflow.order_line_id, workflow.data.proposedBPIDescription)
          } else {
            // Request mapping changes
            await this.requestMappingChanges(workflow.order_line_id)
          }
          break

        case 'transfer_authorization':
          if (action === 'approve') {
            // Execute transfer
            await this.executeTransfer(workflow.order_line_id, workflow.data)
          } else {
            // Cancel transfer
            await this.cancelTransfer(workflow.order_line_id)
          }
          break
      }
    } catch (error) {
      console.error('Failed to execute workflow action:', error)
    }
  }

  // Workflow action implementations (simplified)
  private async allowCTDuplicate(orderLineId: string, ctNumber: string): Promise<void> {
    // Implementation: Allow duplicate CT usage
    console.log(`Allowing CT duplicate: ${ctNumber} for order ${orderLineId}`)
  }

  private async generateNewCTNumber(orderLineId: string): Promise<void> {
    // Implementation: Generate new CT number
    console.log(`Generating new CT number for order ${orderLineId}`)
  }

  private async markQCRejected(orderLineId: string, ctNumbers: string[]): Promise<void> {
    // Implementation: Mark order as QC rejected
    console.log(`Marking QC rejected: ${orderLineId}, CTs: ${ctNumbers.join(', ')}`)
  }

  private async returnToQC(orderLineId: string, ctNumbers: string[]): Promise<void> {
    // Implementation: Return to QC
    console.log(`Returning to QC: ${orderLineId}, CTs: ${ctNumbers.join(', ')}`)
  }

  private async approvePartMapping(orderLineId: string, bpiDescription: string): Promise<void> {
    // Implementation: Approve part mapping
    const { error } = await supabase
      .from('order_lines')
      .update({ bpi_description: bpiDescription })
      .eq('uid', orderLineId)

    if (error) throw error
    console.log(`Part mapping approved for ${orderLineId}: ${bpiDescription}`)
  }

  private async requestMappingChanges(orderLineId: string): Promise<void> {
    // Implementation: Request mapping changes
    console.log(`Requesting mapping changes for order ${orderLineId}`)
  }

  private async executeTransfer(orderLineId: string, transferData: any): Promise<void> {
    // Implementation: Execute transfer
    console.log(`Executing transfer for ${orderLineId}:`, transferData)
  }

  private async cancelTransfer(orderLineId: string): Promise<void> {
    // Implementation: Cancel transfer
    console.log(`Canceling transfer for order ${orderLineId}`)
  }

  // Send confirmation message after approval action
  private async sendConfirmationMessage(workflow: any, response: ApprovalResponse): Promise<void> {
    const action = response.action === 'approve' ? 'approved' : 'rejected'
    const emoji = response.action === 'approve' ? '✅' : '❌'
    
    await this.providerManager.sendTextMessage(
      [response.approvedBy],
      `${emoji} ${workflow.type.replace('_', ' ')} ${action} for order ${workflow.order_line_id}`,
      { priority: 'low' }
    )
  }

  // Clean up expired workflows
  async cleanupExpiredWorkflows(): Promise<void> {
    try {
      const { error } = await supabase
        .from('whatsapp_approval_workflows')
        .update({ status: 'expired' })
        .lt('expires_at', new Date().toISOString())
        .eq('status', 'pending')

      if (error) throw error
      console.log('Expired workflows cleaned up')
    } catch (error) {
      console.error('Failed to cleanup expired workflows:', error)
    }
  }
}