// Transfer Authorization Modal
// Modal for requesting transfer authorization with WhatsApp integration

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Truck, MessageSquare, CheckCircle } from 'lucide-react'
import { useApprovalWorkflow } from '@/hooks/useApprovalWorkflow'

interface TransferApprovalModalProps {
  isOpen: boolean
  onClose: () => void
  orderLineId: string
  orderDetails?: {
    uid: string
    customerName: string
    customerPartNumber: string
    availableQuantity: number
  }
  availableCTNumbers: string[]
  onApprovalSent?: (workflowId: string) => void
}

export function TransferApprovalModal({
  isOpen,
  onClose,
  orderLineId,
  orderDetails,
  availableCTNumbers,
  onApprovalSent
}: TransferApprovalModalProps) {
  const [transferQuantity, setTransferQuantity] = useState(1)
  const [destination, setDestination] = useState<'NP' | 'SB'>('NP')
  const [selectedCTs, setSelectedCTs] = useState<string[]>([])
  const [isRequesting, setIsRequesting] = useState(false)
  const [approvalSent, setApprovalSent] = useState(false)
  const { startTransferAuthorization } = useApprovalWorkflow()

  const maxQuantity = orderDetails?.availableQuantity || availableCTNumbers.length

  const handleQuantityChange = (newQuantity: number) => {
    const quantity = Math.min(Math.max(1, newQuantity), maxQuantity)
    setTransferQuantity(quantity)
    
    // Auto-select CT numbers based on quantity
    setSelectedCTs(availableCTNumbers.slice(0, quantity))
  }

  const handleRequestApproval = async () => {
    if (selectedCTs.length !== transferQuantity) {
      alert('Number of selected CT numbers must match transfer quantity')
      return
    }

    setIsRequesting(true)
    try {
      const result = await startTransferAuthorization({
        orderLineId,
        transferQuantity,
        ctNumbers: selectedCTs,
        destination
      })

      if (result.success) {
        setApprovalSent(true)
        onApprovalSent?.(result.workflowId || '')
      } else {
        alert(`Failed to send authorization request: ${result.error}`)
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsRequesting(false)
    }
  }

  const handleClose = () => {
    setApprovalSent(false)
    setTransferQuantity(1)
    setDestination('NP')
    setSelectedCTs([])
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Truck className="h-5 w-5 text-blue-500" />
            <span>Transfer Authorization Request</span>
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
                        <span className="text-gray-600">Available Qty:</span>
                        <Badge variant="secondary">{orderDetails.availableQuantity}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Transfer Configuration */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Transfer Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max={maxQuantity}
                      value={transferQuantity}
                      onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="destination">Destination</Label>
                    <Select
                      value={destination}
                      onValueChange={(value: 'NP' | 'SB') => setDestination(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NP">NP Location</SelectItem>
                        <SelectItem value="SB">SB Location</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* CT Numbers Selection */}
                <div className="space-y-2">
                  <Label>CT Numbers to Transfer</Label>
                  <Card className="p-3">
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        Selected {selectedCTs.length} of {transferQuantity} required:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {availableCTNumbers.map((ct, index) => (
                          <button
                            key={ct}
                            onClick={() => {
                              if (selectedCTs.includes(ct)) {
                                setSelectedCTs(selectedCTs.filter(s => s !== ct))
                              } else if (selectedCTs.length < transferQuantity) {
                                setSelectedCTs([...selectedCTs, ct])
                              }
                            }}
                            className={`text-xs px-2 py-1 rounded border transition-colors ${
                              selectedCTs.includes(ct)
                                ? 'bg-blue-100 border-blue-300 text-blue-800'
                                : index < transferQuantity
                                ? 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                                : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                            disabled={!selectedCTs.includes(ct) && index >= transferQuantity}
                          >
                            {ct}
                          </button>
                        ))}
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Transfer Summary */}
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-4">
                  <div className="text-sm">
                    <div className="font-medium text-blue-800 mb-2">Transfer Summary</div>
                    <div className="space-y-1 text-blue-700">
                      <div>• Transfer {transferQuantity} units to {destination} location</div>
                      <div>• CT Numbers: {selectedCTs.join(', ') || 'None selected'}</div>
                      <div>• Requires authorization from Directors{destination === 'NP' ? ' and NP Staff' : ''}</div>
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
                  disabled={isRequesting || selectedCTs.length !== transferQuantity}
                  className="flex-1"
                >
                  {isRequesting ? (
                    'Sending...'
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Request Authorization
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
                  Transfer Authorization Sent
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  Authorization request has been sent via WhatsApp with interactive approval buttons. 
                  Transfer will be processed once authorized.
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    WhatsApp authorization sent to {destination === 'NP' ? 'Directors & NP Staff' : 'Directors & SB Staff'}
                  </span>
                </div>
                <div className="text-xs text-blue-700">
                  Transfer: {transferQuantity} units to {destination} ({selectedCTs.join(', ')})
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