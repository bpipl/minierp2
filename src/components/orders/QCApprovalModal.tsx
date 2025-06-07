// QC Rejection Approval Modal
// Modal for requesting QC rejection approval with WhatsApp integration

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, MessageSquare, CheckCircle } from 'lucide-react'
import { useApprovalWorkflow } from '@/hooks/useApprovalWorkflow'

interface QCApprovalModalProps {
  isOpen: boolean
  onClose: () => void
  orderLineId: string
  orderDetails?: {
    uid: string
    customerName: string
    customerPartNumber: string
    bpiDescription: string
  }
  ctNumbers: string[]
  onApprovalSent?: (workflowId: string) => void
}

export function QCApprovalModal({
  isOpen,
  onClose,
  orderLineId,
  orderDetails,
  ctNumbers,
  onApprovalSent
}: QCApprovalModalProps) {
  const [rejectionReason, setRejectionReason] = useState('')
  const [isRequesting, setIsRequesting] = useState(false)
  const [approvalSent, setApprovalSent] = useState(false)
  const { startQCRejectionApproval } = useApprovalWorkflow()

  const handleRequestApproval = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }

    setIsRequesting(true)
    try {
      const result = await startQCRejectionApproval({
        orderLineId,
        rejectionReason: rejectionReason.trim(),
        ctNumbers
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
    setRejectionReason('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span>QC Rejection Approval</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!approvalSent ? (
            <>
              {/* Order Details */}
              {orderDetails && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Order Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order UID:</span>
                        <span className="font-medium">{orderDetails.uid}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Customer:</span>
                        <span className="font-medium">{orderDetails.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Part Number:</span>
                        <span className="font-medium">{orderDetails.customerPartNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Description:</span>
                        <span className="font-medium">{orderDetails.bpiDescription}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* CT Numbers */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">CT Numbers to Reject</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {ctNumbers.map((ct, index) => (
                      <Badge key={index} variant="outline" className="font-mono">
                        {ct}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Rejection Reason */}
              <div className="space-y-2">
                <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                <Input
                  id="rejectionReason"
                  placeholder="Enter reason for QC rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="h-20"
                />
                <div className="text-xs text-gray-500">
                  This reason will be included in the approval request to Directors.
                </div>
              </div>

              {/* Warning */}
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="text-sm text-red-800">
                      <div className="font-medium">Director Approval Required</div>
                      <div className="mt-1">
                        QC rejections require management approval. An interactive approval request 
                        will be sent to Directors via WhatsApp.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                  disabled={isRequesting || !rejectionReason.trim()}
                  className="flex-1"
                  variant="destructive"
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
            </>
          ) : (
            /* Approval Sent Confirmation */
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-green-800">
                  QC Rejection Approval Sent
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  Directors have been notified via WhatsApp with interactive approval buttons. 
                  The rejection will be processed once approved.
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    WhatsApp approval sent to Directors & SB Staff
                  </span>
                </div>
                <div className="text-xs text-blue-700">
                  Reason: {rejectionReason}
                </div>
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