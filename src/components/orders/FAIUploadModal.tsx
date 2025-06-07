// FAI Document Upload Modal
// Upload FAI Excel documents with automatic image extraction

import { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  File, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  FileSpreadsheet,
  Image as ImageIcon
} from 'lucide-react'
import { useFAI } from '@/hooks/useFAI'
import { FAIDocument, FAIDocumentUploadData } from '@/types/fai'
import { cn } from '@/lib/utils'

interface FAIUploadModalProps {
  customer_part_number: string
  isOpen: boolean
  onClose: () => void
  onUploadSuccess: (document: FAIDocument) => void
}

export function FAIUploadModal({ 
  customer_part_number, 
  isOpen, 
  onClose, 
  onUploadSuccess 
}: FAIUploadModalProps) {
  const { uploadFAIDocument, isLoading } = useFAI()
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [version, setVersion] = useState('')
  const [description, setDescription] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      validateAndSetFile(file)
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      validateAndSetFile(file)
    }
  }, [])

  const validateAndSetFile = (file: File) => {
    // Reset previous states
    setErrorMessage('')
    setUploadStatus('idle')

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ]
    
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Only Excel files (.xlsx, .xls) are allowed')
      return
    }

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      setErrorMessage('File size must be less than 100MB')
      return
    }

    setSelectedFile(file)
    
    // Auto-generate version if not set
    if (!version) {
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '')
      setVersion(`v${timestamp}`)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploadStatus('uploading')
    setUploadProgress(0)
    setErrorMessage('')

    try {
      const uploadData: FAIDocumentUploadData = {
        customer_part_number,
        file: selectedFile,
        version: version || '1.0',
        description
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await uploadFAIDocument(uploadData)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      setUploadStatus('processing')

      // Simulate image extraction processing
      setTimeout(() => {
        setUploadStatus('success')
        onUploadSuccess(response.document)
        
        // Auto-close after success
        setTimeout(() => {
          handleClose()
        }, 2000)
      }, 1500)

    } catch (error) {
      setUploadStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed')
      setUploadProgress(0)
    }
  }

  const handleClose = () => {
    if (uploadStatus === 'uploading' || uploadStatus === 'processing') {
      return // Prevent closing during upload
    }
    
    setSelectedFile(null)
    setVersion('')
    setDescription('')
    setUploadProgress(0)
    setUploadStatus('idle')
    setErrorMessage('')
    setDragActive(false)
    onClose()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  const getStatusMessage = () => {
    switch (uploadStatus) {
      case 'uploading':
        return 'Uploading FAI document...'
      case 'processing':
        return 'Extracting images from Sheet2...'
      case 'success':
        return 'FAI document uploaded successfully!'
      case 'error':
        return errorMessage || 'Upload failed'
      default:
        return ''
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold">
                Upload FAI Document
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-1">
                Part Number: <span className="font-medium">{customer_part_number}</span>
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClose}
              disabled={uploadStatus === 'uploading' || uploadStatus === 'processing'}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Area */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300",
              selectedFile ? "border-green-500 bg-green-50" : "",
              uploadStatus === 'error' ? "border-red-500 bg-red-50" : ""
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-3">
                  <FileSpreadsheet className="h-8 w-8 text-green-500" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(selectedFile.size)} • Excel Document
                    </p>
                  </div>
                </div>
                
                {uploadStatus !== 'idle' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center space-x-2">
                      {getStatusIcon()}
                      <span className="text-sm font-medium">{getStatusMessage()}</span>
                    </div>
                    
                    {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}
                
                {uploadStatus === 'idle' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    Remove File
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Upload className={cn(
                    "h-12 w-12",
                    dragActive ? "text-blue-500" : "text-gray-400"
                  )} />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Drop your FAI Excel file here
                  </p>
                  <p className="text-sm text-gray-500">
                    or click to browse files
                  </p>
                </div>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="fai-file-input"
                />
                <Button 
                  variant="outline" 
                  asChild
                  disabled={uploadStatus === 'uploading' || uploadStatus === 'processing'}
                >
                  <label htmlFor="fai-file-input" className="cursor-pointer">
                    <File className="h-4 w-4 mr-2" />
                    Choose File
                  </label>
                </Button>
                <div className="text-xs text-gray-500">
                  Supported formats: .xlsx, .xls (Max: 100MB)
                </div>
              </div>
            )}
          </div>

          {errorMessage && uploadStatus === 'error' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-800">Upload Error</span>
              </div>
              <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
            </div>
          )}

          {/* File Metadata */}
          {selectedFile && uploadStatus === 'idle' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="version">Version (optional)</Label>
                  <Input
                    id="version"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="e.g., v1.0, Rev A"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Updated FAI document"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <ImageIcon className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800">Automatic Image Extraction</p>
                    <p className="text-blue-600 mt-1">
                      Images will be automatically extracted from "Sheet2" of your Excel file and made available for viewing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={uploadStatus === 'uploading' || uploadStatus === 'processing'}
            >
              {uploadStatus === 'success' ? 'Close' : 'Cancel'}
            </Button>
            
            {selectedFile && uploadStatus === 'idle' && (
              <Button onClick={handleUpload} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload FAI Document
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}