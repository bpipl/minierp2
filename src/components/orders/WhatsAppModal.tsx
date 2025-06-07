// WhatsApp Message Modal
// Modal interface for sending WhatsApp messages from order cards

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare, 
  Send, 
  Users, 
  FileText, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye
} from 'lucide-react'
import { useWhatsApp } from '@/hooks/useWhatsApp'
import { WhatsAppTemplate, MessagePriority } from '@/types/whatsapp'
import { cn } from '@/lib/utils'

interface WhatsAppModalProps {
  isOpen: boolean
  onClose: () => void
  orderLineId: string
  orderData: {
    uid: string
    customerName: string
    customerPartNumber: string
    bpiDescription: string
    orderQuantity: number
    currentStatus: string
  }
}

export function WhatsAppModal({ isOpen, onClose, orderLineId, orderData }: WhatsAppModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null)
  const [messageContent, setMessageContent] = useState('')
  const [selectedGroups, setSelectedGroups] = useState<string[]>(['directors'])
  const [customRecipients, setCustomRecipients] = useState('')
  const [priority, setPriority] = useState<MessagePriority>('medium')
  const [showPreview, setShowPreview] = useState(false)
  const [sendSuccess, setSendSuccess] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const { 
    isLoading, 
    templates, 
    loadTemplates, 
    sendMessage, 
    processTemplate 
  } = useWhatsApp()

  // Load templates on mount
  useEffect(() => {
    if (isOpen) {
      loadTemplates()
      resetForm()
    }
  }, [isOpen])

  // Reset form state
  const resetForm = () => {
    setSelectedTemplate(null)
    setMessageContent('')
    setSelectedGroups(['directors'])
    setCustomRecipients('')
    setPriority('medium')
    setShowPreview(false)
    setSendSuccess(false)
    setSendError(null)
  }

  // Handle template selection
  const handleTemplateSelect = (template: WhatsAppTemplate) => {
    setSelectedTemplate(template)
    // Process template with current order data
    const processedContent = processTemplate(template.content, {
      uid: orderData.uid,
      customerName: orderData.customerName,
      customerPartNumber: orderData.customerPartNumber,
      bpiDescription: orderData.bpiDescription,
      orderQuantity: orderData.orderQuantity,
      currentStatus: orderData.currentStatus,
      ctNumbers: [],
      poNumber: undefined,
      eta: undefined
    })
    setMessageContent(processedContent)
  }

  // Handle send message
  const handleSendMessage = async () => {
    if (!messageContent.trim()) {
      setSendError('Message content is required')
      return
    }

    setSendError(null)

    try {
      // Parse custom recipients
      const recipients = customRecipients
        .split(',')
        .map(r => r.trim())
        .filter(r => r.length > 0)

      const result = await sendMessage({
        content: messageContent,
        recipients,
        recipientGroups: selectedGroups,
        orderLineId,
        templateId: selectedTemplate?.id,
        priority
      })

      if (result.success) {
        setSendSuccess(true)
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        setSendError(result.error || 'Failed to send message')
      }
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Unknown error occurred')
    }
  }

  // Available recipient groups
  const recipientGroups = [
    { id: 'directors', name: 'Directors', description: 'Management team' },
    { id: 'sbStaff', name: 'SB Staff', description: 'SB location workers' },
    { id: 'npStaff', name: 'NP Staff', description: 'NP location workers' },
    { id: 'procurement', name: 'Procurement', description: 'Procurement team' }
  ]

  // Template categories with icons
  const templateCategories = {
    qc_alerts: { name: 'QC Alerts', icon: '🚨', color: 'bg-red-50 text-red-700 border-red-200' },
    procurement: { name: 'Procurement', icon: '📦', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    transfers: { name: 'Transfers', icon: '🔄', color: 'bg-green-50 text-green-700 border-green-200' },
    approvals: { name: 'Approvals', icon: '✅', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    security: { name: 'Security', icon: '🔐', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    general: { name: 'General', icon: '💬', color: 'bg-gray-50 text-gray-700 border-gray-200' }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Send WhatsApp Message</span>
          </DialogTitle>
          <div className="text-sm text-gray-600">
            Order: {orderData.uid} • {orderData.customerPartNumber}
          </div>
        </DialogHeader>

        {sendSuccess ? (
          // Success state
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-green-900 mb-2">Message Sent Successfully!</h3>
            <p className="text-sm text-green-700">
              Your WhatsApp message has been delivered to the selected recipients.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Template Selection */}
            <div className="space-y-3">
              <h3 className="font-medium flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Message Templates</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {Object.entries(
                  templates.reduce((acc, template) => {
                    if (!acc[template.category]) acc[template.category] = []
                    acc[template.category].push(template)
                    return acc
                  }, {} as Record<string, WhatsAppTemplate[]>)
                ).map(([category, categoryTemplates]) => (
                  <div key={category} className="space-y-2">
                    <div className={cn(
                      "flex items-center space-x-2 px-2 py-1 rounded text-xs font-medium border",
                      templateCategories[category as keyof typeof templateCategories]?.color || templateCategories.general.color
                    )}>
                      <span>{templateCategories[category as keyof typeof templateCategories]?.icon || templateCategories.general.icon}</span>
                      <span>{templateCategories[category as keyof typeof templateCategories]?.name || 'General'}</span>
                    </div>
                    {categoryTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border transition-colors",
                          selectedTemplate?.id === template.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        )}
                      >
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {template.content.substring(0, 80)}...
                        </div>
                        {template.isDefault && (
                          <Badge variant="secondary" className="mt-2 text-xs">Default</Badge>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Message Content */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Message Content</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {showPreview ? 'Edit' : 'Preview'}
                </Button>
              </div>
              
              {showPreview ? (
                <div className="border rounded-lg p-4 bg-gray-50 whitespace-pre-wrap text-sm">
                  {messageContent || 'No message content'}
                </div>
              ) : (
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Enter your message or select a template above..."
                  className="w-full h-32 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              )}
            </div>

            {/* Recipients */}
            <div className="space-y-3">
              <h3 className="font-medium flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Recipients</span>
              </h3>
              
              {/* Group Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  WhatsApp Groups
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {recipientGroups.map((group) => (
                    <label key={group.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedGroups.includes(group.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGroups([...selectedGroups, group.id])
                          } else {
                            setSelectedGroups(selectedGroups.filter(g => g !== group.id))
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <div>
                        <div className="text-sm font-medium">{group.name}</div>
                        <div className="text-xs text-gray-500">{group.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Custom Recipients */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Additional Recipients (phone numbers, comma-separated)
                </label>
                <input
                  type="text"
                  value={customRecipients}
                  onChange={(e) => setCustomRecipients(e.target.value)}
                  placeholder="+1234567890, +0987654321"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-3">
              <h3 className="font-medium">Message Priority</h3>
              <div className="flex space-x-3">
                {(['low', 'medium', 'high', 'urgent'] as MessagePriority[]).map((p) => (
                  <label key={p} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      value={p}
                      checked={priority === p}
                      onChange={(e) => setPriority(e.target.value as MessagePriority)}
                      className="text-blue-600"
                    />
                    <span className={cn(
                      "text-sm capitalize px-2 py-1 rounded",
                      p === 'urgent' ? 'bg-red-100 text-red-700' :
                      p === 'high' ? 'bg-orange-100 text-orange-700' :
                      p === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    )}>
                      {p}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Error Display */}
            {sendError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-700">{sendError}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {sendSuccess ? 'Close' : 'Cancel'}
          </Button>
          
          {!sendSuccess && (
            <Button 
              onClick={handleSendMessage}
              disabled={isLoading || !messageContent.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}