import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Printer, FileText, Edit3, Zap, Download } from 'lucide-react'
import { toast } from 'sonner'
import { useLabelPrinting } from '@/hooks/useLabelPrinting'
import { OrderLineWithDetails } from '@/hooks/useOrders'
import { QUICK_PRINT_TEMPLATES } from '@/types/labelDesigner'

interface LabelPrintModalProps {
  isOpen: boolean
  onClose: () => void
  order: OrderLineWithDetails | null
}

export function LabelPrintModal({ isOpen, onClose, order }: LabelPrintModalProps) {
  const navigate = useNavigate()
  const { templates, printers, printLabel, isLoading } = useLabelPrinting()
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [selectedPrinter, setSelectedPrinter] = useState<string>('')
  const [quantity, setQuantity] = useState('1')
  const [printMode, setPrintMode] = useState<'template' | 'quick'>('template')

  // Auto-select default printer if available
  useEffect(() => {
    const defaultPrinter = printers.find(p => p.is_default)
    if (defaultPrinter) {
      setSelectedPrinter(defaultPrinter.id)
    }
  }, [printers])

  // Filter templates based on category
  const relevantTemplates = templates.filter(t => {
    if (order?.ct_numbers?.length) {
      return t.category === 'ct_label' || t.category === 'generic'
    }
    return t.category !== 'ct_label'
  })

  const handlePrint = async () => {
    if (!order) return

    if (printMode === 'template' && !selectedTemplate) {
      toast.error('Please select a label template')
      return
    }

    if (!selectedPrinter) {
      toast.error('Please select a printer')
      return
    }

    const qty = parseInt(quantity)
    if (isNaN(qty) || qty < 1) {
      toast.error('Please enter a valid quantity')
      return
    }

    try {
      // Prepare dynamic data from order
      const dynamicData = {
        order_uid: order.uid,
        customer_part_number: order.customer_part_number,
        bpi_description: order.bpi_description || '',
        total_quantity: order.total_order_quantity?.toString() || '0',
        ct_number: order.ct_numbers?.[0] || '',
        po_number: order.po_number || '',
        order_date: order.po_date || '',
        eta_date: order.current_eta || '',
        customer_name: order.customer?.name || '',
        customer_description: order.customer_description || '',
        print_date: new Date().toLocaleDateString('en-GB'),
        print_time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        location: 'SB', // Would come from user context
      }

      await printLabel(selectedTemplate, selectedPrinter, dynamicData, qty)
      onClose()
    } catch (error) {
      console.error('Print error:', error)
    }
  }

  const handleDesignNew = () => {
    onClose()
    navigate('/label-designer', {
      state: {
        orderData: order ? {
          uid: order.uid,
          customer_part_number: order.customer_part_number,
          total_quantity: order.total_order_quantity,
          customer_name: order.customer?.name,
        } : null
      }
    })
  }

  if (!order) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Print Label - {order.uid}</DialogTitle>
          <DialogDescription>
            Select a label template or create a new one
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Print Mode Selection */}
          <div className="flex gap-2">
            <Button
              variant={printMode === 'template' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPrintMode('template')}
            >
              <FileText className="h-4 w-4 mr-1" />
              From Template
            </Button>
            <Button
              variant={printMode === 'quick' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPrintMode('quick')}
            >
              <Zap className="h-4 w-4 mr-1" />
              Quick Print
            </Button>
          </div>

          {printMode === 'template' ? (
            <>
              {/* Template Selection */}
              <div className="space-y-2">
                <Label>Select Template</Label>
                {relevantTemplates.length > 0 ? (
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a label template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {relevantTemplates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          <div>
                            <div className="font-medium">{template.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {template.category} • {template.label_size.width}x{template.label_size.height} {template.label_size.unit}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        No templates available for this order type
                      </p>
                      <Button size="sm" variant="outline" onClick={handleDesignNew}>
                        <Edit3 className="h-4 w-4 mr-1" />
                        Create Template
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Quick Print Templates */}
              <div className="space-y-2">
                <Label>Quick Print Labels</Label>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_PRINT_TEMPLATES.map(quick => (
                    <Card
                      key={quick.id}
                      className={cn(
                        'cursor-pointer transition-colors',
                        selectedTemplate === quick.id ? 'border-primary' : 'hover:border-gray-300'
                      )}
                      onClick={() => setSelectedTemplate(quick.id)}
                    >
                      <CardHeader className="p-2">
                        <CardTitle className="text-xs">{quick.name}</CardTitle>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Printer Selection */}
          <div className="space-y-2">
            <Label>Select Printer</Label>
            <Select value={selectedPrinter} onValueChange={setSelectedPrinter}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a printer..." />
              </SelectTrigger>
              <SelectContent>
                {printers.map(printer => (
                  <SelectItem key={printer.id} value={printer.id}>
                    <div>
                      <div className="font-medium">{printer.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {printer.location} • {printer.ip_address}:{printer.port}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input
              type="number"
              min="1"
              max="100"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          {/* Order Info */}
          <Card className="bg-muted/50">
            <CardHeader className="py-2">
              <CardTitle className="text-sm">Order Information</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Part:</span> {order.customer_part_number}
                </div>
                <div>
                  <span className="text-muted-foreground">Qty:</span> {order.total_order_quantity}
                </div>
                <div>
                  <span className="text-muted-foreground">Customer:</span> {order.customer?.name}
                </div>
                <div>
                  <span className="text-muted-foreground">CT:</span> {order.ct_numbers?.length || 0} assigned
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleDesignNew}>
              <Edit3 className="h-4 w-4 mr-1" />
              Design New Label
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handlePrint}
                disabled={isLoading || (!selectedTemplate && printMode === 'template')}
              >
                <Printer className="h-4 w-4 mr-1" />
                Print {quantity} Label{parseInt(quantity) > 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Add missing import
import { cn } from '@/lib/utils'