-- Mini-ERP Order Management QC App Database Schema
-- This file contains the complete database structure for the application

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create custom types
CREATE TYPE order_status AS ENUM (
    'pending_procurement',
    'requested_from_stock', 
    'awaiting_kitting_packing',
    'in_kitting_packing',
    'on_hold_kitting',
    'kitted_awaiting_qc',
    'in_screening_qc',
    'on_hold_qc',
    'qc_passed_ready_invoice',
    'qc_rejected',
    'invoiced',
    'shipped_delivered',
    'cancelled'
);

CREATE TYPE ct_status AS ENUM ('assigned', 'in_use', 'completed');
CREATE TYPE transfer_status AS ENUM ('pending', 'in_transit', 'received', 'rejected');

-- =============================================
-- USERS & AUTHENTICATION
-- =============================================

-- Roles table with permissions
CREATE TABLE IF NOT EXISTS roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role_id UUID REFERENCES roles(id),
    first_name TEXT,
    last_name TEXT,
    whatsapp_number TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MASTER DATA
-- =============================================

-- Customers
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    code TEXT UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Categories
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendors
CREATE TABLE IF NOT EXISTS vendors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    vid TEXT UNIQUE NOT NULL, -- Vendor short code
    name TEXT NOT NULL,
    contact_info JSONB DEFAULT '{}',
    whatsapp_number TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ORDER MANAGEMENT
-- =============================================

-- Order Lines (main entity)
CREATE TABLE IF NOT EXISTS order_lines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    uid TEXT UNIQUE NOT NULL, -- Sequential human-readable ID (A001, A002, etc.)
    customer_id UUID REFERENCES customers(id),
    po_number TEXT,
    po_date DATE,
    customer_part_number TEXT NOT NULL,
    core_part_number TEXT,
    customer_description TEXT,
    bpi_description TEXT, -- Internal shorthand
    product_category_id UUID REFERENCES product_categories(id),
    order_quantity INTEGER NOT NULL CHECK (order_quantity > 0),
    price DECIMAL(10,2),
    lead_time TEXT,
    current_eta DATE,
    vid TEXT, -- Vendor ID
    msc TEXT, -- Master Shipping Carton ID
    assigned_user_ids UUID[] DEFAULT '{}',
    part_mapping_approved BOOLEAN DEFAULT false,
    rfq_eta_date DATE,
    first_eta_date DATE,
    second_eta_date DATE,
    third_eta_date DATE,
    final_eta_date DATE,
    eta_delay_reasons JSONB DEFAULT '{}',
    misc_field_1 TEXT,
    misc_field_2 TEXT,
    misc_field_3 TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Current quantity states (denormalized for performance)
CREATE TABLE IF NOT EXISTS order_line_quantities (
    order_line_id UUID PRIMARY KEY REFERENCES order_lines(id) ON DELETE CASCADE,
    total_order_quantity INTEGER DEFAULT 0,
    pending_procurement INTEGER DEFAULT 0,
    requested_from_stock INTEGER DEFAULT 0,
    awaiting_kitting_packing INTEGER DEFAULT 0,
    in_kitting_packing INTEGER DEFAULT 0,
    on_hold_kitting INTEGER DEFAULT 0,
    kitted_awaiting_qc INTEGER DEFAULT 0,
    in_screening_qc INTEGER DEFAULT 0,
    on_hold_qc INTEGER DEFAULT 0,
    qc_passed_ready_invoice INTEGER DEFAULT 0,
    qc_rejected INTEGER DEFAULT 0,
    invoiced INTEGER DEFAULT 0,
    shipped_delivered INTEGER DEFAULT 0,
    cancelled INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quantity tracking logs
CREATE TABLE IF NOT EXISTS quantity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_line_id UUID REFERENCES order_lines(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- 'move', 'hold', 'reject', 'pass'
    from_state TEXT,
    to_state TEXT,
    quantity_moved INTEGER NOT NULL,
    reason_text TEXT,
    associated_ct_numbers TEXT[] DEFAULT '{}',
    user_id UUID REFERENCES users(id),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CT NUMBER MANAGEMENT
-- =============================================

-- CT Number registry
CREATE TABLE IF NOT EXISTS ct_numbers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ct_number TEXT UNIQUE NOT NULL CHECK (LENGTH(ct_number) = 14), -- 14-digit alphanumeric
    order_line_id UUID REFERENCES order_lines(id),
    status ct_status DEFAULT 'assigned',
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    is_duplicate BOOLEAN DEFAULT false,
    duplicate_approved_by UUID REFERENCES users(id),
    duplicate_approved_at TIMESTAMPTZ,
    original_ct_id UUID REFERENCES ct_numbers(id), -- For duplicates
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CT Number generation templates
CREATE TABLE IF NOT EXISTS ct_generation_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    template_type TEXT CHECK (template_type IN ('fai_master', 'last_used', 'global_prefix')),
    template_string TEXT,
    randomize_length INTEGER DEFAULT 4 CHECK (randomize_length BETWEEN 2 AND 5),
    is_global_default BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FAI DOCUMENT MANAGEMENT
-- =============================================

-- FAI Documents
CREATE TABLE IF NOT EXISTS fai_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_part_number TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by UUID REFERENCES users(id)
);

-- Extracted FAI Images
CREATE TABLE IF NOT EXISTS fai_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    fai_document_id UUID REFERENCES fai_documents(id) ON DELETE CASCADE,
    customer_part_number TEXT NOT NULL,
    image_name TEXT,
    image_path TEXT NOT NULL,
    image_order INTEGER DEFAULT 0,
    extracted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Master Images
CREATE TABLE IF NOT EXISTS master_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_part_number TEXT NOT NULL,
    image_name TEXT,
    image_path TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by UUID REFERENCES users(id)
);

-- =============================================
-- NP LOCATION & TRANSFERS
-- =============================================

-- NP Location specific quantities
CREATE TABLE IF NOT EXISTS np_quantities (
    order_line_id UUID PRIMARY KEY REFERENCES order_lines(id) ON DELETE CASCADE,
    total_quantity_for_np INTEGER DEFAULT 0,
    pending_at_np INTEGER DEFAULT 0,
    in_np_qc INTEGER DEFAULT 0,
    np_qc_passed INTEGER DEFAULT 0,
    np_qc_failed_hold INTEGER DEFAULT 0,
    np_qc_failed_return INTEGER DEFAULT 0,
    sent_to_sb INTEGER DEFAULT 0,
    cancelled_at_np INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inter-location transfers
CREATE TABLE IF NOT EXISTS transfers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    from_location TEXT NOT NULL CHECK (from_location IN ('SB', 'NP')),
    to_location TEXT NOT NULL CHECK (to_location IN ('SB', 'NP')),
    order_line_id UUID REFERENCES order_lines(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    ct_numbers TEXT[] DEFAULT '{}',
    reason TEXT,
    status transfer_status DEFAULT 'pending',
    created_by UUID REFERENCES users(id),
    received_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    received_at TIMESTAMPTZ,
    CONSTRAINT different_locations CHECK (from_location != to_location)
);

-- =============================================
-- INVOICING
-- =============================================

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_number TEXT UNIQUE NOT NULL,
    po_number TEXT,
    eway_bill_number TEXT,
    total_amount DECIMAL(12,2),
    status TEXT DEFAULT 'pending',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice Line Items
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    order_line_id UUID REFERENCES order_lines(id),
    quantity_invoiced INTEGER NOT NULL CHECK (quantity_invoiced > 0),
    unit_price DECIMAL(10,2),
    line_total DECIMAL(12,2),
    adjustment_reason TEXT
);

-- =============================================
-- AUDIT & SYSTEM TABLES
-- =============================================

-- Comprehensive audit trail
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES users(id),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- System settings
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Order Lines indexes
CREATE INDEX IF NOT EXISTS idx_order_lines_uid ON order_lines(uid);
CREATE INDEX IF NOT EXISTS idx_order_lines_customer_part_number ON order_lines(customer_part_number);
CREATE INDEX IF NOT EXISTS idx_order_lines_customer_id ON order_lines(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_lines_created_at ON order_lines(created_at);
CREATE INDEX IF NOT EXISTS idx_order_lines_current_eta ON order_lines(current_eta);

-- CT Numbers indexes
CREATE INDEX IF NOT EXISTS idx_ct_numbers_ct_number ON ct_numbers(ct_number);
CREATE INDEX IF NOT EXISTS idx_ct_numbers_order_line_id ON ct_numbers(order_line_id);

-- Quantity Logs indexes
CREATE INDEX IF NOT EXISTS idx_quantity_logs_order_line_id ON quantity_logs(order_line_id);
CREATE INDEX IF NOT EXISTS idx_quantity_logs_timestamp ON quantity_logs(timestamp);

-- Audit Logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_order_lines_updated_at 
    BEFORE UPDATE ON order_lines 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_line_quantities_updated_at 
    BEFORE UPDATE ON order_line_quantities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_np_quantities_updated_at 
    BEFORE UPDATE ON np_quantities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate next UID
CREATE OR REPLACE FUNCTION generate_next_uid(prefix TEXT DEFAULT 'A')
RETURNS TEXT AS $$
DECLARE
    max_num INTEGER;
    next_num INTEGER;
    next_uid TEXT;
BEGIN
    -- Get the highest number for the given prefix
    SELECT COALESCE(MAX(CAST(SUBSTRING(uid FROM LENGTH(prefix) + 1) AS INTEGER)), 0)
    INTO max_num
    FROM order_lines 
    WHERE uid ~ ('^' || prefix || '[0-9]+$');
    
    next_num := max_num + 1;
    next_uid := prefix || LPAD(next_num::TEXT, 3, '0');
    
    RETURN next_uid;
END;
$$ LANGUAGE plpgsql;

-- Function to initialize order line quantities
CREATE OR REPLACE FUNCTION initialize_order_quantities()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO order_line_quantities (
        order_line_id,
        total_order_quantity,
        pending_procurement
    ) VALUES (
        NEW.id,
        NEW.order_quantity,
        NEW.order_quantity
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-initialize quantities
CREATE TRIGGER initialize_order_quantities_trigger
    AFTER INSERT ON order_lines
    FOR EACH ROW EXECUTE FUNCTION initialize_order_quantities();

-- Function for audit logging
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (table_name, record_id, action, new_values, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'CREATE', to_jsonb(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_values, user_id)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), auth.uid());
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;