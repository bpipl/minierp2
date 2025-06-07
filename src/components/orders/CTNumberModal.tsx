import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Hash, 
  Plus, 
  Copy, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Wand2,
  FileText,
  Clock,
  Shuffle,
  Loader2,
  Scan,
  Zap,
  Printer,
  Eye
} from 'lucide-react'
import { OrderLineWithDetails } from '@/hooks/useOrders'
import { useCTNumbers, useSaveCTNumbers, useCTDuplicateCheck } from '@/hooks/useCTNumbers'
import { useAuth } from '@/hooks/useAuth'
import { 
  validateCTNumber, 
  validateCTBatch, 
  extractCTNumbers, 
  formatCTForDisplay,
  generateCTNumber,
  CTGenerationOptions
} from '@/utils/ctNumberValidation'
import { useBarcodeScanner, validateCTBarcode } from '@/hooks/useBarcodeScanner'
import { 
  generateCTLabelsZPL, 
  downloadZPLFile, 
  getAvailableTemplates,
  LABEL_TEMPLATES,
  generateLabelaryPreviewUrl
} from '@/utils/labelGeneration'
import { usePrinterConfig } from '@/hooks/usePrinterConfig'
import { cn } from '@/lib/utils'

interface CTNumberModalProps {
  isOpen: boolean
  onClose: () => void
  orderLine: OrderLineWithDetails
  onSave: (ctNumbers: string[]) => void
}

export function CTNumberModal({ isOpen, onClose, orderLine, onSave }: CTNumberModalProps) {
  const [ctInput, setCTInput] = useState('')
  const [ctNumbers, setCTNumbers] = useState<string[]>([])
  const [showGenerator, setShowGenerator] = useState(false)
  const [duplicateWarnings, setDuplicateWarnings] = useState<Record<string, string>>({})
  const [generateCount, setGenerateCount] = useState(1)
  const [scannerEnabled, setScannerEnabled] = useState(true)
  const [recentScans, setRecentScans] = useState<string[]>([])
  const [showPrintSection, setShowPrintSection] = useState(false)
  const [savedCTNumbers, setSavedCTNumbers] = useState<string[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('default-ct-label')
  const [selectedPrinter, setSelectedPrinter] = useState('')
  const [printQuantity, setPrintQuantity] = useState(1)
  const [isGeneratingZPL, setIsGeneratingZPL] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Hooks
  const { user } = useAuth()
  const { data: existingCTs = [] } = useCTNumbers(orderLine.id)
  const saveCTMutation = useSaveCTNumbers()
  const duplicateCheckMutation = useCTDuplicateCheck()
  const { getActivePrinters, getDefaultPrinter } = usePrinterConfig()

  // Barcode scanner integration
  const { scanResult } = useBarcodeScanner({
    enabled: scannerEnabled && isOpen,
    onScan: handleBarcodeScan,
    minLength: 10, // Allow shorter codes too
    maxLength: 20,
    scanTimeout: 150, // Slightly longer for reliability
    validateFormat: validateCTBarcode
  })

  // Handle barcode scan
  async function handleBarcodeScan(scannedCT: string) {
    console.log('📷 CT Barcode scanned:', scannedCT)
    
    // Format the scanned CT
    const validation = validateCTNumber(scannedCT)
    if (!validation.isValid) {
      console.log('🚫 Invalid CT format from scan:', validation.errors)
      return
    }

    const formattedCT = validation.formatted
    
    // Check if already in the list
    if (ctNumbers.includes(formattedCT)) {
      console.log('🚫 CT already in list:', formattedCT)
      return
    }

    // Add to recent scans for UI feedback
    setRecentScans(prev => [formattedCT, ...prev.slice(0, 4)]) // Keep last 5 scans

    // Check for duplicates in database
    try {
      const duplicateChecks = await duplicateCheckMutation.mutateAsync([formattedCT])
      const check = duplicateChecks[0]
      
      if (check?.isDuplicate && check.warningMessage) {
        setDuplicateWarnings(prev => ({ ...prev, [formattedCT]: check.warningMessage! }))
      }
      
      // Add to CT list
      setCTNumbers(prev => [...prev, formattedCT])
      
    } catch (error) {
      console.error('Failed to check duplicates for scanned CT:', error)
      // Still add the CT even if duplicate check fails
      setCTNumbers(prev => [...prev, formattedCT])
    }
  }

  // Reset when modal opens and load existing CTs
  useEffect(() => {
    if (isOpen) {
      setCTInput('')
      setCTNumbers(existingCTs.map(ct => ct.ct_number))
      setShowGenerator(false)
      setDuplicateWarnings({})
      setGenerateCount(1)
      setRecentScans([])
      setScannerEnabled(true)
      setShowPrintSection(false)
      setSavedCTNumbers([])
      setSelectedTemplate('default-ct-label')
      setSelectedPrinter(defaultPrinter?.id || '')
      setPrintQuantity(1)
    }
  }, [isOpen, existingCTs])

  // Real-time validation of input
  const handleInputChange = (value: string) => {
    setCTInput(value)
    
    // Just update the input, don't auto-add to the list
    // This prevents overwriting existing CT numbers during typing
  }

  // Add CT numbers from input with duplicate checking
  const handleAddCTs = async () => {
    if (!ctInput.trim()) return

    const extracted = extractCTNumbers(ctInput)
    const validation = validateCTBatch(extracted)
    
    if (validation.validCTs.length > 0) {
      // Check for duplicates in database
      try {
        const duplicateChecks = await duplicateCheckMutation.mutateAsync(validation.validCTs)
        const warnings: Record<string, string> = {}
        
        duplicateChecks.forEach((check, index) => {
          const ct = validation.validCTs[index]
          if (check.isDuplicate && check.warningMessage) {
            warnings[ct] = check.warningMessage
          }
        })
        
        setDuplicateWarnings(prev => ({ ...prev, ...warnings }))
        
        // Add all valid CTs (including duplicates for now, let user decide)
        setCTNumbers(prev => [...prev, ...validation.validCTs])
        setCTInput('')
      } catch (error) {
        console.error('Failed to check duplicates:', error)
        // Still add CTs even if duplicate check fails
        setCTNumbers(prev => [...prev, ...validation.validCTs])
        setCTInput('')
      }
    }
  }

  // Remove a specific CT number
  const handleRemoveCT = (index: number) => {
    const ctToRemove = ctNumbers[index]
    setCTNumbers(prev => prev.filter((_, i) => i !== index))
    
    // Remove the duplicate warning for this CT
    if (ctToRemove && duplicateWarnings[ctToRemove]) {
      setDuplicateWarnings(prev => {
        const updated = { ...prev }
        delete updated[ctToRemove]
        return updated
      })
    }
  }

  // Generate CT numbers in bulk
  const handleGenerateCT = (options: CTGenerationOptions) => {
    const remainingNeeded = Math.max(0, requiredQuantity - currentCount)
    const willExceedRequired = generateCount > remainingNeeded && remainingNeeded > 0
    
    // Show warning if generating more than needed
    if (willExceedRequired && remainingNeeded > 0) {
      const proceed = window.confirm(
        `⚠️ WARNING: You're about to generate ${generateCount} CT numbers, but only ${remainingNeeded} more are needed to complete this order.\n\n` +
        `This will result in ${generateCount - remainingNeeded} excess CTs.\n\n` +
        `Do you want to proceed anyway?`
      )
      
      if (!proceed) {
        return // User cancelled
      }
    }
    
    const newCTs: string[] = []
    const countToGenerate = Math.min(generateCount, 100) // Max 100 at once for safety
    
    for (let i = 0; i < countToGenerate; i++) {
      const newCT = generateCTNumber(options)
      newCTs.push(newCT)
    }
    
    setCTNumbers(prev => [...prev, ...newCTs])
    setShowGenerator(false)
    
    if (willExceedRequired && remainingNeeded > 0) {
      console.log(`⚠️ Generated ${newCTs.length} CT numbers (${newCTs.length - remainingNeeded} excess) using ${options.strategy} strategy`)
    } else {
      console.log(`✅ Generated ${newCTs.length} CT numbers using ${options.strategy} strategy`)
    }
  }

  // Copy all CT numbers to clipboard
  const handleCopyAll = async () => {
    const ctText = ctNumbers.join('\n')
    try {
      await navigator.clipboard.writeText(ctText)
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  // Save CT numbers to database
  const handleSave = async () => {
    if (ctNumbers.length === 0 || !user?.id) return

    try {
      // Filter out existing CTs to only save new ones
      const existingCTNumbers = existingCTs.map(ct => ct.ct_number)
      const newCTNumbers = ctNumbers.filter(ct => !existingCTNumbers.includes(ct))
      
      if (newCTNumbers.length > 0) {
        await saveCTMutation.mutateAsync({
          orderLineId: orderLine.id,
          ctNumbers: newCTNumbers,
          assignedBy: user.id
        })
      }
      
      // Store saved CT numbers for printing
      setSavedCTNumbers(ctNumbers)
      setPrintQuantity(ctNumbers.length)
      
      // Show print section instead of closing immediately
      setShowPrintSection(true)
      
      onSave(ctNumbers)
    } catch (error) {
      console.error('Failed to save CT numbers:', error)
      // Could show error toast here
    }
  }

  // Print functionality handlers
  const handlePrintLabels = async () => {
    if (!selectedPrinter || savedCTNumbers.length === 0) return
    
    setIsPrinting(true)
    
    try {
      // Generate ZPL for the labels
      const zplContent = await generateCTLabelsZPL(savedCTNumbers, orderLine, selectedTemplate, printQuantity)
      
      // TODO: Send to printer via NPS or alternative approach
      console.log('🖨️ Generated ZPL for printing:', { 
        template: selectedTemplate, 
        printer: selectedPrinter, 
        quantity: printQuantity,
        ctNumbers: savedCTNumbers.slice(0, printQuantity)
      })
      
      // For now, just download the ZPL file
      downloadZPLFile(zplContent, `CT_Labels_${orderLine.uid}_${new Date().toISOString().split('T')[0]}.zpl`)
      
      // Close modal after successful print
      setTimeout(() => {
        onClose()
      }, 1000)
      
    } catch (error) {
      console.error('Failed to print labels:', error)
    } finally {
      setIsPrinting(false)
    }
  }
  
  const handlePreviewLabels = async () => {
    if (savedCTNumbers.length === 0) return
    
    setIsGeneratingZPL(true)
    
    try {
      const zplContent = await generateCTLabelsZPL(savedCTNumbers, orderLine, selectedTemplate, printQuantity)
      const template = LABEL_TEMPLATES[selectedTemplate]
      
      // Open Labelary.com preview in new tab
      const labelaryUrl = generateLabelaryPreviewUrl(zplContent, template)
      window.open(labelaryUrl, '_blank')
      
    } catch (error) {
      console.error('Failed to generate preview:', error)
    } finally {
      setIsGeneratingZPL(false)
    }
  }
  
  const handleSkipPrint = () => {
    onClose()
  }
  
  // Validate current input in real-time
  const inputValidation = validateCTNumber(ctInput.trim())
  const requiredQuantity = orderLine.order_quantity || 0
  const currentCount = ctNumbers.length
  const isComplete = currentCount >= requiredQuantity
  
  // Available label templates (from utility)
  const labelTemplates = getAvailableTemplates()
  
  // Available printers (from configuration)
  const availablePrinters = getActivePrinters()
  const defaultPrinter = getDefaultPrinter()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Hash className="h-5 w-5" />
            <span>CT Number Management - {orderLine.uid}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Part Number:</span> {orderLine.customer_part_number}
              </div>
              <div>
                <span className="font-medium">Order Quantity:</span> {orderLine.order_quantity}
              </div>
              <div className="col-span-2">
                <span className="font-medium">Description:</span> {orderLine.bpi_description}
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant={isComplete ? "default" : "outline"} className="text-sm">
                {currentCount} of {requiredQuantity} CTs assigned
              </Badge>
              {isComplete && (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              )}
            </div>
            
            {ctNumbers.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleCopyAll}>
                <Copy className="h-4 w-4 mr-2" />
                Copy All
              </Button>
            )}
          </div>

          {/* Scanner Status & Controls */}
          <div className="bg-gray-50 p-3 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Scan className={cn(
                    "h-4 w-4",
                    scannerEnabled ? "text-green-600" : "text-gray-400"
                  )} />
                  <span className="text-sm font-medium">
                    Barcode Scanner
                  </span>
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    scannerEnabled ? "bg-green-500" : "bg-gray-300"
                  )} />
                </div>
                
                {scanResult.isScanning && (
                  <div className="flex items-center space-x-1 text-blue-600">
                    <Zap className="h-3 w-3 animate-pulse" />
                    <span className="text-xs">Scanning...</span>
                  </div>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setScannerEnabled(!scannerEnabled)}
                className="text-xs"
              >
                {scannerEnabled ? 'Disable' : 'Enable'} Scanner
              </Button>
            </div>
            
            {/* Recent scans */}
            {recentScans.length > 0 && (
              <div className="mt-2">
                <span className="text-xs text-gray-600">Recent scans: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {recentScans.map((scan, index) => (
                    <span key={index} className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                      {formatCTForDisplay(scan)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-2 text-xs text-gray-600">
              💡 Point barcode scanner at CT labels and scan. Manual entry also available below.
            </div>
          </div>

          {/* CT Input Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="ct-input">Manual CT Entry</Label>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowGenerator(!showGenerator)}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Generate
              </Button>
            </div>

            <div className="space-y-2">
              <Input
                ref={inputRef}
                id="ct-input"
                placeholder="Enter 14-digit CT numbers (one per line or separated by commas)"
                value={ctInput}
                onChange={(e) => handleInputChange(e.target.value)}
                className={cn(
                  "font-mono",
                  ctInput && !inputValidation.isValid && "border-red-300 focus:border-red-500"
                )}
              />
              
              {ctInput && (
                <div className="text-sm">
                  {inputValidation.isValid ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Valid CT: {formatCTForDisplay(inputValidation.formatted)}
                    </div>
                  ) : (
                    <div className="text-red-600">
                      {inputValidation.errors.map((error, i) => (
                        <div key={i} className="flex items-center">
                          <XCircle className="h-4 w-4 mr-1" />
                          {error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Button onClick={handleAddCTs} disabled={!inputValidation.isValid}>
                <Plus className="h-4 w-4 mr-2" />
                Add CT Number
              </Button>
            </div>
          </div>

          {/* CT Generator */}
          {showGenerator && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium mb-3 flex items-center">
                <Wand2 className="h-4 w-4 mr-2" />
                CT Number Generator
              </h4>
              
              {/* Generation Count Control */}
              <div className="mb-4">
                <Label htmlFor="generate-count" className="text-sm font-medium">
                  Number of CTs to Generate
                </Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    id="generate-count"
                    type="number"
                    min="1"
                    max="100"
                    value={generateCount}
                    onChange={(e) => setGenerateCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                    className={cn(
                      "w-20 text-sm",
                      generateCount > Math.max(0, requiredQuantity - currentCount) && requiredQuantity > currentCount 
                        ? "border-orange-300 bg-orange-50" 
                        : ""
                    )}
                  />
                  <span className="text-sm text-gray-600">
                    (Max 100 at once)
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGenerateCount(Math.max(1, requiredQuantity - currentCount))}
                    disabled={currentCount >= requiredQuantity}
                    className="text-xs"
                  >
                    Fill Remaining ({Math.max(0, requiredQuantity - currentCount)})
                  </Button>
                </div>
                
                {/* Over-generation warning */}
                {generateCount > Math.max(0, requiredQuantity - currentCount) && requiredQuantity > currentCount && (
                  <div className="mt-2 text-xs text-orange-600 flex items-center">
                    <span className="mr-1">⚠️</span>
                    Generating {generateCount - Math.max(0, requiredQuantity - currentCount)} more than needed
                  </div>
                )}
              </div>

              {/* Generation Strategy Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleGenerateCT({ strategy: 'fai_master' })}
                  className="flex items-center justify-start"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  FAI Master CT ({generateCount})
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleGenerateCT({ strategy: 'last_used' })}
                  className="flex items-center justify-start"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Last Used CT ({generateCount})
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleGenerateCT({ strategy: 'random_suffix', randomLength: 4 })}
                  className="flex items-center justify-start"
                >
                  <Shuffle className="h-4 w-4 mr-2" />
                  Random CT ({generateCount})
                </Button>
              </div>
              
              <div className="mt-3 text-xs text-blue-700">
                💡 Tip: Use "Fill Remaining" to generate exactly the number needed to complete this order
              </div>
            </div>
          )}

          {/* Assigned CT Numbers List */}
          {ctNumbers.length > 0 && (
            <div className="space-y-2">
              <Label>Assigned CT Numbers ({ctNumbers.length})</Label>
              <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                <div className="grid grid-cols-1 gap-2">
                  {ctNumbers.map((ct, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 min-w-[2rem]">
                          {index + 1}.
                        </span>
                        <div className="flex flex-col">
                          <code className="font-mono text-sm">
                            {formatCTForDisplay(ct)}
                          </code>
                          {duplicateWarnings[ct] && (
                            <div className="flex items-center mt-1">
                              <AlertTriangle className="h-3 w-3 text-orange-500 mr-1" />
                              <span className="text-xs text-orange-600">
                                {duplicateWarnings[ct]}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCT(index)}
                        className="h-6 w-6 p-0"
                      >
                        <XCircle className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Duplicate Warning */}
          {/* TODO: Add duplicate checking against database */}

          {/* Real-time Status Indicator */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-green-100">
                  <div className="h-2 w-2 rounded-full bg-green-600 animate-pulse"></div>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-xs text-green-800">
                  🔄 Live updates enabled - CT changes from other users appear instantly
                </p>
              </div>
            </div>
          </div>

          {/* Print Section - Shown after successful save */}
          {showPrintSection && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 space-y-4">
              <div className="flex items-center space-x-2">
                <Printer className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Print CT Labels</h3>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  {savedCTNumbers.length} CTs Saved
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Template Selection */}
                <div className="space-y-2">
                  <Label htmlFor="template-select">Label Template</Label>
                  <select
                    id="template-select"
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    {labelTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Printer Selection */}
                <div className="space-y-2">
                  <Label htmlFor="printer-select">Target Printer</Label>
                  <select
                    id="printer-select"
                    value={selectedPrinter}
                    onChange={(e) => setSelectedPrinter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Select Printer...</option>
                    {availablePrinters.map((printer) => (
                      <option key={printer.id} value={printer.id}>
                        {printer.name} ({printer.ipAddress})
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Print Quantity */}
                <div className="space-y-2">
                  <Label htmlFor="print-quantity">Quantity</Label>
                  <Input
                    id="print-quantity"
                    type="number"
                    min="1"
                    max={savedCTNumbers.length}
                    value={printQuantity}
                    onChange={(e) => setPrintQuantity(Math.max(1, Math.min(savedCTNumbers.length, parseInt(e.target.value) || 1)))}
                    className="text-sm"
                  />
                </div>
              </div>
              
              {/* Print Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-blue-200">
                <div className="text-sm text-blue-700">
                  🏷️ Printing {printQuantity} label{printQuantity === 1 ? '' : 's'} for {savedCTNumbers.slice(0, printQuantity).map(ct => formatCTForDisplay(ct)).join(', ')}
                </div>
                
                <div className="flex space-x-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handlePreviewLabels}
                    disabled={isGeneratingZPL}
                  >
                    {isGeneratingZPL ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleSkipPrint}
                  >
                    Skip Printing
                  </Button>
                  
                  <Button 
                    onClick={handlePrintLabels}
                    disabled={!selectedPrinter || isPrinting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isPrinting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Printing...
                      </>
                    ) : (
                      <>
                        <Printer className="h-4 w-4 mr-2" />
                        Print Labels
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons - Only show if print section is not active */}
          {!showPrintSection && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-500">
                {ctNumbers.length > 0 && (
                  <span>
                    {currentCount >= requiredQuantity ? (
                      <span className="text-green-600 font-medium">Ready to save</span>
                    ) : (
                      <span>Need {requiredQuantity - currentCount} more CT numbers</span>
                    )}
                  </span>
                )}
              </div>
              
              <div className="flex space-x-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={ctNumbers.length === 0 || saveCTMutation.isPending}
                  className={cn(
                    isComplete && "bg-green-600 hover:bg-green-700"
                  )}
                >
                  {saveCTMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>Save {ctNumbers.length} CT Numbers</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}