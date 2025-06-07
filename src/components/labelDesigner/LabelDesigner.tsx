import React, { useRef, useEffect, useState, useCallback } from 'react'
import * as fabric from 'fabric'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Type, 
  Square, 
  Circle, 
  Minus, 
  Barcode, 
  QrCode,
  Image,
  Save,
  FolderOpen,
  Printer,
  Undo,
  Redo,
  Trash2,
  Copy,
  Download,
  ZoomIn,
  ZoomOut,
  Move,
  MousePointer
} from 'lucide-react'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { LABEL_SIZE_PRESETS, DYNAMIC_FIELDS, type LabelSize } from '@/types/labelDesigner'
import { toast } from 'sonner'
import JsBarcode from 'jsbarcode'
import QRCode from 'qrcode'

interface LabelDesignerProps {
  initialTemplate?: any
  onSave?: (templateData: any) => void
  onPrint?: (zplCode: string) => void
}

export function LabelDesigner({ 
  initialTemplate, 
  onSave, 
  onPrint 
}: LabelDesignerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null)
  const [selectedTool, setSelectedTool] = useState<string>('select')
  const [labelSize, setLabelSize] = useState<LabelSize>({
    width: 4,
    height: 6,
    unit: 'inch'
  })
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null)
  const [canvasHistory, setCanvasHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [zoom, setZoom] = useState(1)
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [strokeColor, setStrokeColor] = useState('#000000')
  const [fillColor, setFillColor] = useState('transparent')
  const [fontSize, setFontSize] = useState(20)
  const [fontFamily, setFontFamily] = useState('Arial')
  const [fontWeight, setFontWeight] = useState('normal')
  const [fontStyle, setFontStyle] = useState('normal')
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left')

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      backgroundColor: 'white',
      selection: true,
      preserveObjectStacking: true,
    })

    // Set canvas size based on label dimensions (convert to pixels at 203 DPI for Zebra printers)
    const dpi = 203 // Standard Zebra printer DPI
    const pixelWidth = labelSize.unit === 'inch' 
      ? labelSize.width * dpi 
      : (labelSize.width / 25.4) * dpi
    const pixelHeight = labelSize.unit === 'inch' 
      ? labelSize.height * dpi 
      : (labelSize.height / 25.4) * dpi

    fabricCanvas.setDimensions({
      width: pixelWidth,
      height: pixelHeight
    })

    // Add grid for alignment help
    const gridSize = 20
    for (let i = 0; i < pixelWidth / gridSize; i++) {
      fabricCanvas.add(new fabric.Line([i * gridSize, 0, i * gridSize, pixelHeight], {
        stroke: '#f0f0f0',
        selectable: false,
        evented: false
      }))
    }
    for (let i = 0; i < pixelHeight / gridSize; i++) {
      fabricCanvas.add(new fabric.Line([0, i * gridSize, pixelWidth, i * gridSize], {
        stroke: '#f0f0f0',
        selectable: false,
        evented: false
      }))
    }

    // Selection events
    fabricCanvas.on('selection:created', (e) => {
      setSelectedObject(e.selected?.[0] || null)
    })
    fabricCanvas.on('selection:updated', (e) => {
      setSelectedObject(e.selected?.[0] || null)
    })
    fabricCanvas.on('selection:cleared', () => {
      setSelectedObject(null)
    })

    // History tracking
    fabricCanvas.on('object:added', () => saveHistory(fabricCanvas))
    fabricCanvas.on('object:modified', () => saveHistory(fabricCanvas))
    fabricCanvas.on('object:removed', () => saveHistory(fabricCanvas))

    setCanvas(fabricCanvas)

    // Load initial template if provided
    if (initialTemplate) {
      fabricCanvas.loadFromJSON(initialTemplate, () => {
        fabricCanvas.renderAll()
      })
    }

    return () => {
      fabricCanvas.dispose()
    }
  }, [labelSize])

  // Save canvas state to history
  const saveHistory = useCallback((canvas: fabric.Canvas) => {
    const json = JSON.stringify(canvas.toJSON())
    setCanvasHistory(prev => {
      const newHistory = [...prev.slice(0, historyIndex + 1), json]
      setHistoryIndex(newHistory.length - 1)
      return newHistory
    })
  }, [historyIndex])

  // Tool handlers
  const addText = useCallback(() => {
    if (!canvas) return
    const text = new fabric.IText('Label Text', {
      left: 100,
      top: 100,
      fontSize: fontSize,
      fontFamily: fontFamily,
      fontWeight: fontWeight,
      fontStyle: fontStyle,
      textAlign: textAlign,
      fill: strokeColor
    })
    canvas.add(text)
    canvas.setActiveObject(text)
    canvas.renderAll()
  }, [canvas, fontSize, fontFamily, fontWeight, fontStyle, textAlign, strokeColor])

  const addDynamicField = useCallback((field: typeof DYNAMIC_FIELDS[0]) => {
    if (!canvas) return
    const text = new fabric.IText(`{{${field.key}}}`, {
      left: 100,
      top: 100,
      fontSize: 20,
      fontFamily: 'Arial',
      fill: '#0066cc',
      data: { isDynamic: true, field: field.key }
    })
    canvas.add(text)
    canvas.setActiveObject(text)
    canvas.renderAll()
  }, [canvas])

  const addRectangle = useCallback(() => {
    if (!canvas) return
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 100,
      height: 60,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth: strokeWidth,
    })
    canvas.add(rect)
    canvas.setActiveObject(rect)
    canvas.renderAll()
  }, [canvas, fillColor, strokeColor, strokeWidth])

  const addLine = useCallback(() => {
    if (!canvas) return
    const line = new fabric.Line([50, 50, 200, 50], {
      stroke: strokeColor,
      strokeWidth: strokeWidth,
    })
    canvas.add(line)
    canvas.setActiveObject(line)
    canvas.renderAll()
  }, [canvas, strokeColor, strokeWidth])

  const addBarcode = useCallback(async () => {
    if (!canvas) return
    
    // Create a temporary canvas for barcode
    const barcodeCanvas = document.createElement('canvas')
    JsBarcode(barcodeCanvas, '123456789012', {
      format: 'CODE128',
      width: 2,
      height: 50,
      displayValue: true
    })

    // Convert to fabric image
    fabric.Image.fromURL(barcodeCanvas.toDataURL(), (img) => {
      img.set({
        left: 100,
        top: 100,
        data: { isBarcode: true, value: '123456789012', format: 'CODE128' }
      })
      canvas.add(img)
      canvas.setActiveObject(img)
      canvas.renderAll()
    })
  }, [canvas])

  const addQRCode = useCallback(async () => {
    if (!canvas) return
    
    try {
      const qrDataUrl = await QRCode.toDataURL('https://example.com', {
        width: 100,
        margin: 0
      })
      
      fabric.Image.fromURL(qrDataUrl, (img) => {
        img.set({
          left: 100,
          top: 100,
          data: { isQRCode: true, value: 'https://example.com' }
        })
        canvas.add(img)
        canvas.setActiveObject(img)
        canvas.renderAll()
      })
    } catch (error) {
      toast.error('Failed to create QR code')
    }
  }, [canvas])

  const deleteSelected = useCallback(() => {
    if (!canvas || !selectedObject) return
    canvas.remove(selectedObject)
    canvas.renderAll()
  }, [canvas, selectedObject])

  const duplicateSelected = useCallback(() => {
    if (!canvas || !selectedObject) return
    selectedObject.clone((cloned: fabric.Object) => {
      cloned.set({
        left: (selectedObject.left || 0) + 10,
        top: (selectedObject.top || 0) + 10,
      })
      canvas.add(cloned)
      canvas.setActiveObject(cloned)
      canvas.renderAll()
    })
  }, [canvas, selectedObject])

  const undo = useCallback(() => {
    if (!canvas || historyIndex <= 0) return
    const newIndex = historyIndex - 1
    canvas.loadFromJSON(canvasHistory[newIndex], () => {
      canvas.renderAll()
      setHistoryIndex(newIndex)
    })
  }, [canvas, historyIndex, canvasHistory])

  const redo = useCallback(() => {
    if (!canvas || historyIndex >= canvasHistory.length - 1) return
    const newIndex = historyIndex + 1
    canvas.loadFromJSON(canvasHistory[newIndex], () => {
      canvas.renderAll()
      setHistoryIndex(newIndex)
    })
  }, [canvas, historyIndex, canvasHistory])

  const handleZoom = useCallback((delta: number) => {
    if (!canvas) return
    const newZoom = Math.max(0.1, Math.min(3, zoom + delta))
    canvas.setZoom(newZoom)
    setZoom(newZoom)
    canvas.renderAll()
  }, [canvas, zoom])

  const exportTemplate = useCallback(() => {
    if (!canvas) return
    const templateData = {
      canvas_data: JSON.stringify(canvas.toJSON()),
      label_size: labelSize,
      timestamp: new Date().toISOString()
    }
    onSave?.(templateData)
    toast.success('Template saved successfully')
  }, [canvas, labelSize, onSave])

  const generateZPL = useCallback(() => {
    if (!canvas) return
    // This is a simplified ZPL generation - would need full implementation
    const zpl = `^XA
^FO50,50^A0N,30,30^FDLabel Designer Demo^FS
^XZ`
    onPrint?.(zpl)
    toast.success('ZPL generated')
  }, [canvas, onPrint])

  // Update selected object properties
  const updateSelectedObject = useCallback((property: string, value: any) => {
    if (!canvas || !selectedObject) return
    selectedObject.set(property, value)
    canvas.renderAll()
    saveHistory(canvas)
  }, [canvas, selectedObject, saveHistory])

  // Add circle
  const addCircle = useCallback(() => {
    if (!canvas) return
    const circle = new fabric.Circle({
      left: 100,
      top: 100,
      radius: 30,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth: strokeWidth,
    })
    canvas.add(circle)
    canvas.setActiveObject(circle)
    canvas.renderAll()
  }, [canvas, fillColor, strokeColor, strokeWidth])

  // Update object properties when toolbar values change
  useEffect(() => {
    if (selectedObject) {
      if (selectedObject.type === 'i-text') {
        updateSelectedObject('fontSize', fontSize)
        updateSelectedObject('fontFamily', fontFamily)
        updateSelectedObject('fontWeight', fontWeight)
        updateSelectedObject('fontStyle', fontStyle)
        updateSelectedObject('textAlign', textAlign)
        updateSelectedObject('fill', strokeColor)
      } else if (selectedObject.type === 'rect' || selectedObject.type === 'circle') {
        updateSelectedObject('strokeWidth', strokeWidth)
        updateSelectedObject('stroke', strokeColor)
        updateSelectedObject('fill', fillColor)
      } else if (selectedObject.type === 'line') {
        updateSelectedObject('strokeWidth', strokeWidth)
        updateSelectedObject('stroke', strokeColor)
      }
    }
  }, [selectedObject, fontSize, fontFamily, fontWeight, fontStyle, textAlign, strokeColor, strokeWidth, fillColor, updateSelectedObject])

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <Card className="p-2 mb-2">
        <div className="space-y-2">
          {/* First Row - Main Tools */}
          <div className="flex items-center gap-2 flex-wrap">
          {/* Tools */}
          <div className="flex items-center gap-1 border-r pr-2">
            <Button
              size="sm"
              variant={selectedTool === 'select' ? 'default' : 'outline'}
              onClick={() => setSelectedTool('select')}
              title="Select"
            >
              <MousePointer className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={selectedTool === 'pan' ? 'default' : 'outline'}
              onClick={() => setSelectedTool('pan')}
              title="Pan"
            >
              <Move className="h-4 w-4" />
            </Button>
          </div>

          {/* Add Elements */}
          <div className="flex items-center gap-1 border-r pr-2">
            <Button size="sm" variant="outline" onClick={addText} title="Add Text">
              <Type className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={addRectangle} title="Add Rectangle">
              <Square className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={addCircle} title="Add Circle">
              <Circle className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={addLine} title="Add Line">
              <Minus className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={addBarcode} title="Add Barcode">
              <Barcode className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={addQRCode} title="Add QR Code">
              <QrCode className="h-4 w-4" />
            </Button>
          </div>

          {/* Edit Actions */}
          <div className="flex items-center gap-1 border-r pr-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={undo} 
              disabled={historyIndex <= 0}
              title="Undo"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={redo}
              disabled={historyIndex >= canvasHistory.length - 1}
              title="Redo"
            >
              <Redo className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={duplicateSelected}
              disabled={!selectedObject}
              title="Duplicate"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={deleteSelected}
              disabled={!selectedObject}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-1 border-r pr-2">
            <Button size="sm" variant="outline" onClick={() => handleZoom(-0.1)}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button size="sm" variant="outline" onClick={() => handleZoom(0.1)}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 ml-auto">
            <Button size="sm" variant="outline" onClick={exportTemplate}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={generateZPL}>
              <Download className="h-4 w-4 mr-1" />
              Export ZPL
            </Button>
            <Button size="sm" onClick={() => toast.info('Print functionality coming soon')}>
              <Printer className="h-4 w-4 mr-1" />
              Print
            </Button>
          </div>
          </div>
          
          {/* Second Row - Style Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Stroke Width */}
            <div className="flex items-center gap-1">
              <Label className="text-xs">Width:</Label>
              <Input
                type="number"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="w-16 h-7 text-xs"
                min="1"
                max="20"
              />
            </div>
            
            {/* Stroke Color */}
            <div className="flex items-center gap-1">
              <Label className="text-xs">Stroke:</Label>
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
                className="w-8 h-7 cursor-pointer"
              />
            </div>
            
            {/* Fill Color */}
            <div className="flex items-center gap-1">
              <Label className="text-xs">Fill:</Label>
              <input
                type="color"
                value={fillColor === 'transparent' ? '#ffffff' : fillColor}
                onChange={(e) => setFillColor(e.target.value)}
                className="w-8 h-7 cursor-pointer"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setFillColor('transparent')}
                className="h-7 px-2 text-xs"
              >
                Clear
              </Button>
            </div>
            
            {/* Font Size */}
            <div className="flex items-center gap-1 border-l pl-2">
              <Label className="text-xs">Font:</Label>
              <Input
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-16 h-7 text-xs"
                min="8"
                max="72"
              />
            </div>
            
            {/* Font Family */}
            <Select value={fontFamily} onValueChange={setFontFamily}>
              <SelectTrigger className="w-24 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Arial">Arial</SelectItem>
                <SelectItem value="Helvetica">Helvetica</SelectItem>
                <SelectItem value="Times New Roman">Times</SelectItem>
                <SelectItem value="Courier New">Courier</SelectItem>
                <SelectItem value="Georgia">Georgia</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Font Style */}
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant={fontWeight === 'bold' ? 'default' : 'outline'}
                onClick={() => setFontWeight(fontWeight === 'bold' ? 'normal' : 'bold')}
                className="h-7 px-2"
              >
                <strong>B</strong>
              </Button>
              <Button
                size="sm"
                variant={fontStyle === 'italic' ? 'default' : 'outline'}
                onClick={() => setFontStyle(fontStyle === 'italic' ? 'normal' : 'italic')}
                className="h-7 px-2"
              >
                <em>I</em>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Designer Area */}
      <div className="flex-1 flex gap-2 min-h-0">
        {/* Canvas */}
        <Card className="flex-1 p-4 overflow-auto">
          <div className="inline-block border-2 border-dashed border-gray-300">
            <canvas ref={canvasRef} />
          </div>
        </Card>

        {/* Properties Panel */}
        <Card className="w-64 p-4 overflow-y-auto">
          <h3 className="font-medium mb-3">Properties</h3>
          
          {/* Label Size */}
          <div className="mb-4">
            <Label className="text-xs">Label Size</Label>
            <Select
              value={`${labelSize.width}x${labelSize.height}${labelSize.unit}`}
              onValueChange={(value) => {
                const preset = LABEL_SIZE_PRESETS.find(p => 
                  `${p.width}x${p.height}${p.unit}` === value
                )
                if (preset) {
                  setLabelSize({ width: preset.width, height: preset.height, unit: preset.unit })
                }
              }}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LABEL_SIZE_PRESETS.map(preset => (
                  <SelectItem 
                    key={preset.name} 
                    value={`${preset.width}x${preset.height}${preset.unit}`}
                  >
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic Fields */}
          <div className="mb-4">
            <Label className="text-xs mb-2">Dynamic Fields</Label>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {DYNAMIC_FIELDS.map(field => (
                <Button
                  key={field.key}
                  size="sm"
                  variant="outline"
                  className="w-full justify-start text-xs"
                  onClick={() => addDynamicField(field)}
                >
                  <Type className="h-3 w-3 mr-1" />
                  {field.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Selected Object Properties */}
          {selectedObject && (
            <div className="mt-4 pt-4 border-t">
              <Label className="text-xs mb-2">Selected: {selectedObject.type}</Label>
              <div className="space-y-2">
                {/* Position */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">X</Label>
                    <Input
                      type="number"
                      className="h-7 text-xs"
                      value={Math.round(selectedObject.left || 0)}
                      onChange={(e) => {
                        selectedObject.set('left', parseInt(e.target.value))
                        canvas?.renderAll()
                      }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Y</Label>
                    <Input
                      type="number"
                      className="h-7 text-xs"
                      value={Math.round(selectedObject.top || 0)}
                      onChange={(e) => {
                        selectedObject.set('top', parseInt(e.target.value))
                        canvas?.renderAll()
                      }}
                    />
                  </div>
                </div>
                
                {/* Size for rectangles and circles */}
                {(selectedObject.type === 'rect' || selectedObject.type === 'circle') && (
                  <div className="grid grid-cols-2 gap-2">
                    {selectedObject.type === 'rect' ? (
                      <>
                        <div>
                          <Label className="text-xs">Width</Label>
                          <Input
                            type="number"
                            className="h-7 text-xs"
                            value={Math.round((selectedObject as fabric.Rect).width || 0)}
                            onChange={(e) => {
                              (selectedObject as fabric.Rect).set('width', parseInt(e.target.value))
                              canvas?.renderAll()
                            }}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Height</Label>
                          <Input
                            type="number"
                            className="h-7 text-xs"
                            value={Math.round((selectedObject as fabric.Rect).height || 0)}
                            onChange={(e) => {
                              (selectedObject as fabric.Rect).set('height', parseInt(e.target.value))
                              canvas?.renderAll()
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="col-span-2">
                        <Label className="text-xs">Radius</Label>
                        <Input
                          type="number"
                          className="h-7 text-xs"
                          value={Math.round((selectedObject as fabric.Circle).radius || 0)}
                          onChange={(e) => {
                            (selectedObject as fabric.Circle).set('radius', parseInt(e.target.value))
                            canvas?.renderAll()
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
                
                {/* Rotation */}
                <div>
                  <Label className="text-xs">Rotation</Label>
                  <Input
                    type="number"
                    className="h-7 text-xs"
                    value={Math.round(selectedObject.angle || 0)}
                    onChange={(e) => {
                      selectedObject.set('angle', parseInt(e.target.value))
                      canvas?.renderAll()
                    }}
                    min="0"
                    max="360"
                  />
                </div>
                
                {/* Text specific properties */}
                {selectedObject.type === 'i-text' && (
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">Text Content</Label>
                      <Input
                        className="h-7 text-xs"
                        value={(selectedObject as fabric.IText).text}
                        onChange={(e) => {
                          (selectedObject as fabric.IText).set('text', e.target.value)
                          canvas?.renderAll()
                        }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Opacity */}
                <div>
                  <Label className="text-xs">Opacity</Label>
                  <Input
                    type="range"
                    className="h-7"
                    min="0"
                    max="1"
                    step="0.1"
                    value={selectedObject.opacity || 1}
                    onChange={(e) => {
                      selectedObject.set('opacity', parseFloat(e.target.value))
                      canvas?.renderAll()
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}