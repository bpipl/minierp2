import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Eye,
  FileText,
  ArrowRight,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useOrderImport } from '@/hooks/useOrderImport'
import { ImportValidationResult, ImportRow } from '@/utils/orderImportValidation'
import { downloadCSVTemplate } from '@/utils/csvTemplate'
import { cn } from '@/lib/utils'

interface OrderImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete: (importedCount: number) => void
}

type ImportStep = 'upload' | 'validate' | 'preview' | 'importing' | 'complete'

export function OrderImportModal({ isOpen, onClose, onImportComplete }: OrderImportModalProps) {
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null)
  const [previewData, setPreviewData] = useState<ImportRow[]>([])
  const [importProgress, setImportProgress] = useState(0)
  const [importSummary, setImportSummary] = useState<{ successful: number; failed: number; uids: string[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Hooks
  const { user } = useAuth()
  const { processFile, validateImport, executeImport } = useOrderImport()

  // Reset state when modal opens
  const resetState = () => {
    setCurrentStep('upload')
    setSelectedFile(null)
    setValidationResult(null)
    setPreviewData([])
    setImportProgress(0)
    setImportSummary(null)
  }

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    setSelectedFile(file)
    setCurrentStep('validate')

    try {
      // Process and validate the file
      const data = await processFile(file)
      const validation = await validateImport(data)
      
      setValidationResult(validation)
      setPreviewData(data)
      
      // Move to preview step if validation passes
      if (validation.isValid) {
        setCurrentStep('preview')
      }
    } catch (error) {
      console.error('Failed to process file:', error)
      setValidationResult({
        isValid: false,
        errors: [`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        validRows: 0,
        totalRows: 0,
        rowErrors: []
      })
    }
  }

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    const file = files[0]
    
    if (file && isValidFileType(file)) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Validate file type
  const isValidFileType = (file: File): boolean => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    return validTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
  }

  // Download CSV template
  const handleDownloadTemplate = () => {
    downloadCSVTemplate()
  }

  // Execute import
  const handleExecuteImport = async () => {
    if (!validationResult || !previewData || !user?.id) return

    setCurrentStep('importing')
    setImportProgress(0)

    try {
      const result = await executeImport(
        previewData.filter((_, index) => !validationResult.rowErrors.some(error => error.rowIndex === index)),
        user.id,
        (progress) => setImportProgress(progress)
      )

      setImportSummary(result)
      setCurrentStep('complete')
      
      // Notify parent component
      onImportComplete(result.successful)
      
    } catch (error) {
      console.error('Import failed:', error)
      setValidationResult({
        ...validationResult,
        errors: [...validationResult.errors, `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      })
      setCurrentStep('preview')
    }
  }

  // Handle close
  const handleClose = () => {
    resetState()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5" />
            <span>Import Orders from CSV/Excel</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {(['upload', 'validate', 'preview', 'importing', 'complete'] as ImportStep[]).map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
                    currentStep === step ? "bg-blue-600 text-white" :
                    ['upload', 'validate', 'preview', 'importing'].indexOf(currentStep) > index ? "bg-green-600 text-white" :
                    "bg-gray-200 text-gray-500"
                  )}>
                    {index + 1}
                  </div>
                  {index < 4 && (
                    <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: File Upload */}
          {currentStep === 'upload' && (
            <div className="space-y-6">
              {/* Download Template Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-blue-900">Download Template First</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Use our CSV template with proper column headers and sample data
                    </p>
                  </div>
                  <Button onClick={handleDownloadTemplate} variant="outline" className="bg-white">
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </div>
              </div>

              {/* File Upload Area */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
              >
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Drop your CSV/Excel file here
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  or click to browse files
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                >
                  Choose File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file && isValidFileType(file)) {
                      handleFileSelect(file)
                    }
                  }}
                  className="hidden"
                />
                <p className="text-xs text-gray-400 mt-4">
                  Supported formats: CSV, Excel (.xlsx, .xls) • Max 1000 rows
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Validation */}
          {currentStep === 'validate' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="font-medium">Validating file...</span>
              </div>
              <div className="text-sm text-gray-600">
                Processing {selectedFile?.name} and checking data integrity
              </div>
            </div>
          )}

          {/* Step 3: Preview and Validation Results */}
          {currentStep === 'preview' && validationResult && (
            <div className="space-y-6">
              {/* Validation Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{validationResult.totalRows}</div>
                  <div className="text-sm text-gray-600">Total Rows</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{validationResult.validRows}</div>
                  <div className="text-sm text-green-600">Valid Rows</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{validationResult.rowErrors.length}</div>
                  <div className="text-sm text-red-600">Error Rows</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{validationResult.warnings.length}</div>
                  <div className="text-sm text-yellow-600">Warnings</div>
                </div>
              </div>

              {/* Global Errors */}
              {validationResult.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <h3 className="font-medium text-red-900">File Errors</h3>
                  </div>
                  <ul className="space-y-1 text-sm text-red-700">
                    {validationResult.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Global Warnings */}
              {validationResult.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <h3 className="font-medium text-yellow-900">Warnings</h3>
                  </div>
                  <ul className="space-y-1 text-sm text-yellow-700">
                    {validationResult.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Row Errors */}
              {validationResult.rowErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <h3 className="font-medium text-red-900">Row-Specific Errors</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {validationResult.rowErrors.map((rowError) => (
                      <div key={rowError.rowIndex} className="text-sm">
                        <div className="font-medium text-red-800">Row {rowError.rowIndex + 2}:</div>
                        <ul className="ml-4 text-red-700">
                          {rowError.errors.map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Preview */}
              {validationResult.validRows > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium flex items-center space-x-2">
                    <Eye className="h-4 w-4" />
                    <span>Preview Valid Data ({validationResult.validRows} rows will be imported)</span>
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-64 overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium">Customer</th>
                            <th className="px-3 py-2 text-left font-medium">Part Number</th>
                            <th className="px-3 py-2 text-left font-medium">Description</th>
                            <th className="px-3 py-2 text-left font-medium">Qty</th>
                            <th className="px-3 py-2 text-left font-medium">Category</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.filter((_, index) => 
                            !validationResult.rowErrors.some(error => error.rowIndex === index)
                          ).slice(0, 10).map((row, index) => (
                            <tr key={index} className="border-t">
                              <td className="px-3 py-2">{row.customerName}</td>
                              <td className="px-3 py-2 font-mono">{row.customerPartNumber}</td>
                              <td className="px-3 py-2">{row.bpiDescription || row.customerDescription}</td>
                              <td className="px-3 py-2">{row.orderQuantity}</td>
                              <td className="px-3 py-2">{row.productCategory}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {validationResult.validRows > 10 && (
                      <div className="bg-gray-50 px-3 py-2 text-sm text-gray-600 text-center">
                        ... and {validationResult.validRows - 10} more rows
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Importing */}
          {currentStep === 'importing' && (
            <div className="space-y-6">
              <div className="text-center">
                <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-medium">Importing Orders...</h3>
                <p className="text-sm text-gray-600">Please wait while we create your orders</p>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
              
              <div className="text-center text-sm text-gray-600">
                {Math.round(importProgress)}% complete
              </div>
            </div>
          )}

          {/* Step 5: Complete */}
          {currentStep === 'complete' && importSummary && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-green-900">Import Complete!</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{importSummary.successful}</div>
                  <div className="text-sm text-green-600">Orders Created</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{importSummary.failed}</div>
                  <div className="text-sm text-red-600">Failed</div>
                </div>
              </div>

              {importSummary.uids.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium">Generated Order UIDs:</h3>
                  <div className="flex flex-wrap gap-2">
                    {importSummary.uids.map((uid) => (
                      <Badge key={uid} variant="outline" className="bg-green-50 text-green-700">
                        {uid}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-500">
              {selectedFile && (
                <span>File: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
              )}
            </div>
            
            <div className="flex space-x-3">
              {currentStep !== 'importing' && (
                <Button variant="outline" onClick={handleClose}>
                  {currentStep === 'complete' ? 'Close' : 'Cancel'}
                </Button>
              )}
              
              {currentStep === 'preview' && validationResult?.validRows && validationResult.validRows > 0 && (
                <Button 
                  onClick={handleExecuteImport}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Import {validationResult.validRows} Orders
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}