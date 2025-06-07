// Printer Configuration Hook
// Manages printer settings and configurations for label printing

import { useState, useEffect } from 'react'

export interface PrinterConfig {
  id: string
  name: string
  ipAddress: string
  port: number
  model: string
  location: 'SB' | 'NP' | 'BOTH'
  isDefault?: boolean
  isActive?: boolean
}

export interface PrinterSettings {
  npsUrl?: string
  defaultTemplate?: string
  printers: PrinterConfig[]
}

// Default printer configurations (will move to database/admin panel later)
const DEFAULT_PRINTERS: PrinterConfig[] = [
  {
    id: 'printer-sb-main',
    name: 'SB Main Printer',
    ipAddress: '192.168.1.100',
    port: 9100,
    model: 'Zebra ZT410',
    location: 'SB',
    isDefault: true,
    isActive: true
  },
  {
    id: 'printer-sb-backup',
    name: 'SB Backup Printer', 
    ipAddress: '192.168.1.101',
    port: 9100,
    model: 'Zebra ZT230',
    location: 'SB',
    isDefault: false,
    isActive: true
  },
  {
    id: 'printer-np-main',
    name: 'NP Main Printer',
    ipAddress: '192.168.1.200', 
    port: 9100,
    model: 'Zebra ZT410',
    location: 'NP',
    isDefault: false,
    isActive: true
  }
]

const DEFAULT_SETTINGS: PrinterSettings = {
  npsUrl: import.meta.env.VITE_NPS_URL || 'http://localhost:3001/print',
  defaultTemplate: 'default-ct-label',
  printers: DEFAULT_PRINTERS
}

export function usePrinterConfig() {
  const [settings, setSettings] = useState<PrinterSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load printer settings from localStorage (will replace with API call later)
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('printer-settings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...DEFAULT_SETTINGS, ...parsed })
      }
    } catch (err) {
      console.error('Failed to load printer settings:', err)
      setError('Failed to load printer settings')
    }
  }, [])

  // Save settings to localStorage (will replace with API call later)
  const saveSettings = async (newSettings: Partial<PrinterSettings>) => {
    setIsLoading(true)
    setError(null)

    try {
      const updatedSettings = { ...settings, ...newSettings }
      localStorage.setItem('printer-settings', JSON.stringify(updatedSettings))
      setSettings(updatedSettings)
      console.log('✅ Printer settings saved')
    } catch (err) {
      console.error('Failed to save printer settings:', err)
      setError('Failed to save printer settings')
    } finally {
      setIsLoading(false)
    }
  }

  // Add new printer
  const addPrinter = async (printer: Omit<PrinterConfig, 'id'>) => {
    const newPrinter: PrinterConfig = {
      ...printer,
      id: `printer-${Date.now()}`
    }

    await saveSettings({
      printers: [...settings.printers, newPrinter]
    })
  }

  // Update existing printer
  const updatePrinter = async (printerId: string, updates: Partial<PrinterConfig>) => {
    const updatedPrinters = settings.printers.map(printer =>
      printer.id === printerId ? { ...printer, ...updates } : printer
    )

    await saveSettings({ printers: updatedPrinters })
  }

  // Remove printer
  const removePrinter = async (printerId: string) => {
    const filteredPrinters = settings.printers.filter(printer => printer.id !== printerId)
    await saveSettings({ printers: filteredPrinters })
  }

  // Get active printers for current location
  const getActivePrinters = (location?: 'SB' | 'NP') => {
    return settings.printers.filter(printer => {
      if (!printer.isActive) return false
      if (!location) return true
      return printer.location === location || printer.location === 'BOTH'
    })
  }

  // Get default printer for location
  const getDefaultPrinter = (location?: 'SB' | 'NP') => {
    const activePrinters = getActivePrinters(location)
    return activePrinters.find(printer => printer.isDefault) || activePrinters[0]
  }

  // Test printer connectivity (placeholder for now)
  const testPrinter = async (printerId: string): Promise<boolean> => {
    const printer = settings.printers.find(p => p.id === printerId)
    if (!printer) return false

    // TODO: Implement actual connectivity test
    console.log(`🔍 Testing printer: ${printer.name} (${printer.ipAddress}:${printer.port})`)
    
    // Simulate test delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // For now, just return true (will implement real test later)
    return true
  }

  return {
    settings,
    isLoading,
    error,
    saveSettings,
    addPrinter,
    updatePrinter,
    removePrinter,
    getActivePrinters,
    getDefaultPrinter,
    testPrinter
  }
}