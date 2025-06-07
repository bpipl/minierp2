// Master Image Upload Modal
// Upload high-resolution master reference images for parts

import { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  Star,
  Camera
} from 'lucide-react'
import { useFAI } from '@/hooks/useFAI'
import { MasterImage, MasterImageUploadData } from '@/types/fai'
import { cn } from '@/lib/utils'

interface MasterImageUploadModalProps {
  customer_part_number: string
  isOpen: boolean
  onClose: () => void
  onUploadSuccess: (image: MasterImage) => void
}

export function MasterImageUploadModal({ 
  customer_part_number, 
  isOpen, 
  onClose, 
  onUploadSuccess 
}: MasterImageUploadModalProps) {
  const { uploadMasterImage, isLoading } = useFAI()
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [viewAngle, setViewAngle] = useState('')
  const [qualityNotes, setQualityNotes] = useState('')
  const [isPrimary, setIsPrimary] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
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
    
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff']
    
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Only image files (PNG, JPG, TIFF) are allowed')
      return
    }

    // Validate file size (50MB limit for high-res images)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      setErrorMessage('File size must be less than 50MB')
      return
    }

    // Validate image dimensions (minimum resolution)
    const img = new Image()
    img.onload = () => {
      if (img.width < 800 || img.height < 600) {
        setErrorMessage('Image resolution must be at least 800x600 pixels for quality reference')
        URL.revokeObjectURL(img.src)
        return
      }
      
      setSelectedFile(file)
      setPreviewUrl(img.src)
    }
    img.src = URL.createObjectURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploadStatus('uploading')
    setErrorMessage('')

    try {
      const uploadData: MasterImageUploadData = {
        customer_part_number,
        file: selectedFile,
        description: description.trim() || undefined,
        view_angle: viewAngle.trim() || undefined,
        quality_notes: qualityNotes.trim() || undefined,
        is_primary: isPrimary
      }

      const response = await uploadMasterImage(uploadData)
      
      setUploadStatus('success')
      onUploadSuccess(response)
      
      // Auto-close after success
      setTimeout(() => {
        handleClose()
      }, 2000)

    } catch (error) {
      setUploadStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed')
    }
  }

  const handleClose = () => {
    if (uploadStatus === 'uploading') {
      return // Prevent closing during upload
    }
    
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    
    setSelectedFile(null)
    setPreviewUrl(null)
    setDescription('')
    setViewAngle('')
    setQualityNotes('')
    setIsPrimary(false)
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
        return 'Uploading master image...'
      case 'success':
        return 'Master image uploaded successfully!'
      case 'error':
        return errorMessage || 'Upload failed'
      default:
        return ''
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold">
                Upload Master Image
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-1">
                Part Number: <span className="font-medium">{customer_part_number}</span>
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClose}
              disabled={uploadStatus === 'uploading'}
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
            {selectedFile && previewUrl ? (
              <div className="space-y-4">
                <div className="relative inline-block">
                  <img 
                    src={previewUrl} 
                    alt="Preview"
                    className="max-w-full max-h-64 object-contain rounded-lg shadow-md"
                  />
                  {isPrimary && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="default" className="bg-yellow-500">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Primary
                      </Badge>
                    </div>
                  )}
                </div>
                
                <div className="text-left max-w-md mx-auto">
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(selectedFile.size)} • High-Resolution Image
                  </p>
                </div>
                
                {uploadStatus !== 'idle' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center space-x-2">
                      {getStatusIcon()}
                      <span className="text-sm font-medium">{getStatusMessage()}</span>
                    </div>
                  </div>
                )}
                
                {uploadStatus === 'idle' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null)
                      if (previewUrl) {
                        URL.revokeObjectURL(previewUrl)
                        setPreviewUrl(null)
                      }
                    }}
                  >
                    Remove Image
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Camera className={cn(
                    "h-12 w-12",
                    dragActive ? "text-blue-500" : "text-gray-400"
                  )} />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Drop your master image here
                  </p>
                  <p className="text-sm text-gray-500">
                    or click to browse files
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/tiff"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="master-image-input"
                />
                <Button 
                  variant="outline" 
                  asChild
                  disabled={uploadStatus === 'uploading'}
                >
                  <label htmlFor="master-image-input" className="cursor-pointer">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Choose Image
                  </label>
                </Button>
                <div className="text-xs text-gray-500">
                  Supported formats: PNG, JPG, TIFF (Min: 800x600, Max: 50MB)
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

          {/* Image Metadata */}
          {selectedFile && uploadStatus === 'idle' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Front view, Top angle"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="view-angle">View Angle</Label>
                  <Input
                    id="view-angle"
                    value={viewAngle}
                    onChange={(e) => setViewAngle(e.target.value)}
                    placeholder="e.g., Front, Side, Top, 45°"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="quality-notes">Quality Notes (optional)</Label>
                <Textarea
                  id="quality-notes"
                  value={qualityNotes}
                  onChange={(e) => setQualityNotes(e.target.value)}
                  placeholder="Notes about lighting, resolution, special conditions..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="is-primary"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="is-primary" className="cursor-pointer">
                  <div className="flex items-center space-x-2">
                    <Star className={cn(
                      "h-4 w-4",
                      isPrimary ? "text-yellow-500 fill-current" : "text-gray-400"
                    )} />
                    <span>Set as Primary Master Image</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Primary images are displayed first and used as the main reference
                  </p>
                </Label>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Star className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Master Image Guidelines</p>
                    <ul className="text-yellow-700 mt-1 space-y-1">
                      <li>• Use high-resolution images (minimum 800x600)</li>
                      <li>• Ensure good lighting and clear focus</li>
                      <li>• Capture multiple angles for complete reference</li>
                      <li>• Avoid shadows and reflections when possible</li>
                    </ul>
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
              disabled={uploadStatus === 'uploading'}
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
                    Upload Master Image
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