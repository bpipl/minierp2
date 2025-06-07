// FAI Document Management Hook
// Handle FAI document upload, image extraction, and viewing

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { 
  FAIDocument, 
  FAIImage, 
  MasterImage, 
  ImageViewerData, 
  FAIDocumentUploadData,
  MasterImageUploadData,
  FAIImageResponse,
  FAIUploadResponse,
  ImageExtractionJob
} from '@/types/fai'

export function useFAI() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // Get images for a customer part number
  const getImagesForPart = useCallback(async (customerPartNumber: string): Promise<FAIImageResponse> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Get Master Images
      const { data: masterImages, error: masterError } = await supabase
        .from('master_images')
        .select(`
          *,
          uploaded_by_user:users!master_images_uploaded_by_fkey(id, first_name, last_name)
        `)
        .eq('customer_part_number', customerPartNumber)
        .order('is_primary', { ascending: false })
        .order('uploaded_at', { ascending: false })

      if (masterError) throw masterError

      // Get FAI Images
      const { data: faiImages, error: faiError } = await supabase
        .from('fai_images')
        .select(`
          *,
          fai_document:fai_documents!fai_images_fai_document_id_fkey(
            id, file_name, uploaded_at,
            uploaded_by_user:users!fai_documents_uploaded_by_fkey(id, first_name, last_name)
          )
        `)
        .eq('customer_part_number', customerPartNumber)
        .order('image_order', { ascending: true })

      if (faiError) throw faiError

      // Find primary master image
      const primaryMaster = masterImages?.find(img => img.is_primary) || masterImages?.[0]

      const imageData: ImageViewerData = {
        customer_part_number: customerPartNumber,
        master_images: masterImages || [],
        fai_images: faiImages || [],
        total_images: (masterImages?.length || 0) + (faiImages?.length || 0),
        primary_master: primaryMaster
      }

      return {
        images: imageData,
        has_fai_documents: (faiImages?.length || 0) > 0,
        has_master_images: (masterImages?.length || 0) > 0,
        last_updated: new Date().toISOString()
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load images'
      setError(errorMessage)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Upload FAI Document
  const uploadFAIDocument = useCallback(async (uploadData: FAIDocumentUploadData): Promise<FAIUploadResponse> => {
    if (!user) throw new Error('User not authenticated')
    
    setIsLoading(true)
    setError(null)

    try {
      // Validate file
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel' // .xls
      ]
      
      if (!allowedTypes.includes(uploadData.file.type)) {
        throw new Error('Only Excel files (.xlsx, .xls) are allowed')
      }

      // Generate file path
      const timestamp = new Date().getTime()
      const fileName = `${uploadData.customer_part_number}_${timestamp}_${uploadData.file.name}`
      const filePath = `fai-documents/${uploadData.customer_part_number}/${fileName}`

      // Upload file to Supabase Storage
      const { data: fileData, error: uploadError } = await supabase.storage
        .from('fai-documents')
        .upload(filePath, uploadData.file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('fai-documents')
        .getPublicUrl(filePath)

      // Create database record
      const documentRecord = {
        customer_part_number: uploadData.customer_part_number,
        filename: uploadData.file.name,
        file_path: filePath,
        file_size: uploadData.file.size,
        file_type: uploadData.file.type,
        version: uploadData.version || '1.0',
        uploaded_by: user.id,
        metadata: {
          original_name: uploadData.file.name,
          public_url: publicUrl,
          upload_timestamp: timestamp
        }
      }

      const { data: document, error: dbError } = await supabase
        .from('fai_documents')
        .insert([documentRecord])
        .select(`
          *,
          uploaded_by_user:users!fai_documents_uploaded_by_fkey(id, first_name, last_name)
        `)
        .single()

      if (dbError) throw dbError

      // Create extraction job
      const { data: extractionJob, error: jobError } = await supabase
        .from('image_extraction_jobs')
        .insert([{
          fai_document_id: document.id,
          status: 'queued'
        }])
        .select()
        .single()

      if (jobError) {
        console.warn('Failed to create extraction job:', jobError)
      }

      // TODO: Trigger background image extraction process
      // This would typically be handled by a background service
      
      return {
        document: document as FAIDocument,
        extraction_job: extractionJob as ImageExtractionJob,
        success: true,
        message: 'FAI document uploaded successfully. Image extraction will begin shortly.'
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload FAI document'
      setError(errorMessage)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Upload Master Image
  const uploadMasterImage = useCallback(async (uploadData: MasterImageUploadData): Promise<MasterImage> => {
    if (!user) throw new Error('User not authenticated')
    
    setIsLoading(true)
    setError(null)

    try {
      // Validate file
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff']
      
      if (!allowedTypes.includes(uploadData.file.type)) {
        throw new Error('Only image files (PNG, JPG, TIFF) are allowed')
      }

      // Generate file path
      const timestamp = new Date().getTime()
      const fileExtension = uploadData.file.name.split('.').pop()
      const fileName = `master_${uploadData.customer_part_number}_${timestamp}.${fileExtension}`
      const filePath = `master-images/${uploadData.customer_part_number}/${fileName}`

      // Upload file to Supabase Storage
      const { data: fileData, error: uploadError } = await supabase.storage
        .from('fai-documents')
        .upload(filePath, uploadData.file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('fai-documents')
        .getPublicUrl(filePath)

      // Create image object to get dimensions
      const img = new Image()
      const dimensions = await new Promise<{width: number, height: number}>((resolve) => {
        img.onload = () => resolve({ width: img.width, height: img.height })
        img.src = URL.createObjectURL(uploadData.file)
      })

      // Create database record
      const imageRecord = {
        customer_part_number: uploadData.customer_part_number,
        image_name: uploadData.file.name,
        image_path: filePath,
        image_url: publicUrl,
        file_size: uploadData.file.size,
        image_format: fileExtension?.toUpperCase() || 'UNKNOWN',
        width: dimensions.width,
        height: dimensions.height,
        is_primary: uploadData.is_primary || false,
        uploaded_by: user.id,
        description: uploadData.description,
        view_angle: uploadData.view_angle,
        quality_notes: uploadData.quality_notes,
        approval_status: 'approved', // Auto-approve for now, can be changed to require approval
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        metadata: {
          original_name: uploadData.file.name,
          upload_timestamp: timestamp,
          file_type: uploadData.file.type
        }
      }

      const { data: masterImage, error: dbError } = await supabase
        .from('master_images')
        .insert([imageRecord])
        .select(`
          *,
          uploaded_by_user:users!master_images_uploaded_by_fkey(id, first_name, last_name)
        `)
        .single()

      if (dbError) throw dbError

      return masterImage as MasterImage

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload master image'
      setError(errorMessage)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Get FAI documents for a part
  const getFAIDocuments = useCallback(async (customerPartNumber: string): Promise<FAIDocument[]> => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('fai_documents')
        .select(`
          *,
          uploaded_by_user:users!fai_documents_uploaded_by_fkey(id, first_name, last_name)
        `)
        .eq('customer_part_number', customerPartNumber)
        .eq('is_active', true)
        .order('upload_date', { ascending: false })

      if (error) throw error
      return data || []

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load FAI documents'
      setError(errorMessage)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Get extraction job status
  const getExtractionJobStatus = useCallback(async (documentId: string): Promise<ImageExtractionJob | null> => {
    try {
      const { data, error } = await supabase
        .from('image_extraction_jobs')
        .select('*')
        .eq('fai_document_id', documentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows found
      return data || null

    } catch (error) {
      console.error('Failed to get extraction job status:', error)
      return null
    }
  }, [])

  // Check if part has FAI images
  const hasImagesForPart = useCallback(async (customerPartNumber: string): Promise<boolean> => {
    try {
      const { count: masterCount, error: masterError } = await supabase
        .from('master_images')
        .select('id', { count: 'exact', head: true })
        .eq('customer_part_number', customerPartNumber)
        .eq('approval_status', 'approved')

      if (masterError) throw masterError

      const { count: faiCount, error: faiError } = await supabase
        .from('fai_images')
        .select('id', { count: 'exact', head: true })
        .eq('customer_part_number', customerPartNumber)

      if (faiError) throw faiError

      return (masterCount || 0) > 0 || (faiCount || 0) > 0

    } catch (error) {
      console.error('Failed to check for images:', error)
      return false
    }
  }, [])

  return {
    // State
    isLoading,
    error,
    
    // Functions
    getImagesForPart,
    uploadFAIDocument,
    uploadMasterImage,
    getFAIDocuments,
    getExtractionJobStatus,
    hasImagesForPart,
    
    // Utilities
    clearError: () => setError(null)
  }
}