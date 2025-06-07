// CSV Template Generation and Download Utilities
// Provides downloadable CSV template with proper headers and sample data

export interface CSVTemplateColumn {
  field: string
  header: string
  example: string
  required: boolean
  type: 'text' | 'number' | 'date' | 'dropdown'
  validation?: string
}

// Template column definitions matching the requirements
export const CSV_TEMPLATE_COLUMNS: CSVTemplateColumn[] = [
  {
    field: 'customerName',
    header: 'Customer Name',
    example: 'HP',
    required: true,
    type: 'dropdown',
    validation: 'Must match existing customers'
  },
  {
    field: 'poNumber',
    header: 'Purchase Order (PO) Number',
    example: 'PO-2025-001',
    required: false,
    type: 'text',
    validation: 'Can be blank for pre-orders'
  },
  {
    field: 'poDate',
    header: 'PO Date / Order Date',
    example: '070125',
    required: false,
    type: 'date',
    validation: 'DDMMYY format, can be blank'
  },
  {
    field: 'customerPartNumber',
    header: "Customer's Part Number",
    example: 'L14365-001',
    required: true,
    type: 'text',
    validation: 'Key for matching, critical for PO updates'
  },
  {
    field: 'corePartNumber',
    header: 'Core Part Number',
    example: 'M08770-001',
    required: false,
    type: 'text',
    validation: 'Often unused but provided by customer'
  },
  {
    field: 'customerDescription',
    header: "Customer's Description (Short Text)",
    example: 'LCD Panel 14" FHD',
    required: false,
    type: 'text',
    validation: 'Customer part description'
  },
  {
    field: 'bpiDescription',
    header: 'BPI DSC (Internal Part Description)',
    example: 'Laptop 840 G10 LCD',
    required: false,
    type: 'text',
    validation: 'Internal shorthand description'
  },
  {
    field: 'productCategory',
    header: 'Product Category',
    example: 'LCD Panels',
    required: true,
    type: 'dropdown',
    validation: 'Must match predefined categories'
  },
  {
    field: 'orderQuantity',
    header: 'Order Quantity',
    example: '5',
    required: true,
    type: 'number',
    validation: 'Must be positive integer'
  },
  {
    field: 'pricePerUnit',
    header: 'Price (per unit)',
    example: '120.50',
    required: false,
    type: 'number',
    validation: 'Decimal, permission-controlled'
  },
  {
    field: 'leadTime',
    header: 'Lead Time',
    example: 'Ready Stock',
    required: false,
    type: 'text',
    validation: 'From RFQ (e.g., "5 days")'
  },
  {
    field: 'currentETA',
    header: 'Current ETA to Customer',
    example: '150125',
    required: false,
    type: 'date',
    validation: 'DDMMYY format'
  },
  {
    field: 'vid',
    header: 'VID (Vendor ID)',
    example: 'APEX',
    required: false,
    type: 'text',
    validation: 'Vendor short code, optional'
  },
  {
    field: 'msc',
    header: 'MSC (Master Shipping Carton)',
    example: 'MSC001',
    required: false,
    type: 'text',
    validation: '5-6 digits, per consignment'
  },
  {
    field: 'genericField1',
    header: 'Generic Field 1',
    example: 'Special handling',
    required: false,
    type: 'text',
    validation: 'Miscellaneous customer data'
  },
  {
    field: 'genericField2',
    header: 'Generic Field 2',
    example: 'Priority shipment',
    required: false,
    type: 'text',
    validation: 'Miscellaneous customer data'
  },
  {
    field: 'genericField3',
    header: 'Generic Field 3',
    example: 'Extra notes',
    required: false,
    type: 'text',
    validation: 'Miscellaneous customer data'
  }
]

// Sample data rows for the template
const SAMPLE_DATA_ROWS = [
  {
    customerName: 'HP',
    poNumber: 'PO-2025-001',
    poDate: '070125',
    customerPartNumber: 'L14365-001',
    corePartNumber: 'M08770-001',
    customerDescription: 'LCD Panel 14" FHD',
    bpiDescription: 'Laptop 840 G10 LCD',
    productCategory: 'LCD Panels',
    orderQuantity: '5',
    pricePerUnit: '120.50',
    leadTime: 'Ready Stock',
    currentETA: '150125',
    vid: 'APEX',
    msc: 'MSC001',
    genericField1: 'Special handling',
    genericField2: 'Priority shipment',
    genericField3: 'Extra notes'
  },
  {
    customerName: 'HP',
    poNumber: '',
    poDate: '',
    customerPartNumber: 'L15234-002',
    corePartNumber: '',
    customerDescription: 'Keyboard US Layout',
    bpiDescription: 'EliteBook 650 G10 KB',
    productCategory: 'Keyboards',
    orderQuantity: '10',
    pricePerUnit: '25.00',
    leadTime: '7 days',
    currentETA: '200125',
    vid: 'KBD',
    msc: 'MSC002',
    genericField1: '',
    genericField2: '',
    genericField3: ''
  },
  {
    customerName: 'Lenovo',
    poNumber: 'LN-2025-003',
    poDate: '050125',
    customerPartNumber: '5M10W86891',
    corePartNumber: '5M10W86891',
    customerDescription: 'Memory 16GB DDR4',
    bpiDescription: 'ThinkPad T14 Memory',
    productCategory: 'Memory',
    orderQuantity: '20',
    pricePerUnit: '85.00',
    leadTime: 'Ready Stock',
    currentETA: '120125',
    vid: 'MEM',
    msc: 'MSC003',
    genericField1: 'Bulk order',
    genericField2: '',
    genericField3: ''
  }
]

// Generate CSV content with headers and sample data
export function generateCSVTemplate(): string {
  // Header row
  const headers = CSV_TEMPLATE_COLUMNS.map(col => col.header)
  
  // Sample data rows
  const dataRows = SAMPLE_DATA_ROWS.map(row => 
    CSV_TEMPLATE_COLUMNS.map(col => row[col.field as keyof typeof row] || '')
  )
  
  // Combine headers and data
  const allRows = [headers, ...dataRows]
  
  // Convert to CSV format
  return allRows.map(row => 
    row.map(cell => {
      // Escape cells that contain commas, quotes, or newlines
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return `"${cell.replace(/"/g, '""')}"`
      }
      return cell
    }).join(',')
  ).join('\n')
}

// Download the CSV template
export function downloadCSVTemplate(): void {
  const csvContent = generateCSVTemplate()
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `Order_Import_Template_${new Date().toISOString().split('T')[0]}.csv`
  link.style.display = 'none'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  window.URL.revokeObjectURL(url)
  
  console.log('📁 CSV template downloaded successfully')
}

// Generate instructions text for the template
export function generateTemplateInstructions(): string {
  return `
ORDER IMPORT TEMPLATE INSTRUCTIONS

REQUIRED FIELDS:
- Customer Name: Must match existing customers exactly
- Customer's Part Number: Key identifier for order tracking
- Product Category: Must match predefined categories
- Order Quantity: Must be positive number

DATE FORMATS:
- All dates must be in DDMMYY format (e.g., 070125 for January 7, 2025)
- Dates can be left blank for pre-orders

IMPORTANT NOTES:
1. Do not modify the header row
2. Customer Name must match existing customers in the system
3. Product Category must match predefined categories
4. Price field requires special permissions
5. PO Number and Date can be blank for pre-orders
6. Lead Time is free text (e.g., "Ready Stock", "5 days")
7. VID and MSC are optional vendor tracking fields
8. Generic Fields are for miscellaneous customer data

SAMPLE DATA:
The template includes 3 sample rows showing proper data formatting.
Delete these rows and replace with your actual order data.

VALIDATION:
- The system will validate all data before import
- You will see a preview of valid/invalid rows before final import
- Invalid rows will be highlighted with specific error messages

For questions, contact your system administrator.
`
}

// Validate column headers against template
export function validateCSVHeaders(headers: string[]): { isValid: boolean; errors: string[] } {
  const expectedHeaders = CSV_TEMPLATE_COLUMNS.map(col => col.header)
  const errors: string[] = []
  
  // Check for missing required headers
  for (const expectedHeader of expectedHeaders) {
    if (!headers.includes(expectedHeader)) {
      errors.push(`Missing required column: "${expectedHeader}"`)
    }
  }
  
  // Check for unexpected headers
  for (const header of headers) {
    if (!expectedHeaders.includes(header)) {
      errors.push(`Unexpected column: "${header}"`)
    }
  }
  
  // Check header order (warning, not error)
  if (headers.length === expectedHeaders.length) {
    for (let i = 0; i < headers.length; i++) {
      if (headers[i] !== expectedHeaders[i]) {
        errors.push(`Column order mismatch at position ${i + 1}: expected "${expectedHeaders[i]}", found "${headers[i]}"`)
        break
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Get field mapping from headers
export function getFieldMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}
  
  CSV_TEMPLATE_COLUMNS.forEach(col => {
    const headerIndex = headers.indexOf(col.header)
    if (headerIndex >= 0) {
      mapping[col.field] = col.header
    }
  })
  
  return mapping
}