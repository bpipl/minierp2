// Label Generation Utilities for CT Number Printing
// This module provides ZPL generation and label template management

import { OrderLineWithDetails } from '@/hooks/useOrders'
import { formatCTForDisplay } from './ctNumberValidation'

export interface LabelTemplate {
  id: string
  name: string
  width: number  // in millimeters
  height: number // in millimeters
  dpi: number    // dots per inch (still needed for ZPL calculations)
}

export interface PrinterConfig {
  id: string
  name: string
  ipAddress: string
  port: number
  model: string
  location: string
}

// Available label templates (dimensions in millimeters)
export const LABEL_TEMPLATES: Record<string, LabelTemplate> = {
  'default-ct-label': {
    id: 'default-ct-label',
    name: 'Default CT Label (102x152mm)',
    width: 102,  // ~4 inches
    height: 152, // ~6 inches
    dpi: 203
  },
  'compact-ct-label': {
    id: 'compact-ct-label', 
    name: 'Compact CT Label (51x25mm)',
    width: 51,   // ~2 inches
    height: 25,  // ~1 inch
    dpi: 203
  },
  'hp-ct-label': {
    id: 'hp-ct-label',
    name: 'HP CT Label (102x152mm)',
    width: 102,  // ~4 inches
    height: 152, // ~6 inches
    dpi: 203
  }
}

// Generate ZPL for CT labels with dynamic data
export async function generateCTLabelsZPL(
  ctNumbers: string[],
  orderLine: OrderLineWithDetails,
  templateId: string,
  quantity: number = 1
): Promise<string> {
  const template = LABEL_TEMPLATES[templateId]
  if (!template) {
    throw new Error(`Unknown label template: ${templateId}`)
  }

  // Take only the requested quantity of CT numbers
  const ctsToprint = ctNumbers.slice(0, quantity)
  
  let zplContent = ''

  // Generate ZPL for each CT number
  for (const ctNumber of ctsToprint) {
    zplContent += generateSingleCTLabelZPL(ctNumber, orderLine, template)
  }

  return zplContent
}

// Generate ZPL for a single CT label
function generateSingleCTLabelZPL(
  ctNumber: string,
  orderLine: OrderLineWithDetails,
  template: LabelTemplate
): string {
  const currentDate = new Date().toLocaleDateString('en-GB') // DD/MM/YYYY format
  const formattedCT = formatCTForDisplay(ctNumber)
  
  // Calculate positions based on template size (convert mm to dots)
  // 1 inch = 25.4 mm, so dots = (mm / 25.4) * DPI
  const width = Math.floor((template.width / 25.4) * template.dpi)
  const height = Math.floor((template.height / 25.4) * template.dpi)
  
  switch (template.id) {
    case 'default-ct-label':
      return generateDefaultCTLabelZPL(formattedCT, orderLine, width, height, currentDate)
    
    case 'compact-ct-label':
      return generateCompactCTLabelZPL(formattedCT, orderLine, width, height, currentDate)
    
    case 'hp-ct-label':
      return generateHPCTLabelZPL(formattedCT, orderLine, width, height, currentDate)
    
    default:
      return generateDefaultCTLabelZPL(formattedCT, orderLine, width, height, currentDate)
  }
}

// Default 4"x6" CT label template
function generateDefaultCTLabelZPL(
  ctNumber: string,
  orderLine: OrderLineWithDetails,
  _width: number,
  _height: number,
  currentDate: string
): string {
  return `
^XA
^LH0,0
^FO50,50^A0N,60,60^FDOrder: ${orderLine.uid}^FS
^FO50,130^A0N,40,40^FDPart: ${orderLine.customer_part_number}^FS
^FO50,180^A0N,30,30^FD${orderLine.bpi_description?.substring(0, 40) || 'No Description'}^FS
^FO50,230^A0N,80,80^FDCT: ${ctNumber}^FS
^FO50,330^BQ N,2,6^FDMA,${ctNumber}^FS
^FO300,330^A0N,25,25^FDQty: ${orderLine.order_quantity}^FS
^FO300,360^A0N,25,25^FDDate: ${currentDate}^FS
^FO50,480^A0N,20,20^FDCustomer: ${orderLine.customer?.name || 'Unknown'}^FS
^XZ
`
}

// Compact 2"x1" CT label template
function generateCompactCTLabelZPL(
  ctNumber: string,
  orderLine: OrderLineWithDetails,
  _width: number,
  _height: number,
  _currentDate: string
): string {
  return `
^XA
^LH0,0
^FO10,10^A0N,30,30^FD${orderLine.uid}^FS
^FO10,50^A0N,40,40^FD${ctNumber}^FS
^FO200,10^BQ N,2,3^FDMA,${ctNumber}^FS
^FO10,120^A0N,15,15^FD${orderLine.customer_part_number?.substring(0, 15) || ''}^FS
^XZ
`
}

// HP-specific 4"x6" CT label template
function generateHPCTLabelZPL(
  ctNumber: string,
  orderLine: OrderLineWithDetails,
  _width: number,
  _height: number,
  currentDate: string
): string {
  return `
^XA
^LH0,0
^FO50,30^A0N,40,40^FDHP LAPTOP PARTS^FS
^FO50,80^A0N,60,60^FDOrder: ${orderLine.uid}^FS
^FO50,150^A0N,35,35^FDPart: ${orderLine.customer_part_number}^FS
^FO50,190^A0N,25,25^FD${orderLine.bpi_description?.substring(0, 45) || 'No Description'}^FS
^FO50,240^A0N,80,80^FDCT: ${ctNumber}^FS
^FO50,340^BQ N,2,6^FDMA,${ctNumber}^FS
^FO300,340^A0N,25,25^FDQty: ${orderLine.order_quantity}^FS
^FO300,370^A0N,25,25^FDDate: ${currentDate}^FS
^FO300,400^A0N,20,20^FDHP Customer^FS
^FO50,480^A0N,20,20^FDHandel with Care - ESD Sensitive^FS
^XZ
`
}

// Download ZPL file to user's computer
export function downloadZPLFile(zplContent: string, filename: string): void {
  const blob = new Blob([zplContent], { type: 'text/plain' })
  const url = window.URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  window.URL.revokeObjectURL(url)
  
  console.log('📁 ZPL file downloaded:', filename)
}

// Send ZPL to network printer (to be implemented based on your alternative NPS approach)
export async function sendToPrinter(
  _zplContent: string,
  printerId: string,
  npsUrl?: string
): Promise<boolean> {
  try {
    console.log('🖨️ Sending to printer:', { printerId, npsUrl })
    
    // TODO: Implement actual printer communication
    // This will be implemented based on your alternative NPS approach
    
    // For now, just simulate the print job
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log('✅ Print job sent successfully')
    return true
    
  } catch (error) {
    console.error('❌ Failed to send to printer:', error)
    return false
  }
}

// Validate label template configuration
export function validateTemplate(templateId: string): boolean {
  return templateId in LABEL_TEMPLATES
}

// Get available templates for dropdown
export function getAvailableTemplates(): Array<{id: string, name: string}> {
  return Object.values(LABEL_TEMPLATES).map(template => ({
    id: template.id,
    name: template.name
  }))
}

// Generate Labelary.com preview URL
export function generateLabelaryPreviewUrl(
  zplContent: string,
  template: LabelTemplate
): string {
  const density = template.dpi === 203 ? '8' : '6' // 203 DPI = 8 dots/mm, 152 DPI = 6 dots/mm
  // Convert mm to inches for Labelary (Labelary expects inches)
  const widthInches = (template.width / 25.4).toFixed(1)
  const heightInches = (template.height / 25.4).toFixed(1)
  
  return `http://labelary.com/viewer.html?density=${density}&width=${widthInches}&height=${heightInches}&zpl=${encodeURIComponent(zplContent)}`
}