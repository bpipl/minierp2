# Mini-ERP Order Management QC App - Technical Architecture

## Technology Stack

### Frontend
- **React 18** with TypeScript for type safety
- **Vite** as build tool for fast development and optimized builds
- **Tailwind CSS** for utility-first styling
- **Shadcn/ui** for consistent, accessible component library
- **React Router** for client-side routing
- **React Query** for server state management and caching
- **Zustand** for local state management
- **React Hook Form** with Zod validation

### Backend & Database
- **Supabase** as Backend-as-a-Service
  - PostgreSQL database with Row Level Security (RLS)
  - Real-time subscriptions for live UI updates
  - Built-in authentication and authorization
  - File storage for FAI documents and images
  - Edge functions for complex business logic

### Real-time Architecture
- **Supabase Realtime** for instant UI updates
- WebSocket connections for live data synchronization
- Optimistic updates for immediate user feedback
- Conflict resolution for concurrent operations

### External Integrations
- **N8N** for workflow automation and WhatsApp integration
- **Evolution API** for WhatsApp messaging
- **Network Print Server (NPS)** for Zebra printer integration
- **Google Sheets API** for order import automation

## Database Schema Design

### Core Entities

#### Users & Authentication
```sql
-- Users table (managed by Supabase Auth)
users (
  id uuid PRIMARY KEY,
  email text UNIQUE,
  role_id uuid REFERENCES roles(id),
  first_name text,
  last_name text,
  whatsapp_number text,
  is_active boolean DEFAULT true,
  last_login timestamp,
  created_at timestamp,
  updated_at timestamp
)

-- Roles & Permissions
roles (
  id uuid PRIMARY KEY,
  name text UNIQUE,
  description text,
  permissions jsonb,
  created_at timestamp
)
```

#### Order Management
```sql
-- Order Lines (main entity)
order_lines (
  id uuid PRIMARY KEY,
  uid text UNIQUE, -- Sequential human-readable ID (A001, A002, etc.)
  customer_id uuid REFERENCES customers(id),
  po_number text,
  po_date date,
  customer_part_number text NOT NULL,
  core_part_number text,
  customer_description text,
  bpi_description text, -- Internal shorthand
  product_category_id uuid REFERENCES product_categories(id),
  order_quantity integer NOT NULL,
  price decimal(10,2),
  lead_time text,
  current_eta date,
  vid text, -- Vendor ID
  msc text, -- Master Shipping Carton ID
  assigned_user_ids uuid[],
  part_mapping_approved boolean DEFAULT false,
  rfq_eta_date date,
  first_eta_date date,
  second_eta_date date,
  third_eta_date date,
  final_eta_date date,
  eta_delay_reasons jsonb,
  misc_field_1 text,
  misc_field_2 text,
  misc_field_3 text,
  created_at timestamp,
  updated_at timestamp,
  created_by uuid REFERENCES users(id)
)

-- Quantity Tracking
quantity_logs (
  id uuid PRIMARY KEY,
  order_line_id uuid REFERENCES order_lines(id),
  action_type text NOT NULL, -- 'move', 'hold', 'reject', 'pass'
  from_state text,
  to_state text,
  quantity_moved integer NOT NULL,
  reason_text text,
  associated_ct_numbers text[],
  user_id uuid REFERENCES users(id),
  timestamp timestamp DEFAULT now()
)

-- Current quantity states (denormalized for performance)
order_line_quantities (
  order_line_id uuid PRIMARY KEY REFERENCES order_lines(id),
  total_order_quantity integer DEFAULT 0,
  pending_procurement integer DEFAULT 0,
  requested_from_stock integer DEFAULT 0,
  awaiting_kitting_packing integer DEFAULT 0,
  in_kitting_packing integer DEFAULT 0,
  on_hold_kitting integer DEFAULT 0,
  kitted_awaiting_qc integer DEFAULT 0,
  in_screening_qc integer DEFAULT 0,
  on_hold_qc integer DEFAULT 0,
  qc_passed_ready_invoice integer DEFAULT 0,
  qc_rejected integer DEFAULT 0,
  invoiced integer DEFAULT 0,
  shipped_delivered integer DEFAULT 0,
  cancelled integer DEFAULT 0,
  updated_at timestamp DEFAULT now()
)
```

#### CT Number Management
```sql
-- CT Number registry
ct_numbers (
  id uuid PRIMARY KEY,
  ct_number text UNIQUE NOT NULL, -- 14-digit alphanumeric
  order_line_id uuid REFERENCES order_lines(id),
  status text DEFAULT 'assigned', -- 'assigned', 'in_use', 'completed'
  assigned_at timestamp DEFAULT now(),
  assigned_by uuid REFERENCES users(id),
  is_duplicate boolean DEFAULT false,
  duplicate_approved_by uuid REFERENCES users(id),
  duplicate_approved_at timestamp,
  original_ct_id uuid REFERENCES ct_numbers(id), -- For duplicates
  created_at timestamp DEFAULT now()
)

-- CT Number generation templates
ct_generation_templates (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  template_type text, -- 'fai_master', 'last_used', 'global_prefix'
  template_string text,
  randomize_length integer DEFAULT 4,
  is_global_default boolean DEFAULT false,
  created_by uuid REFERENCES users(id)
)
```

#### FAI Document Management
```sql
-- FAI Documents
fai_documents (
  id uuid PRIMARY KEY,
  customer_part_number text NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  uploaded_at timestamp DEFAULT now(),
  uploaded_by uuid REFERENCES users(id)
)

-- Extracted FAI Images
fai_images (
  id uuid PRIMARY KEY,
  fai_document_id uuid REFERENCES fai_documents(id),
  customer_part_number text NOT NULL,
  image_name text,
  image_path text NOT NULL,
  image_order integer DEFAULT 0,
  extracted_at timestamp DEFAULT now()
)

-- Master Images
master_images (
  id uuid PRIMARY KEY,
  customer_part_number text NOT NULL,
  image_name text,
  image_path text NOT NULL,
  is_primary boolean DEFAULT false,
  uploaded_at timestamp DEFAULT now(),
  uploaded_by uuid REFERENCES users(id)
)
```

#### NPQC Module
```sql
-- NP Location specific quantities
np_quantities (
  order_line_id uuid PRIMARY KEY REFERENCES order_lines(id),
  total_quantity_for_np integer DEFAULT 0,
  pending_at_np integer DEFAULT 0,
  in_np_qc integer DEFAULT 0,
  np_qc_passed integer DEFAULT 0,
  np_qc_failed_hold integer DEFAULT 0,
  np_qc_failed_return integer DEFAULT 0,
  sent_to_sb integer DEFAULT 0,
  cancelled_at_np integer DEFAULT 0,
  updated_at timestamp DEFAULT now()
)

-- Inter-location transfers
transfers (
  id uuid PRIMARY KEY,
  from_location text NOT NULL, -- 'SB' or 'NP'
  to_location text NOT NULL,
  order_line_id uuid REFERENCES order_lines(id),
  quantity integer NOT NULL,
  ct_numbers text[],
  reason text,
  status text DEFAULT 'pending', -- 'pending', 'in_transit', 'received', 'rejected'
  created_by uuid REFERENCES users(id),
  received_by uuid REFERENCES users(id),
  created_at timestamp DEFAULT now(),
  received_at timestamp
)
```

#### Supporting Tables
```sql
-- Customers
customers (
  id uuid PRIMARY KEY,
  name text UNIQUE NOT NULL,
  code text UNIQUE,
  is_active boolean DEFAULT true,
  created_at timestamp
)

-- Product Categories
product_categories (
  id uuid PRIMARY KEY,
  name text UNIQUE NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  sort_order integer,
  created_at timestamp
)

-- Vendors
vendors (
  id uuid PRIMARY KEY,
  vid text UNIQUE NOT NULL, -- Vendor short code
  name text NOT NULL,
  contact_info jsonb,
  whatsapp_number text,
  is_active boolean DEFAULT true,
  created_at timestamp
)

-- Invoices
invoices (
  id uuid PRIMARY KEY,
  invoice_number text UNIQUE NOT NULL,
  po_number text,
  eway_bill_number text,
  total_amount decimal(12,2),
  status text DEFAULT 'pending',
  created_by uuid REFERENCES users(id),
  created_at timestamp
)

-- Invoice Line Items
invoice_line_items (
  id uuid PRIMARY KEY,
  invoice_id uuid REFERENCES invoices(id),
  order_line_id uuid REFERENCES order_lines(id),
  quantity_invoiced integer NOT NULL,
  unit_price decimal(10,2),
  line_total decimal(12,2),
  adjustment_reason text
)

-- Audit Trail
audit_logs (
  id uuid PRIMARY KEY,
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
  old_values jsonb,
  new_values jsonb,
  user_id uuid REFERENCES users(id),
  timestamp timestamp DEFAULT now(),
  ip_address inet,
  user_agent text
)
```

## Security Architecture

### Row Level Security (RLS)
- All tables protected with RLS policies
- Role-based data access at database level
- Dynamic policies based on user permissions
- Audit trail for all sensitive operations

### Permission Matrix
```typescript
interface Permissions {
  // Order Management
  VIEW_ALL_ORDERS: boolean;
  VIEW_OWN_ORDERS: boolean;
  CREATE_ORDERS: boolean;
  EDIT_ORDERS: boolean;
  DELETE_ORDERS: boolean;
  VIEW_ORDER_PRICES: boolean;
  VIEW_CUSTOMER_NAMES: boolean;
  
  // CT Management
  ASSIGN_CT_NUMBERS: boolean;
  OVERRIDE_DUPLICATE_CT: boolean;
  APPROVE_DUPLICATE_CT: boolean;
  
  // Workflow Operations
  MANAGE_KITTING_PACKING: boolean;
  MANAGE_SCREENING_QC: boolean;
  MANAGE_NPQC: boolean;
  CREATE_TRANSFERS: boolean;
  
  // Administration
  MANAGE_USERS: boolean;
  MANAGE_ROLES: boolean;
  MANAGE_SYSTEM_SETTINGS: boolean;
  ACCESS_ADMIN_PANEL: boolean;
  
  // Invoicing
  ACCESS_INVOICING: boolean;
  CREATE_INVOICES: boolean;
  UPLOAD_DOCUMENTS: boolean;
  
  // Procurement
  ACCESS_PROCUREMENT: boolean;
  MANAGE_VENDORS: boolean;
  SEND_WHATSAPP: boolean;
}
```

## Real-time Architecture

### Supabase Realtime Subscriptions
```typescript
// Order updates subscription
const orderSubscription = supabase
  .channel('order_changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'order_lines' },
    handleOrderUpdate
  )
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'quantity_logs' },
    handleQuantityUpdate
  )
  .subscribe()

// Role-based subscriptions
const userOrdersFilter = getUserOrdersFilter(userRole, userId)
const filteredSubscription = supabase
  .channel('user_orders')
  .on('postgres_changes',
    { 
      event: '*', 
      schema: 'public', 
      table: 'order_lines',
      filter: userOrdersFilter
    },
    handleFilteredUpdate
  )
  .subscribe()
```

## Component Architecture

### Directory Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Shadcn/ui components
│   ├── forms/          # Form components
│   ├── cards/          # Order card components
│   └── modals/         # Modal dialogs
├── features/           # Feature-based modules
│   ├── auth/           # Authentication
│   ├── orders/         # Order management
│   ├── ct-numbers/     # CT number management
│   ├── fai/            # FAI document handling
│   ├── workflows/      # SB/NP workflows
│   ├── invoicing/      # Invoicing module
│   ├── procurement/    # Procurement features
│   └── admin/          # Admin functionality
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── stores/             # Zustand stores
├── types/              # TypeScript definitions
└── utils/              # Helper functions
```

### State Management Strategy
- **Server State**: React Query for API calls and caching
- **UI State**: React Hook Form for forms, local useState for component state
- **Global State**: Zustand for user session, app-wide settings
- **Real-time State**: Custom hooks wrapping Supabase subscriptions

## Integration Architecture

### WhatsApp Integration Flow
```
Order Action → Frontend → Supabase Edge Function → N8N Webhook → Evolution API → WhatsApp
```

### Label Printing Flow
```
Label Design → ZPL Generation → Frontend → Network Print Server → Zebra Printer
```

### File Storage Strategy
- **FAI Documents**: Supabase Storage with public bucket for images
- **Uploaded Documents**: Private bucket with signed URLs
- **Master Images**: Public bucket with CDN for fast access
- **Generated Reports**: Temporary storage with auto-cleanup

## Performance Considerations

### Database Optimization
- Indexed foreign keys and frequently queried columns
- Materialized views for complex aggregations
- Partitioning for large audit tables
- Connection pooling via Supabase

### Frontend Optimization
- Code splitting by feature modules
- Image optimization and lazy loading
- Virtual scrolling for large lists
- Debounced search and filtering
- React.memo for expensive components

### Caching Strategy
- React Query for API response caching
- Browser storage for user preferences
- CDN for static assets
- Database-level caching for read-heavy queries

## Deployment Architecture

### Production Setup
- **Frontend**: Vercel with automatic deployments
- **Backend**: Supabase Cloud with backup strategy
- **File Storage**: Supabase Storage with CDN
- **Monitoring**: Supabase Dashboard + custom analytics

### Environment Management
- Development, Staging, Production environments
- Environment-specific configuration
- Database migrations via Supabase CLI
- Automated testing in CI/CD pipeline

This architecture provides a solid foundation for the 50,000-100,000 line codebase while maintaining performance, security, and scalability for 20-30 concurrent users.