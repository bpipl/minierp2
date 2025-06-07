// Approval Workflow Hook
// React hook for managing WhatsApp interactive approval workflows

import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'
import { ApprovalWorkflowManager } from '@/services/ApprovalWorkflowManager'

export function useApprovalWorkflow() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [manager] = useState(() => new ApprovalWorkflowManager())
  const { user } = useAuth()

  // Initialize manager
  const initialize = useCallback(async () => {
    await manager.initialize()
  }, [manager])

  // Start CT duplicate approval
  const startCTDuplicateApproval = useCallback(async (data: {
    orderLineId: string
    ctNumber: string
    existingOrderId: string
  }) => {
    if (!user?.id) throw new Error('User not authenticated')
    
    setIsProcessing(true)
    try {
      const workflowId = await manager.startCTDuplicateApproval({
        ...data,
        requestedBy: user.id
      })
      return { success: true, workflowId }
    } catch (error) {
      console.error('Failed to start CT duplicate approval:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    } finally {
      setIsProcessing(false)
    }
  }, [manager, user])

  // Start QC rejection approval
  const startQCRejectionApproval = useCallback(async (data: {
    orderLineId: string
    rejectionReason: string
    ctNumbers: string[]
  }) => {
    if (!user?.id) throw new Error('User not authenticated')
    
    setIsProcessing(true)
    try {
      const workflowId = await manager.startQCRejectionApproval({
        ...data,
        qcStaffId: user.id
      })
      return { success: true, workflowId }
    } catch (error) {
      console.error('Failed to start QC rejection approval:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    } finally {
      setIsProcessing(false)
    }
  }, [manager, user])

  // Start part mapping approval
  const startPartMappingApproval = useCallback(async (data: {
    orderLineId: string
    customerPartNumber: string
    proposedBPIDescription: string
  }) => {
    if (!user?.id) throw new Error('User not authenticated')
    
    setIsProcessing(true)
    try {
      const workflowId = await manager.startPartMappingApproval({
        ...data,
        requestedBy: user.id
      })
      return { success: true, workflowId }
    } catch (error) {
      console.error('Failed to start part mapping approval:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    } finally {
      setIsProcessing(false)
    }
  }, [manager, user])

  // Start transfer authorization
  const startTransferAuthorization = useCallback(async (data: {
    orderLineId: string
    transferQuantity: number
    ctNumbers: string[]
    destination: 'NP' | 'SB'
  }) => {
    if (!user?.id) throw new Error('User not authenticated')
    
    setIsProcessing(true)
    try {
      const workflowId = await manager.startTransferAuthorization({
        ...data,
        requestedBy: user.id
      })
      return { success: true, workflowId }
    } catch (error) {
      console.error('Failed to start transfer authorization:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    } finally {
      setIsProcessing(false)
    }
  }, [manager, user])

  // Process approval response (for webhook handling)
  const processApprovalResponse = useCallback(async (response: {
    workflowId: string
    action: 'approve' | 'reject'
    approvedBy: string
    timestamp?: string
    notes?: string
  }) => {
    setIsProcessing(true)
    try {
      await manager.processApprovalResponse({
        ...response,
        timestamp: response.timestamp || new Date().toISOString()
      })
      return { success: true }
    } catch (error) {
      console.error('Failed to process approval response:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    } finally {
      setIsProcessing(false)
    }
  }, [manager])

  // Clean up expired workflows
  const cleanupExpiredWorkflows = useCallback(async () => {
    try {
      await manager.cleanupExpiredWorkflows()
      return { success: true }
    } catch (error) {
      console.error('Failed to cleanup expired workflows:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }, [manager])

  return {
    isProcessing,
    initialize,
    startCTDuplicateApproval,
    startQCRejectionApproval,
    startPartMappingApproval,
    startTransferAuthorization,
    processApprovalResponse,
    cleanupExpiredWorkflows
  }
}