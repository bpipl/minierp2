import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Save, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LabelDesigner } from '@/components/labelDesigner/LabelDesigner'
import { ZPLGenerator } from '@/utils/zplGenerator'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { LabelTemplate } from '@/types/labelDesigner'

export function LabelDesignerPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateCategory, setTemplateCategory] = useState<LabelTemplate['category']>('generic')

  // Get order data if coming from an order
  const orderData = location.state?.orderData

  const handleSaveTemplate = async (templateData: any) => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name')
      return
    }

    setIsSaving(true)
    try {
      const template: Partial<LabelTemplate> = {
        name: templateName,
        category: templateCategory,
        canvas_data: templateData.canvas_data,
        label_size: templateData.label_size,
        created_by: user?.id || '',
      }

      const { error } = await supabase
        .from('label_templates')
        .insert(template)

      if (error) throw error

      toast.success('Template saved successfully')
      navigate('/settings?tab=labels')
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Failed to save template')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePrint = async (zplCode: string) => {
    try {
      // For now, just download the ZPL file
      const blob = new Blob([zplCode], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `label_${Date.now()}.zpl`
      a.click()
      URL.revokeObjectURL(url)
      
      toast.success('ZPL file downloaded')
    } catch (error) {
      console.error('Error handling print:', error)
      toast.error('Failed to generate print file')
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-lg font-semibold">Label Designer</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Template name..."
            className="px-3 py-1 text-sm border rounded-md"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
          />
          <select
            className="px-3 py-1 text-sm border rounded-md"
            value={templateCategory}
            onChange={(e) => setTemplateCategory(e.target.value as any)}
          >
            <option value="generic">Generic</option>
            <option value="ct_label">CT Label</option>
            <option value="shipping">Shipping</option>
            <option value="internal">Internal</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>

      {/* Designer */}
      <div className="flex-1 p-4 overflow-hidden">
        <LabelDesigner
          onSave={handleSaveTemplate}
          onPrint={handlePrint}
        />
      </div>

      {/* Order Data Preview (if available) */}
      {orderData && (
        <Card className="m-4">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Order Data Available</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">UID:</span> {orderData.uid}
              </div>
              <div>
                <span className="text-muted-foreground">Part:</span> {orderData.customer_part_number}
              </div>
              <div>
                <span className="text-muted-foreground">Qty:</span> {orderData.total_quantity}
              </div>
              <div>
                <span className="text-muted-foreground">Customer:</span> {orderData.customer_name}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}