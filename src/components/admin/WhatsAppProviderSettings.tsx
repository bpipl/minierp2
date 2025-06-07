// WhatsApp Provider Configuration Interface
// Admin interface for managing dual WhatsApp providers

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Cloud, 
  Globe, 
  Check, 
  X, 
  TestTube,
  AlertCircle,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  Save,
  RefreshCw
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { WhatsAppProviderConfig, WhatsAppProvider } from '@/types/whatsappProvider'
import { WhatsAppProviderManager } from '@/services/WhatsAppProviderManager'
import { cn } from '@/lib/utils'

export function WhatsAppProviderSettings() {
  const [config, setConfig] = useState<WhatsAppProviderConfig | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [providerStatus, setProviderStatus] = useState<{
    activeProvider: WhatsAppProvider
    metaApiStatus: boolean
    n8nStatus: boolean
    fallbackAvailable: boolean
  } | null>(null)
  const [providerManager] = useState(() => new WhatsAppProviderManager())

  useEffect(() => {
    loadConfiguration()
    checkProviderStatus()
  }, [])

  const loadConfiguration = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('whatsapp_provider_configs')
        .select('*')
        .eq('is_active', true)
        .single()

      if (!error && data) {
        const configData = data as WhatsAppProviderConfig
        // Ensure costOptimization exists with defaults
        if (!configData.costOptimization) {
          configData.costOptimization = {
            useMetaForCritical: false,
            useN8NForBulk: true
          }
        }
        setConfig(configData)
      } else {
        // Set default configuration
        setConfig({
          provider: 'n8n_evolution_api',
          isActive: true,
          fallbackProvider: undefined,
          n8nConfig: {
            webhookUrl: import.meta.env.VITE_N8N_WEBHOOK_URL || '',
          },
          costOptimization: {
            useMetaForCritical: false,
            useN8NForBulk: true
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error('Failed to load provider configuration:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkProviderStatus = async () => {
    try {
      await providerManager.initialize()
      const status = await providerManager.getProviderStatus()
      setProviderStatus(status)
    } catch (error) {
      console.error('Failed to check provider status:', error)
    }
  }

  const saveConfiguration = async () => {
    if (!config) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('whatsapp_provider_configs')
        .upsert([{
          ...config,
          updated_at: new Date().toISOString()
        }])

      if (error) throw error

      await checkProviderStatus()
      alert('✅ Configuration saved successfully!')
    } catch (error) {
      console.error('Failed to save configuration:', error)
      alert('❌ Failed to save configuration')
    } finally {
      setIsSaving(false)
    }
  }

  const switchProvider = async (newProvider: WhatsAppProvider) => {
    if (!config) return

    try {
      await providerManager.switchProvider(newProvider)
      setConfig({ ...config, provider: newProvider })
      await checkProviderStatus()
    } catch (error) {
      console.error('Failed to switch provider:', error)
      alert('❌ Failed to switch provider')
    }
  }

  const testProvider = async (provider: WhatsAppProvider) => {
    try {
      // Initialize the specific provider for testing
      await providerManager.initialize()
      
      // Send a test message
      const testMessage = `🧪 Test message from ${provider} provider - ${new Date().toLocaleString()}`
      await providerManager.sendMessage('+919999999999', testMessage, { 
        provider, 
        fallback: false 
      })
      
      alert(`✅ ${provider} test message sent successfully!`)
    } catch (error) {
      console.error(`${provider} test failed:`, error)
      alert(`❌ ${provider} test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading provider configuration...
      </div>
    )
  }

  if (!config) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Configuration Error</h3>
        <p className="text-gray-500">Failed to load WhatsApp provider configuration.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">WhatsApp Provider Settings</h2>
          <p className="text-sm text-gray-600">Configure and manage WhatsApp messaging providers</p>
        </div>
        <Button onClick={saveConfiguration} disabled={isSaving}>
          {isSaving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Configuration
        </Button>
      </div>

      {/* Provider Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Provider Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Cloud className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Meta Cloud API</span>
              </div>
              <div className="flex items-center space-x-2">
                {providerStatus?.metaApiStatus ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
                <Badge variant={providerStatus?.metaApiStatus ? 'default' : 'destructive'}>
                  {providerStatus?.metaApiStatus ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Globe className="h-5 w-5 text-purple-500" />
                <span className="font-medium">N8N Evolution API</span>
              </div>
              <div className="flex items-center space-x-2">
                {providerStatus?.n8nStatus ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
                <Badge variant={providerStatus?.n8nStatus ? 'default' : 'destructive'}>
                  {providerStatus?.n8nStatus ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Active Provider:</span>
              <Badge variant="outline" className="ml-2">
                {config.provider === 'meta_cloud_api' ? 'Meta Cloud API' : 'N8N Evolution API'}
              </Badge>
              {providerStatus?.fallbackAvailable && (
                <Badge variant="secondary" className="ml-2">Fallback Available</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Primary Provider Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              className={cn(
                "p-4 border-2 rounded-lg cursor-pointer transition-colors",
                config.provider === 'meta_cloud_api' 
                  ? "border-blue-500 bg-blue-50" 
                  : "border-gray-200 hover:border-gray-300"
              )}
              onClick={() => switchProvider('meta_cloud_api')}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Cloud className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Meta Cloud API</span>
                </div>
                {config.provider === 'meta_cloud_api' ? (
                  <ToggleRight className="h-5 w-5 text-blue-500" />
                ) : (
                  <ToggleLeft className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Official WhatsApp Business API</li>
                <li>• Interactive buttons and rich media</li>
                <li>• Better compliance and reliability</li>
                <li>• Lower operational costs</li>
              </ul>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3 w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  testProvider('meta_cloud_api')
                }}
              >
                <TestTube className="h-4 w-4 mr-2" />
                Test Connection
              </Button>
            </div>

            <div 
              className={cn(
                "p-4 border-2 rounded-lg cursor-pointer transition-colors",
                config.provider === 'n8n_evolution_api' 
                  ? "border-purple-500 bg-purple-50" 
                  : "border-gray-200 hover:border-gray-300"
              )}
              onClick={() => switchProvider('n8n_evolution_api')}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-purple-500" />
                  <span className="font-medium">N8N Evolution API</span>
                </div>
                {config.provider === 'n8n_evolution_api' ? (
                  <ToggleRight className="h-5 w-5 text-purple-500" />
                ) : (
                  <ToggleLeft className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Existing N8N workflow integration</li>
                <li>• Evolution API backend</li>
                <li>• Flexible webhook configuration</li>
                <li>• Proven reliability</li>
              </ul>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3 w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  testProvider('n8n_evolution_api')
                }}
              >
                <TestTube className="h-4 w-4 mr-2" />
                Test Connection
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meta Cloud API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Cloud className="h-5 w-5 text-blue-500" />
            <span>Meta WhatsApp Cloud API Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">App ID</label>
              <Input
                type="text"
                placeholder="Your Meta App ID"
                value={config.metaConfig?.appId || ''}
                onChange={(e) => setConfig({
                  ...config,
                  metaConfig: {
                    ...config.metaConfig,
                    appId: e.target.value,
                    appSecret: config.metaConfig?.appSecret || '',
                    businessAccountId: config.metaConfig?.businessAccountId || '',
                    phoneNumberId: config.metaConfig?.phoneNumberId || '',
                    accessToken: config.metaConfig?.accessToken || '',
                    webhookVerifyToken: config.metaConfig?.webhookVerifyToken || '',
                    apiVersion: config.metaConfig?.apiVersion || 'v21.0'
                  }
                })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Business Account ID</label>
              <Input
                type="text"
                placeholder="Your Business Account ID"
                value={config.metaConfig?.businessAccountId || ''}
                onChange={(e) => setConfig({
                  ...config,
                  metaConfig: {
                    ...config.metaConfig,
                    businessAccountId: e.target.value,
                    appId: config.metaConfig?.appId || '',
                    appSecret: config.metaConfig?.appSecret || '',
                    phoneNumberId: config.metaConfig?.phoneNumberId || '',
                    accessToken: config.metaConfig?.accessToken || '',
                    webhookVerifyToken: config.metaConfig?.webhookVerifyToken || '',
                    apiVersion: config.metaConfig?.apiVersion || 'v21.0'
                  }
                })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number ID</label>
              <Input
                type="text"
                placeholder="Your Phone Number ID"
                value={config.metaConfig?.phoneNumberId || ''}
                onChange={(e) => setConfig({
                  ...config,
                  metaConfig: {
                    ...config.metaConfig,
                    phoneNumberId: e.target.value,
                    appId: config.metaConfig?.appId || '',
                    appSecret: config.metaConfig?.appSecret || '',
                    businessAccountId: config.metaConfig?.businessAccountId || '',
                    accessToken: config.metaConfig?.accessToken || '',
                    webhookVerifyToken: config.metaConfig?.webhookVerifyToken || '',
                    apiVersion: config.metaConfig?.apiVersion || 'v21.0'
                  }
                })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Access Token</label>
              <Input
                type="password"
                placeholder="Your Access Token"
                value={config.metaConfig?.accessToken || ''}
                onChange={(e) => setConfig({
                  ...config,
                  metaConfig: {
                    ...config.metaConfig,
                    accessToken: e.target.value,
                    appId: config.metaConfig?.appId || '',
                    appSecret: config.metaConfig?.appSecret || '',
                    businessAccountId: config.metaConfig?.businessAccountId || '',
                    phoneNumberId: config.metaConfig?.phoneNumberId || '',
                    webhookVerifyToken: config.metaConfig?.webhookVerifyToken || '',
                    apiVersion: config.metaConfig?.apiVersion || 'v21.0'
                  }
                })}
              />
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Environment Variables Required:</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <div><code>VITE_META_APP_ID</code> - Your Meta App ID</div>
              <div><code>VITE_META_ACCESS_TOKEN</code> - Your Access Token</div>
              <div><code>VITE_META_PHONE_NUMBER_ID</code> - Your Phone Number ID</div>
              <div><code>VITE_META_BUSINESS_ACCOUNT_ID</code> - Your Business Account ID</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Optimization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            <span>Cost Optimization</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium">Use Meta API for Critical Messages</span>
                <p className="text-sm text-gray-600">High priority and urgent messages via official API</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfig({
                  ...config,
                  costOptimization: {
                    ...config.costOptimization,
                    useMetaForCritical: !config.costOptimization.useMetaForCritical
                  }
                })}
              >
                {config.costOptimization.useMetaForCritical ? (
                  <ToggleRight className="h-5 w-5 text-green-500" />
                ) : (
                  <ToggleLeft className="h-5 w-5 text-gray-400" />
                )}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium">Use N8N for Bulk Messages</span>
                <p className="text-sm text-gray-600">Low priority and bulk messages via N8N route</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfig({
                  ...config,
                  costOptimization: {
                    ...config.costOptimization,
                    useN8NForBulk: !config.costOptimization.useN8NForBulk
                  }
                })}
              >
                {config.costOptimization.useN8NForBulk ? (
                  <ToggleRight className="h-5 w-5 text-green-500" />
                ) : (
                  <ToggleLeft className="h-5 w-5 text-gray-400" />
                )}
              </Button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Max Meta Messages Per Day (optional)</label>
              <Input
                type="number"
                placeholder="e.g., 1000"
                value={config.costOptimization.maxMetaMessagesPerDay || ''}
                onChange={(e) => setConfig({
                  ...config,
                  costOptimization: {
                    ...config.costOptimization,
                    maxMetaMessagesPerDay: e.target.value ? parseInt(e.target.value) : undefined
                  }
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}