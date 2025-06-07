// FAI Document Integration Types
// First Article Inspection document and image management

export interface FAIDocument {
  id: string
  customer_part_number: string
  file_name: string
  file_path: string
  file_size: number
  uploaded_at: string
  uploaded_by: string
  uploaded_by_user?: {
    id: string
    first_name: string
    last_name: string
  }
}

export interface FAIImage {
  id: string
  fai_document_id: string
  customer_part_number: string
  image_name: string
  image_path: string
  image_order: number
  extracted_at: string
}

export interface MasterImage {
  id: string
  customer_part_number: string
  image_name: string
  image_path: string
  is_primary: boolean
  uploaded_at: string
  uploaded_by: string
  uploaded_by_user?: {
    id: string
    first_name: string
    last_name: string
  }
}

export interface ImageViewerData {
  customer_part_number: string
  master_images: MasterImage[]
  fai_images: FAIImage[]
  total_images: number
  primary_master?: MasterImage
}

export interface FAIUploadConfig {
  storage_type: 'local' | 'cloud' | 'hybrid'
  local_path?: string
  cloud_bucket?: string
  max_file_size: number
  allowed_formats: string[]
  auto_extract_images: boolean
  create_thumbnails: boolean
  thumbnail_size: {
    width: number
    height: number
  }
}

export interface ImageExtractionJob {
  id: string
  fai_document_id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress_percentage: number
  started_at?: string
  completed_at?: string
  error_message?: string
  images_extracted: number
  total_images_found: number
  extraction_log?: string[]
}

// Form Types
export interface FAIDocumentUploadData {
  customer_part_number: string
  file: File
  version?: string
  description?: string
  replace_existing?: boolean
}

export interface MasterImageUploadData {
  customer_part_number: string
  file: File
  description?: string
  view_angle?: string
  quality_notes?: string
  is_primary?: boolean
}

// API Response Types
export interface FAIImageResponse {
  images: ImageViewerData
  has_fai_documents: boolean
  has_master_images: boolean
  last_updated: string
}

export interface FAIUploadResponse {
  document: FAIDocument
  extraction_job?: ImageExtractionJob
  success: boolean
  message: string
}

// UI Component Types
export interface ImageViewerProps {
  customer_part_number: string
  isOpen: boolean
  onClose: () => void
  initial_image_index?: number
}

export interface FAIUploadModalProps {
  customer_part_number: string
  isOpen: boolean
  onClose: () => void
  onUploadSuccess: (document: FAIDocument) => void
}

export interface MasterImageUploadModalProps {
  customer_part_number: string
  isOpen: boolean
  onClose: () => void
  onUploadSuccess: (image: MasterImage) => void
}

// Storage Configuration Types
export interface StorageConfig {
  type: 'supabase' | 'local' | 's3'
  bucket_name?: string
  base_path: string
  public_url_prefix?: string
  access_key?: string
  secret_key?: string
  region?: string
}

// Permission Types for FAI System
export interface FAIPermissions {
  VIEW_FAI_IMAGES: boolean
  UPLOAD_FAI_DOCUMENTS: boolean
  UPLOAD_MASTER_IMAGES: boolean
  APPROVE_MASTER_IMAGES: boolean
  DELETE_FAI_DOCUMENTS: boolean
  DELETE_MASTER_IMAGES: boolean
  MANAGE_FAI_SETTINGS: boolean
}

// Export all types
export type {
  FAIDocument,
  FAIImage,
  MasterImage,
  ImageViewerData,
  FAIUploadConfig,
  ImageExtractionJob,
  FAIDocumentUploadData,
  MasterImageUploadData,
  FAIImageResponse,
  FAIUploadResponse,
  ImageViewerProps,
  FAIUploadModalProps,
  MasterImageUploadModalProps,
  StorageConfig,
  FAIPermissions
}