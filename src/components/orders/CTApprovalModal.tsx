// CT Number Approval Modal
// Modal for requesting CT duplicate approval with WhatsApp integration

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, MessageSquare, CheckCircle, XCircle } from 'lucide-react'
import { useApprovalWorkflow } from '@/hooks/useApprovalWorkflow'

interface CTApprovalModalProps {
  isOpen: boolean
  onClose: () => void
  orderLineId: string
  ctNumber: string
  existingOrderId: string
  existingOrderDetails?: {
    uid: string
    customerName: string
    customerPartNumber: string
    currentStatus: string
  }
  onApprovalSent?: (workflowId: string) => void
}

export function CTApprovalModal({
  isOpen,
  onClose,
  orderLineId,
  ctNumber,
  existingOrderId,
  existingOrderDetails,
  onApprovalSent
}: CTApprovalModalProps) {
  const [isRequesting, setIsRequesting] = useState(false)
  const [approvalSent, setApprovalSent] = useState(false)
  const { startCTDuplicateApproval } = useApprovalWorkflow()

  const handleRequestApproval = async () => {
    setIsRequesting(true)
    try {
      const result = await startCTDuplicateApproval({
        orderLineId,
        ctNumber,
        existingOrderId
      })

      if (result.success) {
        setApprovalSent(true)
        onApprovalSent?.(result.workflowId || '')
      } else {
        alert(`Failed to send approval request: ${result.error}`)
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsRequesting(false)
    }
  }

  const handleClose = () => {
    setApprovalSent(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <span>CT Number Duplicate Detected</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!approvalSent ? (
            <>
              {/* Duplicate Warning */}
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-orange-800">
                    CT Number Already Exists
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">CT Number:</span>
                      <Badge variant="outline" className="font-mono">
                        {ctNumber}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      This CT number is already assigned to another order. 
                      Director approval is required to proceed with duplicate usage.
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Existing Order Details */}
              {existingOrderDetails && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Existing Order Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order UID:</span>
                        <span className="font-medium">{existingOrderDetails.uid}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Customer:</span>
                        <span className="font-medium">{existingOrderDetails.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Part Number:</span>
                        <span className="font-medium">{existingOrderDetails.customerPartNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <Badge variant="secondary">
                          {existingOrderDetails.currentStatus}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRequestApproval}
                  disabled={isRequesting}
                  className="flex-1"
                >
                  {isRequesting ? (
                    'Sending...'
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Request Approval
                    </>
                  )}
                </Button>
              </div>

              <div className="text-xs text-gray-500 text-center">
                An approval request will be sent to Directors via WhatsApp with interactive buttons for instant approval/rejection.
              </div>
            </>
          ) : (
            /* Approval Sent Confirmation */
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-green-800">
                  Approval Request Sent
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  Directors have been notified via WhatsApp with interactive approval buttons. 
                  You will be notified once the decision is made.
                </p>
              </div>
              <div className="flex items-center justify-center space-x-2 p-3 bg-blue-50 rounded-lg">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  WhatsApp approval request sent to Directors
                </span>
              </div>
              <Button onClick={handleClose} className="w-full">
                <CheckCircle className="h-4 w-4 mr-2" />
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}