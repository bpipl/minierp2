// Order Import Validation Utilities
// Provides comprehensive validation for CSV/Excel import data

export interface ImportRow {
  // Core order data
  customerName: string
  poNumber: string
  poDate: string
  customerPartNumber: string
  corePartNumber: string
  customerDescription: string
  bpiDescription: string
  productCategory: string
  orderQuantity: number
  pricePerUnit?: number
  leadTime: string
  currentETA: string
  vid: string
  msc: string
  genericField1: string
  genericField2: string
  genericField3: string
  
  // Metadata
  rowIndex: number
}

export interface ValidationError {
  rowIndex: number
  errors: string[]
}

export interface ImportValidationResult {
  isValid: boolean
  errors: string[]        // Global errors (file level)
  warnings: string[]      // Global warnings
  validRows: number
  totalRows: number
  rowErrors: ValidationError[]  // Row-specific errors
}

// Date validation for DDMMYY format
export function validateDDMMYY(dateStr: string): { isValid: boolean; error?: string; isoDate?: string } {
  if (!dateStr || dateStr.trim() === '') {
    return { isValid: true } // Empty dates are allowed
  }
  
  const trimmed = dateStr.trim()
  
  // Check format: exactly 6 digits
  if (!/^\d{6}$/.test(trimmed)) {
    return { 
      isValid: false, 
      error: `Invalid date format "${dateStr}". Use DDMMYY (e.g., 070125 for Jan 7, 2025)` 
    }
  }
  
  const day = parseInt(trimmed.substring(0, 2), 10)
  const month = parseInt(trimmed.substring(2, 4), 10)
  const year = 2000 + parseInt(trimmed.substring(4, 6), 10)
  
  // Basic range validation
  if (day < 1 || day > 31) {
    return { isValid: false, error: `Invalid day "${day}" in date "${dateStr}"` }
  }
  
  if (month < 1 || month > 12) {
    return { isValid: false, error: `Invalid month "${month}" in date "${dateStr}"` }
  }
  
  // Create date object and validate it exists
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return { isValid: false, error: `Invalid date "${dateStr}". Date does not exist.` }
  }
  
  // Convert to ISO format for database
  const isoDate = date.toISOString().split('T')[0]
  
  return { isValid: true, isoDate }
}

// Validate customer name against existing customers
export function validateCustomerName(customerName: string, existingCustomers: string[]): { isValid: boolean; error?: string } {
  if (!customerName || customerName.trim() === '') {
    return { isValid: false, error: 'Customer Name is required' }
  }
  
  const trimmed = customerName.trim()
  
  // Case-insensitive match against existing customers
  const matchingCustomer = existingCustomers.find(customer => 
    customer.toLowerCase() === trimmed.toLowerCase()
  )
  
  if (!matchingCustomer) {
    return { 
      isValid: false, 
      error: `Customer "${customerName}" not found. Available customers: ${existingCustomers.join(', ')}` 
    }
  }
  
  return { isValid: true }
}

// Validate product category against predefined categories
export function validateProductCategory(category: string, existingCategories: string[]): { isValid: boolean; error?: string } {
  if (!category || category.trim() === '') {
    return { isValid: false, error: 'Product Category is required' }
  }
  
  const trimmed = category.trim()
  
  // Exact match against existing categories
  if (!existingCategories.includes(trimmed)) {
    return { 
      isValid: false, 
      error: `Product Category "${category}" not found. Available categories: ${existingCategories.join(', ')}` 
    }
  }
  
  return { isValid: true }
}

// Validate order quantity
export function validateOrderQuantity(quantity: any): { isValid: boolean; error?: string; value?: number } {
  if (quantity === undefined || quantity === null || quantity === '') {
    return { isValid: false, error: 'Order Quantity is required' }
  }
  
  const numValue = typeof quantity === 'number' ? quantity : parseFloat(String(quantity))
  
  if (isNaN(numValue)) {
    return { isValid: false, error: `Invalid quantity "${quantity}". Must be a number.` }
  }
  
  if (numValue <= 0) {
    return { isValid: false, error: `Quantity must be positive. Got: ${numValue}` }
  }
  
  if (!Number.isInteger(numValue)) {
    return { isValid: false, error: `Quantity must be a whole number. Got: ${numValue}` }
  }
  
  return { isValid: true, value: numValue }
}

// Validate price per unit
export function validatePricePerUnit(price: any, isRequired: boolean = false): { isValid: boolean; error?: string; value?: number } {
  if (!price || price === '') {
    if (isRequired) {
      return { isValid: false, error: 'Price is required' }
    }
    return { isValid: true }
  }
  
  const numValue = typeof price === 'number' ? price : parseFloat(String(price))
  
  if (isNaN(numValue)) {
    return { isValid: false, error: `Invalid price "${price}". Must be a number.` }
  }
  
  if (numValue < 0) {
    return { isValid: false, error: `Price cannot be negative. Got: ${numValue}` }
  }
  
  return { isValid: true, value: numValue }
}

// Validate VID format
export function validateVID(vid: string): { isValid: boolean; error?: string } {
  if (!vid || vid.trim() === '') {
    return { isValid: true } // VID is optional
  }
  
  const trimmed = vid.trim().toUpperCase()
  
  // Basic format validation - alphanumeric, 2-10 characters
  if (!/^[A-Z0-9]{2,10}$/.test(trimmed)) {
    return { 
      isValid: false, 
      error: `Invalid VID format "${vid}". Must be 2-10 alphanumeric characters.` 
    }
  }
  
  return { isValid: true }
}

// Validate MSC format
export function validateMSC(msc: string): { isValid: boolean; error?: string } {
  if (!msc || msc.trim() === '') {
    return { isValid: true } // MSC is optional
  }
  
  const trimmed = msc.trim().toUpperCase()
  
  // Alphanumeric 5-6 digits as per requirements
  if (!/^[A-Z0-9]{5,6}$/.test(trimmed)) {
    return { 
      isValid: false, 
      error: `Invalid MSC format "${msc}". Must be 5-6 alphanumeric characters.` 
    }
  }
  
  return { isValid: true }
}

// Validate a single row of import data
export function validateImportRow(
  row: any, 
  rowIndex: number,
  existingCustomers: string[],
  existingCategories: string[],
  userHasPricePermission: boolean = false
): { isValid: boolean; errors: string[]; validatedRow?: ImportRow } {
  const errors: string[] = []
  
  // Required field validations
  const customerValidation = validateCustomerName(row.customerName, existingCustomers)
  if (!customerValidation.isValid) {
    errors.push(customerValidation.error!)
  }
  
  if (!row.customerPartNumber || row.customerPartNumber.trim() === '') {
    errors.push('Customer Part Number is required')
  }
  
  const categoryValidation = validateProductCategory(row.productCategory, existingCategories)
  if (!categoryValidation.isValid) {
    errors.push(categoryValidation.error!)
  }
  
  const quantityValidation = validateOrderQuantity(row.orderQuantity)
  if (!quantityValidation.isValid) {
    errors.push(quantityValidation.error!)
  }
  
  // Optional field validations
  let poDateISO: string | undefined
  if (row.poDate) {
    const dateValidation = validateDDMMYY(row.poDate)
    if (!dateValidation.isValid) {
      errors.push(dateValidation.error!)
    } else {
      poDateISO = dateValidation.isoDate
    }
  }
  
  let currentETAISO: string | undefined
  if (row.currentETA) {
    const etaValidation = validateDDMMYY(row.currentETA)
    if (!etaValidation.isValid) {
      errors.push(etaValidation.error!)
    } else {
      currentETAISO = etaValidation.isoDate
    }
  }
  
  // Price validation (only if user has permission and price is provided)
  let validatedPrice: number | undefined
  if (row.pricePerUnit) {
    if (!userHasPricePermission) {
      errors.push('You do not have permission to import price data')
    } else {
      const priceValidation = validatePricePerUnit(row.pricePerUnit)
      if (!priceValidation.isValid) {
        errors.push(priceValidation.error!)
      } else {
        validatedPrice = priceValidation.value
      }
    }
  }
  
  // VID validation
  if (row.vid) {
    const vidValidation = validateVID(row.vid)
    if (!vidValidation.isValid) {
      errors.push(vidValidation.error!)
    }
  }
  
  // MSC validation
  if (row.msc) {
    const mscValidation = validateMSC(row.msc)
    if (!mscValidation.isValid) {
      errors.push(mscValidation.error!)
    }
  }
  
  // Create validated row if no errors
  let validatedRow: ImportRow | undefined
  if (errors.length === 0) {
    validatedRow = {
      customerName: row.customerName.trim(),
      poNumber: row.poNumber?.trim() || '',
      poDate: poDateISO || '',
      customerPartNumber: row.customerPartNumber.trim(),
      corePartNumber: row.corePartNumber?.trim() || '',
      customerDescription: row.customerDescription?.trim() || '',
      bpiDescription: row.bpiDescription?.trim() || '',
      productCategory: row.productCategory.trim(),
      orderQuantity: quantityValidation.value!,
      pricePerUnit: validatedPrice,
      leadTime: row.leadTime?.trim() || '',
      currentETA: currentETAISO || '',
      vid: row.vid?.trim().toUpperCase() || '',
      msc: row.msc?.trim().toUpperCase() || '',
      genericField1: row.genericField1?.trim() || '',
      genericField2: row.genericField2?.trim() || '',
      genericField3: row.genericField3?.trim() || '',
      rowIndex
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    validatedRow
  }
}

// Validate entire import dataset
export function validateImportData(
  data: any[],
  existingCustomers: string[],
  existingCategories: string[],
  userHasPricePermission: boolean = false
): ImportValidationResult {
  const globalErrors: string[] = []
  const warnings: string[] = []
  const rowErrors: ValidationError[] = []
  const validatedRows: ImportRow[] = []
  
  // Global validations
  if (data.length === 0) {
    globalErrors.push('No data rows found in file')
  }
  
  if (data.length > 1000) {
    globalErrors.push(`Too many rows (${data.length}). Maximum allowed: 1000`)
  }
  
  // Check for duplicate customer part numbers within import
  const partNumbers = new Map<string, number[]>()
  data.forEach((row, index) => {
    if (row.customerPartNumber) {
      const partNum = row.customerPartNumber.trim().toLowerCase()
      if (!partNumbers.has(partNum)) {
        partNumbers.set(partNum, [])
      }
      partNumbers.get(partNum)!.push(index + 1) // 1-based row numbers
    }
  })
  
  // Report duplicates within import
  for (const [partNum, rowNums] of partNumbers.entries()) {
    if (rowNums.length > 1) {
      warnings.push(`Duplicate Customer Part Number "${partNum}" found in rows: ${rowNums.join(', ')}`)
    }
  }
  
  // Validate each row
  data.forEach((row, index) => {
    const validation = validateImportRow(
      row, 
      index, 
      existingCustomers, 
      existingCategories,
      userHasPricePermission
    )
    
    if (!validation.isValid) {
      rowErrors.push({
        rowIndex: index,
        errors: validation.errors
      })
    } else if (validation.validatedRow) {
      validatedRows.push(validation.validatedRow)
    }
  })
  
  return {
    isValid: globalErrors.length === 0 && rowErrors.length === 0,
    errors: globalErrors,
    warnings,
    validRows: validatedRows.length,
    totalRows: data.length,
    rowErrors
  }
}

// Auto-populate BPI Description from existing data (placeholder)
export function autoPopulateBPIDescription(customerPartNumber: string): string {
  // TODO: Implement lookup from existing order_lines table
  // For now, return empty string
  console.log(`🔍 Auto-populating BPI Description for: ${customerPartNumber}`)
  return ''
}

// Convert validated rows to database format
export function convertToOrderLineFormat(validatedRows: ImportRow[], uidPrefix: string = 'A'): any[] {
  return validatedRows.map((row, index) => ({
    // Generate sequential UID (will be handled by the import hook)
    uid: `${uidPrefix}${String(index + 1).padStart(3, '0')}`, // Temporary, will be replaced
    customer_part_number: row.customerPartNumber,
    core_part_number: row.corePartNumber,
    customer_description: row.customerDescription,
    bpi_description: row.bpiDescription || autoPopulateBPIDescription(row.customerPartNumber),
    order_quantity: row.orderQuantity,
    price_per_unit: row.pricePerUnit || null,
    lead_time: row.leadTime,
    po_number: row.poNumber,
    po_date: row.poDate || null,
    current_eta: row.currentETA || null,
    vid: row.vid,
    msc: row.msc,
    generic_field_1: row.genericField1,
    generic_field_2: row.genericField2,
    generic_field_3: row.genericField3,
    // These will be set by the import process
    customer_id: null, // Will be resolved from customer name
    product_category_id: null, // Will be resolved from category name
    created_by: null, // Will be set by import hook
    created_at: new Date().toISOString()
  }))
}