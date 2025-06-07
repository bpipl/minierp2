// WhatsApp Admin Settings Component
// Comprehensive admin interface for WhatsApp configuration

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  MessageSquare, 
  Users, 
  Globe, 
  Plus, 
  Edit, 
  Trash2, 
  TestTube,
  Eye,
  Cloud
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { WhatsAppTemplate, WhatsAppGroup, N8NWebhookConfig, TEMPLATE_PLACEHOLDERS } from '@/types/whatsapp'
import { WhatsAppProviderSettings } from './WhatsAppProviderSettings'
import { cn } from '@/lib/utils'

export function WhatsAppSettings() {
  const [activeTab, setActiveTab] = useState<'providers' | 'templates' | 'groups' | 'webhooks' | 'users'>('providers')
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
  const [groups, setGroups] = useState<WhatsAppGroup[]>([])
  const [webhooks, setWebhooks] = useState<N8NWebhookConfig[]>([])
  const [, setIsLoading] = useState(false)

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setIsLoading(true)
    try {
      switch (activeTab) {
        case 'templates':
          await loadTemplates()
          break
        case 'groups':
          await loadGroups()
          break
        case 'webhooks':
          await loadWebhooks()
          break
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      // Don't throw error here since individual load functions handle their own errors
    } finally {
      setIsLoading(false)
    }
  }

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      
      // Ensure each template has proper structure
      const processedTemplates = (data || []).map(template => ({
        ...template,
        placeholders: template.placeholders || []
      }))
      
      setTemplates(processedTemplates)
    } catch (error) {
      console.error('Failed to load WhatsApp templates:', error)
      setTemplates([])
    }
  }

  const loadGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_groups')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      
      // Ensure each group has proper structure
      const processedGroups = (data || []).map(group => ({
        ...group,
        members: group.members || [],
        permissions: group.permissions || []
      }))
      
      setGroups(processedGroups)
    } catch (error) {
      console.error('Failed to load WhatsApp groups:', error)
      setGroups([])
    }
  }

  const loadWebhooks = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_webhook_configs')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setWebhooks(data || [])
    } catch (error) {
      console.error('Failed to load WhatsApp webhooks:', error)
      setWebhooks([])
    }
  }

  // Test webhook connection
  const testWebhook = async (webhookId: string) => {
    try {
      const webhook = webhooks.find(w => w.id === webhookId)
      if (!webhook) return

      const testPayload = {
        messageType: 'manual',
        content: '🧪 Test message from WhatsApp Admin Settings - Please ignore this message.',
        recipients: [],
        recipientGroups: ['directors'],
        triggeredBy: 'admin-test',
        priority: 'low'
      }

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(webhook.headers as Record<string, string> || {})
        },
        body: JSON.stringify(testPayload)
      })

      if (response.ok) {
        alert('✅ Webhook test successful! Check your WhatsApp for the test message.')
      } else {
        alert(`❌ Webhook test failed: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      alert(`❌ Webhook test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const tabs = [
    { id: 'providers', name: 'Provider Settings', icon: Cloud },
    { id: 'templates', name: 'Message Templates', icon: MessageSquare },
    { id: 'groups', name: 'WhatsApp Groups', icon: Users },
    { id: 'webhooks', name: 'N8N Webhooks', icon: Globe },
    { id: 'users', name: 'User Numbers', icon: Settings }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">WhatsApp Settings</h2>
          <p className="text-sm text-gray-600">Manage WhatsApp integration and messaging system</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm",
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Provider Settings Tab */}
      {activeTab === 'providers' && (
        <div className="space-y-6">
          <WhatsAppProviderSettings />
        </div>
      )}

      {/* Message Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Message Templates</h3>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>

          <div className="grid gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge variant={template.category === 'qc_alerts' ? 'destructive' : 'secondary'}>
                        {template.category.replace('_', ' ')}
                      </Badge>
                      {template.isDefault && (
                        <Badge variant="outline">Default</Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      {!template.isDefault && (
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap">
                      {template.content}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {template.placeholders?.map((placeholder) => (
                        <Badge key={placeholder} variant="outline" className="text-xs">
                          {placeholder}
                        </Badge>
                      )) || <span className="text-xs text-gray-500">No placeholders</span>}
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Status: {template.isActive ? 'Active' : 'Inactive'}</span>
                      <span>Created: {template.createdAt ? new Date(template.createdAt).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Available Placeholders Reference */}
          <Card>
            <CardHeader>
              <CardTitle>Available Placeholders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(TEMPLATE_PLACEHOLDERS).map(([placeholder, description]) => (
                  <div key={placeholder} className="flex items-center justify-between text-sm">
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">{placeholder}</code>
                    <span className="text-gray-600">{description}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* WhatsApp Groups Tab */}
      {activeTab === 'groups' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">WhatsApp Groups</h3>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Group
            </Button>
          </div>

          <div className="grid gap-4">
            {groups.map((group) => (
              <Card key={group.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <Badge variant={group.isActive ? 'default' : 'secondary'}>
                        {group.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">{group.description}</p>
                    <div>
                      <div className="text-sm font-medium mb-2">Members ({group.members?.length || 0})</div>
                      <div className="flex flex-wrap gap-1">
                        {group.members?.map((member, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {member}
                          </Badge>
                        )) || <span className="text-xs text-gray-500">No members</span>}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-2">Permissions</div>
                      <div className="flex flex-wrap gap-1">
                        {group.permissions?.map((permission) => (
                          <Badge key={permission} variant="secondary" className="text-xs">
                            {permission}
                          </Badge>
                        )) || <span className="text-xs text-gray-500">No permissions</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* N8N Webhooks Tab */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">N8N Webhook Configuration</h3>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Webhook
            </Button>
          </div>

          <div className="grid gap-4">
            {webhooks.map((webhook) => (
              <Card key={webhook.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CardTitle className="text-lg">{webhook.name}</CardTitle>
                      <Badge variant={webhook.isActive ? 'default' : 'secondary'}>
                        {webhook.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">
                        {webhook.messageType}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => testWebhook(webhook.id)}
                        disabled={!webhook.isActive}
                      >
                        <TestTube className="h-4 w-4 mr-1" />
                        Test
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium mb-1">Webhook URL</div>
                      <code className="bg-gray-100 p-2 rounded text-xs block break-all">
                        {webhook.url}
                      </code>
                    </div>
                    {webhook.authToken && (
                      <div>
                        <div className="text-sm font-medium mb-1">Auth Token</div>
                        <code className="bg-gray-100 p-2 rounded text-xs block">
                          ****{webhook.authToken.slice(-4)}
                        </code>
                      </div>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Message Type: {webhook.messageType}</span>
                      <span>Created: {new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Environment Variable Info */}
          <Card>
            <CardHeader>
              <CardTitle>Environment Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium mb-1">Default N8N Webhook URL</div>
                  <code className="bg-gray-100 p-2 rounded text-xs block">
                    VITE_N8N_WEBHOOK_URL={import.meta.env.VITE_N8N_WEBHOOK_URL || 'Not configured'}
                  </code>
                  <p className="text-xs text-gray-500 mt-1">
                    Used as fallback when no specific webhook is configured for a message type
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Numbers Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">User WhatsApp Numbers</h3>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">User Management Coming Soon</h3>
                <p className="text-gray-500">
                  WhatsApp user number management will be implemented in the next phase.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}