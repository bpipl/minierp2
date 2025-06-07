// Label Designer Types

export interface LabelSize {
  width: number
  height: number
  unit: 'mm' | 'inch'
}

export interface LabelTemplate {
  id: string
  name: string
  description?: string
  category: 'ct_label' | 'shipping' | 'internal' | 'generic' | 'custom'
  customer_id?: string // For customer-specific templates
  canvas_data: string // JSON stringified Fabric.js canvas
  label_size: LabelSize
  created_at: string
  created_by: string
  updated_at: string
  is_default?: boolean
  permissions?: {
    roles: string[]
    users: string[]
  }
}

export interface DynamicField {
  key: string
  label: string
  category: 'order' | 'customer' | 'system' | 'custom'
  format?: string // Date format, number format, etc.
  prefix?: string
  suffix?: string
  defaultValue?: string
}

export interface PrinterConfig {
  id: string
  name: string
  ip_address: string
  port: number
  location: 'SB' | 'NP'
  model?: string
  is_default?: boolean
  is_active: boolean
  capabilities?: {
    max_width: number
    max_height: number
    dpi: number
    color: boolean
  }
}

export interface PrintJob {
  id: string
  template_id: string
  printer_id: string
  data: Record<string, any>
  zpl_content?: string
  status: 'pending' | 'printing' | 'completed' | 'failed'
  error_message?: string
  created_at: string
  created_by: string
}

export interface DesignElement {
  type: 'text' | 'barcode' | 'qrcode' | 'line' | 'rect' | 'circle' | 'image'
  id: string
  properties: Record<string, any>
  isDynamic?: boolean
  dynamicField?: string
}

// Available dynamic fields for label templates
export const DYNAMIC_FIELDS: DynamicField[] = [
  // Order Data
  { key: 'order_uid', label: 'Order UID', category: 'order' },
  { key: 'customer_part_number', label: 'Part Number', category: 'order' },
  { key: 'bpi_description', label: 'BPI Description', category: 'order' },
  { key: 'total_quantity', label: 'Total Quantity', category: 'order', prefix: 'QTY: ' },
  { key: 'ct_number', label: 'CT Number', category: 'order' },
  { key: 'po_number', label: 'PO Number', category: 'order', prefix: 'PO: ' },
  { key: 'order_date', label: 'Order Date', category: 'order', format: 'DD/MM/YY' },
  { key: 'eta_date', label: 'ETA Date', category: 'order', format: 'DD/MM/YY' },
  
  // Customer Data
  { key: 'customer_name', label: 'Customer Name', category: 'customer' },
  { key: 'customer_description', label: 'Customer Description', category: 'customer' },
  
  // System Data
  { key: 'print_date', label: 'Print Date', category: 'system', format: 'DD/MM/YY' },
  { key: 'print_time', label: 'Print Time', category: 'system', format: 'HH:mm' },
  { key: 'user_name', label: 'Printed By', category: 'system' },
  { key: 'location', label: 'Location', category: 'system' },
  { key: 'batch_number', label: 'Batch Number', category: 'system' },
]

// Common label size presets
export const LABEL_SIZE_PRESETS = [
  { name: '4x6 Shipping', width: 4, height: 6, unit: 'inch' as const },
  { name: '2x1 Part Label', width: 2, height: 1, unit: 'inch' as const },
  { name: '100x50mm', width: 100, height: 50, unit: 'mm' as const },
  { name: '50x25mm Small', width: 50, height: 25, unit: 'mm' as const },
  { name: 'Custom', width: 0, height: 0, unit: 'mm' as const },
]

// Quick print templates
export const QUICK_PRINT_TEMPLATES = [
  { id: 'hp-external', name: 'HP ORDER - EXTERNAL BOX', category: 'shipping' },
  { id: 'fragile', name: 'FRAGILE - HANDLE WITH CARE', category: 'generic' },
  { id: 'priority', name: 'PRIORITY SHIPMENT', category: 'shipping' },
  { id: 'qc-hold', name: 'QC HOLD - DO NOT SHIP', category: 'internal' },
  { id: 'inspection', name: 'PARTS INSPECTION REQUIRED', category: 'internal' },
  { id: 'motherboard', name: 'MOTHERBOARD - STATIC SENSITIVE', category: 'generic' },
  { id: 'return', name: 'RETURN TO VENDOR', category: 'internal' },
]