// Database Types
export interface User {
  id: string
  email: string
  role_id: string
  first_name: string
  last_name: string
  whatsapp_number?: string
  is_active: boolean
  last_login?: string
  created_at: string
  updated_at: string
  role?: Role
}

export interface Role {
  id: string
  name: string
  description: string
  permissions: Record<string, boolean>
  created_at: string
}

export interface OrderLine {
  id: string
  uid: string
  customer_id: string
  po_number?: string
  po_date?: string
  customer_part_number: string
  core_part_number?: string
  customer_description?: string
  bpi_description?: string
  product_category_id: string
  order_quantity: number
  price?: number
  lead_time?: string
  current_eta?: string
  vid?: string
  msc?: string
  assigned_user_ids: string[]
  part_mapping_approved: boolean
  rfq_eta_date?: string
  first_eta_date?: string
  second_eta_date?: string
  third_eta_date?: string
  final_eta_date?: string
  eta_delay_reasons?: Record<string, string>
  misc_field_1?: string
  misc_field_2?: string
  misc_field_3?: string
  created_at: string
  updated_at: string
  created_by: string
  customer?: Customer
  product_category?: ProductCategory
  quantities?: OrderLineQuantities
}

export interface Customer {
  id: string
  name: string
  code?: string
  is_active: boolean
  created_at: string
}

export interface ProductCategory {
  id: string
  name: string
  description?: string
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface OrderLineQuantities {
  order_line_id: string
  total_order_quantity: number
  pending_procurement: number
  requested_from_stock: number
  awaiting_kitting_packing: number
  in_kitting_packing: number
  on_hold_kitting: number
  kitted_awaiting_qc: number
  in_screening_qc: number
  on_hold_qc: number
  qc_passed_ready_invoice: number
  qc_rejected: number
  invoiced: number
  shipped_delivered: number
  cancelled: number
  updated_at: string
}

export interface QuantityLog {
  id: string
  order_line_id: string
  action_type: string
  from_state?: string
  to_state?: string
  quantity_moved: number
  reason_text?: string
  associated_ct_numbers: string[]
  user_id: string
  timestamp: string
  user?: User
}

export interface CTNumber {
  id: string
  ct_number: string
  order_line_id: string
  status: 'assigned' | 'in_use' | 'completed'
  assigned_at: string
  assigned_by: string
  is_duplicate: boolean
  duplicate_approved_by?: string
  duplicate_approved_at?: string
  original_ct_id?: string
  created_at: string
}

// Permission Types
export interface Permissions {
  // Order Management
  VIEW_ALL_ORDERS: boolean
  VIEW_OWN_ORDERS: boolean
  CREATE_ORDERS: boolean
  EDIT_ORDERS: boolean
  DELETE_ORDERS: boolean
  VIEW_ORDER_PRICES: boolean
  VIEW_CUSTOMER_NAMES: boolean
  
  // CT Management
  ASSIGN_CT_NUMBERS: boolean
  OVERRIDE_DUPLICATE_CT: boolean
  APPROVE_DUPLICATE_CT: boolean
  
  // Workflow Operations
  MANAGE_KITTING_PACKING: boolean
  MANAGE_SCREENING_QC: boolean
  MANAGE_NPQC: boolean
  CREATE_TRANSFERS: boolean
  
  // Administration
  MANAGE_USERS: boolean
  MANAGE_ROLES: boolean
  MANAGE_SYSTEM_SETTINGS: boolean
  ACCESS_ADMIN_PANEL: boolean
  
  // Invoicing
  ACCESS_INVOICING: boolean
  CREATE_INVOICES: boolean
  UPLOAD_DOCUMENTS: boolean
  
  // Procurement
  ACCESS_PROCUREMENT: boolean
  MANAGE_VENDORS: boolean
  SEND_WHATSAPP: boolean
}

// Form Types
export interface OrderLineFormData {
  customer_id: string
  po_number?: string
  po_date?: string
  customer_part_number: string
  core_part_number?: string
  customer_description?: string
  bpi_description?: string
  product_category_id: string
  order_quantity: number
  price?: number
  lead_time?: string
  current_eta?: string
  vid?: string
  msc?: string
  misc_field_1?: string
  misc_field_2?: string
  misc_field_3?: string
}

// API Response Types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  limit: number
  totalPages: number
}