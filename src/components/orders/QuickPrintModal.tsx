import React, { useState } from 'react'
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
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Printer } from 'lucide-react'
import { toast } from 'sonner'
import { QUICK_PRINT_TEMPLATES } from '@/types/labelDesigner'
import { cn } from '@/lib/utils'

interface QuickPrintModalProps {
  isOpen: boolean
  onClose: () => void
}

export function QuickPrintModal({ isOpen, onClose }: QuickPrintModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [quantity, setQuantity] = useState('1')

  const handlePrint = () => {
    if (!selectedTemplate) {
      toast.error('Please select a label template')
      return
    }

    const qty = parseInt(quantity)
    if (isNaN(qty) || qty < 1) {
      toast.error('Please enter a valid quantity')
      return
    }

    // For now, just show success
    toast.success(`Printing ${qty} ${selectedTemplate} label(s)`)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Quick Print Labels</DialogTitle>
          <DialogDescription>
            Select a pre-designed label template for quick printing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Grid */}
          <div className="space-y-2">
            <Label className="text-sm">Select Template</Label>
            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto">
              {QUICK_PRINT_TEMPLATES.map(template => (
                <Card
                  key={template.id}
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-md',
                    selectedTemplate === template.id 
                      ? 'ring-2 ring-primary border-primary' 
                      : 'hover:border-gray-400'
                  )}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm font-medium">
                      {template.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Category: {template.category}
                    </p>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-sm">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max="100"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handlePrint}
              disabled={!selectedTemplate}
            >
              <Printer className="h-4 w-4 mr-1" />
              Print {quantity} Label{parseInt(quantity) > 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}