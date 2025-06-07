// Image Viewer Modal
// Display FAI and Master images with full-screen viewing capabilities

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight, 
  Download,
  Star,
  FileText,
  Image as ImageIcon,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { useFAI } from '@/hooks/useFAI'
import { ImageViewerData, FAIImage, MasterImage } from '@/types/fai'
import { cn } from '@/lib/utils'

interface ImageViewerModalProps {
  customer_part_number: string
  isOpen: boolean
  onClose: () => void
  initial_image_index?: number
}

interface CombinedImage {
  id: string
  type: 'master' | 'fai'
  url: string
  name: string
  description?: string
  metadata?: any
  isFavorite?: boolean
}

export function ImageViewerModal({ 
  customer_part_number, 
  isOpen, 
  onClose, 
  initial_image_index = 0 
}: ImageViewerModalProps) {
  const { getImagesForPart, isLoading, error } = useFAI()
  const [imageData, setImageData] = useState<ImageViewerData | null>(null)
  const [combinedImages, setCombinedImages] = useState<CombinedImage[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showFullScreen, setShowFullScreen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Load images when modal opens
  useEffect(() => {
    if (isOpen && customer_part_number) {
      loadImages()
    }
  }, [isOpen, customer_part_number])

  // Set initial image index
  useEffect(() => {
    if (combinedImages.length > 0) {
      setCurrentImageIndex(Math.min(initial_image_index, combinedImages.length - 1))
    }
  }, [combinedImages, initial_image_index])

  const loadImages = async () => {
    try {
      const response = await getImagesForPart(customer_part_number)
      setImageData(response.images)
      
      // Combine master and FAI images
      const combined: CombinedImage[] = []
      
      // Add master images first (primary first)
      if (response.images.master_images) {
        response.images.master_images.forEach((img: MasterImage) => {
          combined.push({
            id: img.id,
            type: 'master',
            url: img.image_url,
            name: img.image_name,
            description: img.description || img.view_angle,
            metadata: {
              isPrimary: img.is_primary,
              uploadDate: img.upload_date,
              dimensions: `${img.width}×${img.height}`,
              format: img.image_format,
              size: img.file_size
            },
            isFavorite: img.is_primary
          })
        })
      }
      
      // Add FAI images
      if (response.images.fai_images) {
        response.images.fai_images.forEach((img: FAIImage) => {
          combined.push({
            id: img.id,
            type: 'fai',
            url: img.image_url,
            name: img.image_name,
            description: `From FAI Document`,
            metadata: {
              extractionOrder: img.extraction_order,
              extractedAt: img.extracted_at,
              dimensions: `${img.width}×${img.height}`,
              format: img.image_format,
              size: img.file_size,
              source: img.metadata?.original_name
            }
          })
        })
      }
      
      setCombinedImages(combined)
    } catch (error) {
      console.error('Failed to load images:', error)
    }
  }

  const handlePrevious = useCallback(() => {
    setCurrentImageIndex(prev => prev > 0 ? prev - 1 : combinedImages.length - 1)
    resetZoom()
  }, [combinedImages.length])

  const handleNext = useCallback(() => {
    setCurrentImageIndex(prev => prev < combinedImages.length - 1 ? prev + 1 : 0)
    resetZoom()
  }, [combinedImages.length])

  const resetZoom = () => {
    setZoomLevel(1)
    setImagePosition({ x: 0, y: 0 })
  }

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.5, 5))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.5, 0.5))
  }

  const handleDownload = async () => {
    if (combinedImages[currentImageIndex]) {
      const image = combinedImages[currentImageIndex]
      try {
        const response = await fetch(image.url)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = image.name
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } catch (error) {
        console.error('Failed to download image:', error)
      }
    }
  }

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          handlePrevious()
          break
        case 'ArrowRight':
          handleNext()
          break
        case 'Escape':
          if (showFullScreen) {
            setShowFullScreen(false)
          } else {
            onClose()
          }
          break
        case '+':
        case '=':
          handleZoomIn()
          break
        case '-':
          handleZoomOut()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, showFullScreen, handlePrevious, handleNext, onClose])

  // Mouse drag handling for zoomed images
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const currentImage = combinedImages[currentImageIndex]

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold">
                FAI & Master Images - {customer_part_number}
              </DialogTitle>
              <p className="text-sm text-gray-600">
                {imageData ? `${imageData.total_images} images available` : 'Loading...'}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading images...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-2">Failed to load images</p>
              <p className="text-sm text-gray-500">{error}</p>
              <Button variant="outline" onClick={loadImages} className="mt-4">
                Try Again
              </Button>
            </div>
          </div>
        ) : combinedImages.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No images available</p>
              <p className="text-sm text-gray-400">Upload FAI documents or Master Images to view them here</p>
            </div>
          </div>
        ) : (
          <div className="flex h-full">
            {/* Thumbnail Sidebar */}
            <div className="w-64 border-r bg-gray-50 overflow-y-auto">
              <div className="p-4">
                <h4 className="font-medium mb-3 text-sm text-gray-700">Images ({combinedImages.length})</h4>
                <div className="space-y-2">
                  {combinedImages.map((image, index) => (
                    <Card 
                      key={image.id}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-blue-50",
                        index === currentImageIndex ? "ring-2 ring-blue-500 bg-blue-50" : ""
                      )}
                      onClick={() => {
                        setCurrentImageIndex(index)
                        resetZoom()
                      }}
                    >
                      <CardContent className="p-2">
                        <div className="flex items-center space-x-2">
                          <img 
                            src={image.url} 
                            alt={image.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-1">
                              {image.type === 'master' ? (
                                <Star className={cn(
                                  "h-3 w-3",
                                  image.isFavorite ? "text-yellow-500 fill-current" : "text-gray-400"
                                )} />
                              ) : (
                                <FileText className="h-3 w-3 text-blue-500" />
                              )}
                              <Badge variant={image.type === 'master' ? 'default' : 'secondary'} className="text-xs">
                                {image.type === 'master' ? 'Master' : 'FAI'}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 truncate">{image.name}</p>
                            {image.description && (
                              <p className="text-xs text-gray-500 truncate">{image.description}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Image Display */}
            <div className="flex-1 flex flex-col">
              {/* Image Controls */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={handlePrevious} disabled={combinedImages.length <= 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-600">
                      {currentImageIndex + 1} of {combinedImages.length}
                    </span>
                    <Button variant="outline" size="sm" onClick={handleNext} disabled={combinedImages.length <= 1}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoomLevel <= 0.5}>
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-600 min-w-[3rem] text-center">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoomLevel >= 5}>
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowFullScreen(true)}>
                      Fullscreen
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Image Display Area */}
              <div className="flex-1 relative overflow-hidden bg-gray-100">
                {currentImage && (
                  <div 
                    className="w-full h-full flex items-center justify-center cursor-move"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    <img
                      src={currentImage.url}
                      alt={currentImage.name}
                      className="max-w-none select-none"
                      style={{
                        transform: `scale(${zoomLevel}) translate(${imagePosition.x / zoomLevel}px, ${imagePosition.y / zoomLevel}px)`,
                        transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                      }}
                      onDoubleClick={() => {
                        if (zoomLevel === 1) {
                          setZoomLevel(2)
                        } else {
                          resetZoom()
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Image Info */}
              {currentImage && (
                <div className="p-4 border-t bg-gray-50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <p className="font-medium truncate">{currentImage.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <p className="font-medium">{currentImage.type === 'master' ? 'Master Image' : 'FAI Image'}</p>
                    </div>
                    {currentImage.metadata?.dimensions && (
                      <div>
                        <span className="text-gray-500">Dimensions:</span>
                        <p className="font-medium">{currentImage.metadata.dimensions}</p>
                      </div>
                    )}
                    {currentImage.metadata?.size && (
                      <div>
                        <span className="text-gray-500">Size:</span>
                        <p className="font-medium">{formatFileSize(currentImage.metadata.size)}</p>
                      </div>
                    )}
                  </div>
                  {currentImage.description && (
                    <div className="mt-2">
                      <span className="text-gray-500 text-sm">Description:</span>
                      <p className="text-sm">{currentImage.description}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fullscreen Modal */}
        {showFullScreen && currentImage && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
            <div className="relative w-full h-full">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
                onClick={() => setShowFullScreen(false)}
              >
                <X className="h-6 w-6" />
              </Button>
              
              <div className="w-full h-full flex items-center justify-center p-8">
                <img
                  src={currentImage.url}
                  alt={currentImage.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              {/* Fullscreen Navigation */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                  onClick={handlePrevious}
                  disabled={combinedImages.length <= 1}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <span className="text-white">
                  {currentImageIndex + 1} / {combinedImages.length}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                  onClick={handleNext}
                  disabled={combinedImages.length <= 1}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}