// Connection Status Indicator
// Shows network connectivity status for Supabase

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type ConnectionStatus = 'connected' | 'disconnected' | 'poor' | 'checking'

export function ConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>('checking')
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const checkConnection = async () => {
    try {
      setStatus('checking')
      
      const startTime = Date.now()
      
      // Simple health check query
      const { error } = await supabase
        .from('users')
        .select('id')
        .limit(1)
        .maybeSingle()
      
      const responseTime = Date.now() - startTime
      
      if (error) {
        setStatus('disconnected')
      } else if (responseTime > 3000) {
        setStatus('poor')
      } else {
        setStatus('connected')
      }
      
      setLastChecked(new Date())
    } catch (error) {
      setStatus('disconnected')
      setLastChecked(new Date())
    }
  }

  useEffect(() => {
    // Initial check
    checkConnection()
    
    // Check every 30 seconds
    const interval = setInterval(checkConnection, 30000)
    
    // Check when window regains focus
    const handleFocus = () => checkConnection()
    window.addEventListener('focus', handleFocus)
    
    // Check on network change
    const handleOnline = () => checkConnection()
    const handleOffline = () => setStatus('disconnected')
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: Wifi,
          text: 'Connected',
          variant: 'secondary' as const,
          className: 'text-green-600 bg-green-100'
        }
      case 'poor':
        return {
          icon: AlertTriangle,
          text: 'Slow',
          variant: 'secondary' as const,
          className: 'text-yellow-600 bg-yellow-100'
        }
      case 'disconnected':
        return {
          icon: WifiOff,
          text: 'Offline',
          variant: 'destructive' as const,
          className: 'text-red-600 bg-red-100'
        }
      case 'checking':
        return {
          icon: Wifi,
          text: 'Checking...',
          variant: 'outline' as const,
          className: 'text-gray-600 bg-gray-100'
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <div className="flex items-center space-x-2">
      <Badge 
        variant={config.variant}
        className={`text-xs ${config.className} cursor-pointer`}
        onClick={checkConnection}
        title={lastChecked ? `Last checked: ${lastChecked.toLocaleTimeString()}` : 'Click to check connection'}
      >
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </Badge>
      
      {status === 'disconnected' && (
        <button
          onClick={checkConnection}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Retry
        </button>
      )}
    </div>
  )
}