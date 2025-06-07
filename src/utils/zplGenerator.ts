import * as fabric from 'fabric'
import JsBarcode from 'jsbarcode'
import QRCode from 'qrcode'

interface ZPLOptions {
  dpi: number // Dots per inch (typically 203 or 300 for Zebra printers)
  labelWidth: number // in dots
  labelHeight: number // in dots
}

export class ZPLGenerator {
  private dpi: number
  private labelWidth: number
  private labelHeight: number
  private zplCommands: string[] = []

  constructor(options: ZPLOptions) {
    this.dpi = options.dpi
    this.labelWidth = options.labelWidth
    this.labelHeight = options.labelHeight
  }

  // Convert fabric canvas to ZPL
  async generateFromCanvas(canvas: fabric.Canvas, dynamicData?: Record<string, any>): Promise<string> {
    this.zplCommands = []
    
    // Start label
    this.addCommand('^XA') // Start format
    this.addCommand('^CI28') // UTF-8 encoding
    this.addCommand(`^PW${this.labelWidth}`) // Print width
    this.addCommand(`^LL${this.labelHeight}`) // Label length
    
    // Process each object on canvas
    const objects = canvas.getObjects()
    for (const obj of objects) {
      // Skip grid lines
      if (obj.stroke === '#f0f0f0') continue
      
      await this.processObject(obj, dynamicData)
    }
    
    // End label
    this.addCommand('^XZ') // End format
    
    return this.zplCommands.join('\n')
  }

  private async processObject(obj: fabric.Object, dynamicData?: Record<string, any>) {
    const x = Math.round(obj.left || 0)
    const y = Math.round(obj.top || 0)

    switch (obj.type) {
      case 'i-text':
      case 'text':
        await this.processText(obj as fabric.IText, x, y, dynamicData)
        break
      case 'rect':
        this.processRectangle(obj as fabric.Rect, x, y)
        break
      case 'line':
        this.processLine(obj as fabric.Line, x, y)
        break
      case 'circle':
        this.processCircle(obj as fabric.Circle, x, y)
        break
      case 'image':
        await this.processImage(obj as fabric.Image, x, y, dynamicData)
        break
    }
  }

  private async processText(text: fabric.IText, x: number, y: number, dynamicData?: Record<string, any>) {
    let content = text.text || ''
    
    // Replace dynamic fields with actual data
    if (text.data?.isDynamic && dynamicData) {
      const fieldKey = text.data.field
      const fieldValue = dynamicData[fieldKey] || `{{${fieldKey}}}`
      content = fieldValue.toString()
    }

    // Calculate font size (ZPL uses different scale)
    const fontSize = Math.round((text.fontSize || 20) * 1.5)
    
    // Determine rotation
    const rotation = this.getRotation(text.angle || 0)
    
    // Add field origin
    this.addCommand(`^FO${x},${y}`)
    
    // Add font command (A0 = default font, N = normal, rotation, height, width)
    this.addCommand(`^A0${rotation},${fontSize},${fontSize}`)
    
    // Add field data with proper escaping
    const escapedContent = this.escapeZPLText(content)
    this.addCommand(`^FD${escapedContent}^FS`)
  }

  private processRectangle(rect: fabric.Rect, x: number, y: number) {
    const width = Math.round(rect.width || 0)
    const height = Math.round(rect.height || 0)
    const strokeWidth = Math.round(rect.strokeWidth || 1)
    
    if (rect.fill && rect.fill !== 'transparent') {
      // Filled rectangle
      this.addCommand(`^FO${x},${y}`)
      this.addCommand(`^GB${width},${height},${strokeWidth},B^FS`)
    } else {
      // Outline rectangle
      this.addCommand(`^FO${x},${y}`)
      this.addCommand(`^GB${width},${height},${strokeWidth}^FS`)
    }
  }

  private processLine(line: fabric.Line, x: number, y: number) {
    const coords = line.points || [0, 0, 100, 0]
    const x1 = Math.round(coords[0])
    const y1 = Math.round(coords[1])
    const x2 = Math.round(coords[2])
    const y2 = Math.round(coords[3])
    const thickness = Math.round(line.strokeWidth || 1)
    
    if (y1 === y2) {
      // Horizontal line
      const length = Math.abs(x2 - x1)
      this.addCommand(`^FO${x + x1},${y + y1}`)
      this.addCommand(`^GB${length},${thickness},${thickness}^FS`)
    } else if (x1 === x2) {
      // Vertical line
      const length = Math.abs(y2 - y1)
      this.addCommand(`^FO${x + x1},${y + y1}`)
      this.addCommand(`^GB${thickness},${length},${thickness}^FS`)
    } else {
      // Diagonal line - approximate with graphic box
      this.addCommand(`^FO${x + x1},${y + y1}`)
      this.addCommand(`^GD${x2 - x1},${y2 - y1},${thickness},,R^FS`)
    }
  }

  private processCircle(circle: fabric.Circle, x: number, y: number) {
    const radius = Math.round(circle.radius || 0)
    const strokeWidth = Math.round(circle.strokeWidth || 1)
    
    // ZPL doesn't have native circle support, use graphic circle
    this.addCommand(`^FO${x},${y}`)
    this.addCommand(`^GC${radius * 2},${strokeWidth}^FS`)
  }

  private async processImage(image: fabric.Image, x: number, y: number, dynamicData?: Record<string, any>) {
    // Check if it's a barcode
    if (image.data?.isBarcode) {
      const value = dynamicData?.[image.data.value] || image.data.value || '123456789'
      const format = image.data.format || 'CODE128'
      
      this.addCommand(`^FO${x},${y}`)
      
      switch (format) {
        case 'CODE128':
          this.addCommand(`^BCN,${Math.round(image.height || 50)},Y,N,N`)
          this.addCommand(`^FD${value}^FS`)
          break
        case 'CODE39':
          this.addCommand(`^B3N,N,${Math.round(image.height || 50)},Y,N`)
          this.addCommand(`^FD${value}^FS`)
          break
      }
    }
    // Check if it's a QR code
    else if (image.data?.isQRCode) {
      const value = dynamicData?.[image.data.value] || image.data.value || 'https://example.com'
      const size = Math.round((image.width || 100) / 25) // QR module size
      
      this.addCommand(`^FO${x},${y}`)
      this.addCommand(`^BQN,2,${size}`)
      this.addCommand(`^FD${value}^FS`)
    }
    // Regular image - would need to convert to ZPL graphics format
    else {
      // For now, add a placeholder
      this.addCommand(`^FO${x},${y}`)
      this.addCommand(`^GB100,100,2^FS`)
      this.addCommand(`^FO${x + 10},${y + 40}`)
      this.addCommand(`^A0N,20,20^FD[IMAGE]^FS`)
    }
  }

  private getRotation(angle: number): string {
    // Convert angle to ZPL rotation codes (N, R, I, B)
    const normalizedAngle = ((angle % 360) + 360) % 360
    if (normalizedAngle < 45 || normalizedAngle >= 315) return 'N' // Normal
    if (normalizedAngle >= 45 && normalizedAngle < 135) return 'R' // 90 degrees
    if (normalizedAngle >= 135 && normalizedAngle < 225) return 'I' // 180 degrees
    return 'B' // 270 degrees
  }

  private escapeZPLText(text: string): string {
    // Escape special ZPL characters
    return text
      .replace(/\^/g, '\\5E') // Caret
      .replace(/~/g, '\\7E') // Tilde
      .replace(/>/g, '\\3E') // Greater than
      .replace(/</g, '\\3C') // Less than
      .replace(/&/g, '\\26') // Ampersand
  }

  private addCommand(command: string) {
    this.zplCommands.push(command)
  }

  // Utility to convert mm/inch to dots
  static convertToDots(value: number, unit: 'mm' | 'inch', dpi: number): number {
    if (unit === 'inch') {
      return Math.round(value * dpi)
    } else {
      // mm to inch: mm / 25.4
      return Math.round((value / 25.4) * dpi)
    }
  }

  // Preview ZPL using Labelary API
  static async previewZPL(zpl: string, width: number, height: number, dpi: number = 203): Promise<string> {
    try {
      const response = await fetch(`https://api.labelary.com/v1/printers/${dpi}dpi/labels/${width}x${height}/0/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: zpl,
      })

      if (!response.ok) {
        throw new Error('Failed to generate preview')
      }

      const blob = await response.blob()
      return URL.createObjectURL(blob)
    } catch (error) {
      console.error('Preview generation failed:', error)
      throw error
    }
  }
}