// Order Import Hook
// Handles CSV/Excel file processing, validation, and database import

import { useState } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { ImportRow, validateImportData, ImportValidationResult } from '@/utils/orderImportValidation'
import { validateCSVHeaders } from '@/utils/csvTemplate'
import { useAuth } from './useAuth'
import { supabase } from '@/lib/supabase'

export interface ImportSummary {
  successful: number
  failed: number
  uids: string[]
  errors?: string[]
}

export function useOrderImport() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const { user } = useAuth()

  // Process CSV/Excel file and extract data
  const processFile = async (file: File): Promise<ImportRow[]> => {
    setIsProcessing(true)

    try {
      let data: any[] = []

      if (file.name.endsWith('.csv')) {
        // Process CSV file
        data = await processCVSFile(file)
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // Process Excel file
        data = await processExcelFile(file)
      } else {
        throw new Error('Unsupported file format. Please use CSV or Excel files.')
      }

      return data
    } finally {
      setIsProcessing(false)
    }
  }

  // Process CSV file using Papa Parse
  const processCVSFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: (results) => {
          if (results.errors.length > 0) {
            const errorMessages = results.errors.map(error => `Row ${error.row}: ${error.message}`).join('; ')
            reject(new Error(`CSV parsing errors: ${errorMessages}`))
            return
          }

          // Validate headers
          const headers = Object.keys(results.data[0] || {})
          const headerValidation = validateCSVHeaders(headers)
          if (!headerValidation.isValid) {
            reject(new Error(`Header validation failed: ${headerValidation.errors.join('; ')}`))
            return
          }

          resolve(results.data as any[])
        },
        error: (error) => {
          reject(new Error(`Failed to parse CSV: ${error.message}`))
        }
      })
    })
  }

  // Process Excel file using SheetJS
  const processExcelFile = async (file: File): Promise<any[]> => {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    
    // Use first sheet
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) {
      throw new Error('No sheets found in Excel file')
    }

    const sheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(sheet, { 
      header: 1,
      defval: '',
      blankrows: false
    }) as any[][]

    if (data.length === 0) {
      throw new Error('No data found in Excel file')
    }

    // Convert to object format with headers
    const headers = data[0].map((header: any) => String(header).trim())
    const headerValidation = validateCSVHeaders(headers)
    if (!headerValidation.isValid) {
      throw new Error(`Header validation failed: ${headerValidation.errors.join('; ')}`)
    }

    const rows = data.slice(1).map(row => {
      const obj: any = {}
      headers.forEach((header, index) => {
        obj[header] = row[index] || ''
      })
      return obj
    })

    return rows
  }

  // Validate import data
  const validateImport = async (data: ImportRow[]): Promise<ImportValidationResult> => {
    try {
      // Fetch reference data for validation
      const [customersResponse, categoriesResponse] = await Promise.all([
        supabase.from('customers').select('name').eq('is_active', true),
        supabase.from('product_categories').select('name').eq('is_active', true)
      ])

      if (customersResponse.error) {
        throw new Error(`Failed to fetch customers: ${customersResponse.error.message}`)
      }

      if (categoriesResponse.error) {
        throw new Error(`Failed to fetch categories: ${categoriesResponse.error.message}`)
      }

      const existingCustomers = customersResponse.data.map(c => c.name)
      const existingCategories = categoriesResponse.data.map(c => c.name)

      // Check user permissions for price import
      // TODO: Implement proper role checking from user profile/database
      const userHasPricePermission = user?.email?.includes('admin') || user?.email?.includes('director')

      return validateImportData(data, existingCustomers, existingCategories, userHasPricePermission)
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Validation failed'],
        warnings: [],
        validRows: 0,
        totalRows: data.length,
        rowErrors: []
      }
    }
  }

  // Execute the import to database
  const executeImport = async (
    validatedData: ImportRow[],
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<ImportSummary> => {
    setIsImporting(true)

    try {
      const successful: string[] = []
      const failed: string[] = []
      const errors: string[] = []

      // Get next available UID
      const uidPrefix = import.meta.env.VITE_UID_PREFIX || 'A'
      const nextUID = await getNextUID(uidPrefix)

      // Process in batches for better performance and progress tracking
      const batchSize = 10
      const totalBatches = Math.ceil(validatedData.length / batchSize)

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const batchStart = batchIndex * batchSize
        const batchEnd = Math.min(batchStart + batchSize, validatedData.length)
        const batch = validatedData.slice(batchStart, batchEnd)

        try {
          const batchResult = await processBatch(batch, nextUID + batchStart, userId)
          successful.push(...batchResult.successful)
          failed.push(...batchResult.failed)
          errors.push(...batchResult.errors)
        } catch (error) {
          console.error(`Batch ${batchIndex + 1} failed:`, error)
          errors.push(`Batch ${batchIndex + 1} failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
          
          // Mark all items in failed batch as failed
          batch.forEach((_, index) => {
            failed.push(`${uidPrefix}${String(nextUID + batchStart + index).padStart(3, '0')}`)
          })
        }

        // Update progress
        const progress = ((batchIndex + 1) / totalBatches) * 100
        onProgress?.(progress)
      }

      return {
        successful: successful.length,
        failed: failed.length,
        uids: successful,
        errors: errors.length > 0 ? errors : undefined
      }
    } finally {
      setIsImporting(false)
    }
  }

  // Get next available UID
  const getNextUID = async (prefix: string): Promise<number> => {
    const { data, error } = await supabase
      .from('order_lines')
      .select('uid')
      .like('uid', `${prefix}%`)
      .order('uid', { ascending: false })
      .limit(1)

    if (error) {
      throw new Error(`Failed to get next UID: ${error.message}`)
    }

    if (data.length === 0) {
      return 1 // Start from 1 if no existing orders
    }

    const lastUID = data[0].uid
    const numberPart = lastUID.replace(prefix, '')
    const lastNumber = parseInt(numberPart, 10)
    
    return isNaN(lastNumber) ? 1 : lastNumber + 1
  }

  // Process a batch of orders
  const processBatch = async (
    batch: ImportRow[],
    startingUID: number,
    userId: string
  ): Promise<{ successful: string[]; failed: string[]; errors: string[] }> => {
    const successful: string[] = []
    const failed: string[] = []
    const errors: string[] = []

    // Resolve customer and category IDs
    const customerNames = [...new Set(batch.map(row => row.customerName))]
    const categoryNames = [...new Set(batch.map(row => row.productCategory))]

    const [customersResponse, categoriesResponse] = await Promise.all([
      supabase.from('customers').select('id, name').in('name', customerNames),
      supabase.from('product_categories').select('id, name').in('name', categoryNames)
    ])

    if (customersResponse.error || categoriesResponse.error) {
      throw new Error('Failed to resolve customer or category IDs')
    }

    const customerMap = new Map(customersResponse.data.map(c => [c.name, c.id]))
    const categoryMap = new Map(categoriesResponse.data.map(c => [c.name, c.id]))

    // Prepare order line records
    const uidPrefix = import.meta.env.VITE_UID_PREFIX || 'A'
    const orderLines = batch.map((row, index) => {
      const uid = `${uidPrefix}${String(startingUID + index).padStart(3, '0')}`
      
      return {
        uid,
        customer_id: customerMap.get(row.customerName),
        customer_part_number: row.customerPartNumber,
        core_part_number: row.corePartNumber,
        customer_description: row.customerDescription,
        bpi_description: row.bpiDescription,
        product_category_id: categoryMap.get(row.productCategory),
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
        created_by: userId,
        created_at: new Date().toISOString()
      }
    })

    // Insert to database
    const { data: insertedData, error: insertError } = await supabase
      .from('order_lines')
      .insert(orderLines)
      .select('uid')

    if (insertError) {
      console.error('Insert error:', insertError)
      errors.push(`Database insert failed: ${insertError.message}`)
      // Mark all as failed
      orderLines.forEach(ol => failed.push(ol.uid))
      return { successful, failed, errors }
    }

    // Initialize quantity tracking for each order
    const quantityRecords = insertedData.map(order => ({
      order_line_id: order.uid,
      total_order_quantity: batch.find(row => 
        `${uidPrefix}${String(startingUID + batch.indexOf(row)).padStart(3, '0')}` === order.uid
      )?.orderQuantity || 0,
      pending_procurement: batch.find(row => 
        `${uidPrefix}${String(startingUID + batch.indexOf(row)).padStart(3, '0')}` === order.uid
      )?.orderQuantity || 0,
      last_updated: new Date().toISOString(),
      updated_by: userId
    }))

    const { error: quantityError } = await supabase
      .from('order_line_quantities')
      .insert(quantityRecords)

    if (quantityError) {
      console.error('Quantity tracking initialization error:', quantityError)
      errors.push(`Quantity tracking initialization failed: ${quantityError.message}`)
      // Don't mark as failed since orders were created successfully
    }

    // Mark all as successful
    insertedData.forEach(order => successful.push(order.uid))

    return { successful, failed, errors }
  }

  return {
    processFile,
    validateImport,
    executeImport,
    isProcessing,
    isImporting
  }
}