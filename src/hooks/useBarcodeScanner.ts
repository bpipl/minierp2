import { useEffect, useCallback, useRef } from 'react'

interface BarcodeScannerOptions {
  onScan: (barcode: string) => void
  enabled?: boolean
  minLength?: number
  maxLength?: number
  scanTimeout?: number // ms between character inputs to detect scan vs typing
  preventDefault?: boolean
  validateFormat?: (input: string) => boolean
}

interface ScanResult {
  isScanning: boolean
  lastScan: string | null
  scanCount: number
}

export function useBarcodeScanner(options: BarcodeScannerOptions) {
  const {
    onScan,
    enabled = true,
    minLength = 8,
    maxLength = 20,
    scanTimeout = 100, // 100ms - typical scanner input speed
    preventDefault = true,
    validateFormat
  } = options

  const bufferRef = useRef<string>('')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastScanRef = useRef<string | null>(null)
  const scanCountRef = useRef<number>(0)
  const isActiveRef = useRef<boolean>(enabled)

  // Update active state when enabled changes
  useEffect(() => {
    isActiveRef.current = enabled
  }, [enabled])

  const processScan = useCallback((scannedText: string) => {
    // Validate length
    if (scannedText.length < minLength || scannedText.length > maxLength) {
      console.log('🚫 Barcode scan rejected: Invalid length', scannedText.length)
      return
    }

    // Validate format if provided
    if (validateFormat && !validateFormat(scannedText)) {
      console.log('🚫 Barcode scan rejected: Invalid format', scannedText)
      return
    }

    // Avoid duplicate scans
    if (lastScanRef.current === scannedText) {
      console.log('🚫 Barcode scan rejected: Duplicate', scannedText)
      return
    }

    // Process the scan
    lastScanRef.current = scannedText
    scanCountRef.current += 1
    
    console.log('📷 Barcode scanned:', scannedText)
    onScan(scannedText)
  }, [onScan, minLength, maxLength, validateFormat])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isActiveRef.current) return

    const { key, target } = event

    // Skip if user is actively typing in an input field (detect by typing speed)
    const isInputField = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
    
    // Handle Enter key (common scan terminator)
    if (key === 'Enter' && bufferRef.current.length > 0) {
      if (preventDefault) {
        event.preventDefault()
      }
      
      const scannedText = bufferRef.current.trim()
      bufferRef.current = ''
      
      if (scannedText.length >= minLength) {
        processScan(scannedText)
      }
      return
    }

    // Handle Tab key (another common scan terminator)
    if (key === 'Tab' && bufferRef.current.length > 0) {
      const scannedText = bufferRef.current.trim()
      bufferRef.current = ''
      
      if (scannedText.length >= minLength) {
        // Don't prevent Tab default behavior unless we're sure it's a scan
        if (!isInputField) {
          event.preventDefault()
        }
        processScan(scannedText)
      }
      return
    }

    // Handle regular characters
    if (key.length === 1) {
      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Add character to buffer
      bufferRef.current += key

      // Set timeout to detect end of scan
      timeoutRef.current = setTimeout(() => {
        const scannedText = bufferRef.current.trim()
        bufferRef.current = ''
        
        // Only process if it looks like a complete scan (length and speed)
        if (scannedText.length >= minLength && scannedText.length <= maxLength) {
          processScan(scannedText)
        }
      }, scanTimeout)
    }

    // Handle special keys that might terminate scan
    if (['Escape', 'Backspace', 'Delete'].includes(key)) {
      bufferRef.current = ''
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [preventDefault, minLength, maxLength, scanTimeout, processScan])

  // Set up global keyboard listener
  useEffect(() => {
    if (!enabled) return

    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [enabled, handleKeyDown])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const clearBuffer = useCallback(() => {
    bufferRef.current = ''
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const simulateScan = useCallback((barcode: string) => {
    processScan(barcode)
  }, [processScan])

  return {
    scanResult: {
      isScanning: !!timeoutRef.current,
      lastScan: lastScanRef.current,
      scanCount: scanCountRef.current
    } as ScanResult,
    clearBuffer,
    simulateScan // For testing
  }
}

// Utility function to detect if input looks like a barcode scan
export function detectBarcodeScan(input: string, options?: {
  minLength?: number
  maxLength?: number
  allowedChars?: RegExp
}): boolean {
  const {
    minLength = 8,
    maxLength = 20,
    allowedChars = /^[A-Z0-9]+$/i
  } = options || {}

  // Check length
  if (input.length < minLength || input.length > maxLength) {
    return false
  }

  // Check character pattern
  if (!allowedChars.test(input)) {
    return false
  }

  // Additional heuristics for barcode vs manual input
  // Barcodes typically have consistent case and no spaces
  const hasConsistentCase = input === input.toUpperCase() || input === input.toLowerCase()
  const hasNoSpaces = !input.includes(' ')
  
  return hasConsistentCase && hasNoSpaces
}

// CT-specific barcode validation
export function validateCTBarcode(input: string): boolean {
  // Must be exactly 14 characters, alphanumeric, uppercase
  return /^[A-Z0-9]{14}$/.test(input.toUpperCase())
}