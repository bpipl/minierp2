import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Wifi, WifiOff, AlertCircle } from 'lucide-react'

export function RealtimeIndicator() {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting')

  useEffect(() => {
    // Simple connection indicator based on network status
    const updateOnlineStatus = () => {
      if (navigator.onLine) {
        setConnectionStatus('connected')
      } else {
        setConnectionStatus('disconnected')
      }
    }

    // Initial check
    updateOnlineStatus()

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    // Set connected after a brief delay to show "connecting" state
    const timer = setTimeout(() => {
      if (navigator.onLine) {
        setConnectionStatus('connected')
      }
    }, 1000)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: Wifi,
          text: 'Live',
          className: 'bg-green-100 text-green-700',
          dotClass: 'bg-green-500 animate-pulse',
          title: 'Real-time updates active'
        }
      case 'connecting':
        return {
          icon: AlertCircle,
          text: 'Connecting',
          className: 'bg-yellow-100 text-yellow-700',
          dotClass: 'bg-yellow-500 animate-pulse',
          title: 'Connecting to real-time updates...'
        }
      case 'disconnected':
        return {
          icon: WifiOff,
          text: 'Offline',
          className: 'bg-red-100 text-red-700',
          dotClass: 'bg-red-500',
          title: 'Connection lost - data may be outdated'
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <div 
      className={cn(
        "flex items-center p-1 rounded-full transition-colors",
        config.className
      )}
      title={config.title}
    >
      <Icon className="h-3 w-3" />
      <div className={cn("h-1.5 w-1.5 rounded-full ml-0.5", config.dotClass)}></div>
    </div>
  )
}