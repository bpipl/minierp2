-- Row Level Security (RLS) Policies for Mini-ERP Order Management QC App
-- These policies ensure users can only access data they're permitted to see

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_line_quantities ENABLE ROW LEVEL SECURITY;
ALTER TABLE quantity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ct_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ct_generation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE fai_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE fai_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE np_quantities ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HELPER FUNCTIONS FOR PERMISSIONS
-- =============================================

-- Function to get user's role permissions
CREATE OR REPLACE FUNCTION get_user_permissions()
RETURNS JSONB AS $$
DECLARE
    user_permissions JSONB;
BEGIN
    SELECT r.permissions INTO user_permissions
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid();
    
    RETURN COALESCE(user_permissions, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE((get_user_permissions() ->> permission_name)::BOOLEAN, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is Director/Admin
CREATE OR REPLACE FUNCTION is_director_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN has_permission('ACCESS_ADMIN_PANEL');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- USERS TABLE POLICIES
-- =============================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON users
    FOR SELECT USING (id = auth.uid());

-- Directors/Admins can read all users
CREATE POLICY "Directors can read all users" ON users
    FOR SELECT USING (is_director_admin());

-- Directors/Admins can manage users
CREATE POLICY "Directors can manage users" ON users
    FOR ALL USING (is_director_admin());

-- =============================================
-- ROLES TABLE POLICIES
-- =============================================

-- Users can read roles (for UI display)
CREATE POLICY "Users can read roles" ON roles
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only Directors/Admins can manage roles
CREATE POLICY "Directors can manage roles" ON roles
    FOR ALL USING (is_director_admin());

-- =============================================
-- MASTER DATA POLICIES
-- =============================================

-- Customers: All authenticated users can read, Directors can manage
CREATE POLICY "All users can read customers" ON customers
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Directors can manage customers" ON customers
    FOR ALL USING (is_director_admin());

-- Product Categories: Similar to customers
CREATE POLICY "All users can read product categories" ON product_categories
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Directors can manage product categories" ON product_categories
    FOR ALL USING (is_director_admin());

-- Vendors: Only procurement staff and directors
CREATE POLICY "Procurement can read vendors" ON vendors
    FOR SELECT USING (
        has_permission('ACCESS_PROCUREMENT') OR 
        is_director_admin()
    );

CREATE POLICY "Procurement can manage vendors" ON vendors
    FOR ALL USING (
        has_permission('MANAGE_VENDORS') OR 
        is_director_admin()
    );

-- =============================================
-- ORDER LINES POLICIES
-- =============================================

-- Base read policy: Users can see orders based on permissions
CREATE POLICY "Users can read permitted orders" ON order_lines
    FOR SELECT USING (
        has_permission('VIEW_ALL_ORDERS') OR
        (has_permission('VIEW_OWN_ORDERS') AND created_by = auth.uid()) OR
        (auth.uid() = ANY(assigned_user_ids))
    );

-- Create orders: Users with create permission
CREATE POLICY "Users can create orders" ON order_lines
    FOR INSERT WITH CHECK (has_permission('CREATE_ORDERS'));

-- Update orders: Owners, assigned users, or with edit permission
CREATE POLICY "Users can update permitted orders" ON order_lines
    FOR UPDATE USING (
        has_permission('EDIT_ORDERS') OR
        created_by = auth.uid() OR
        (auth.uid() = ANY(assigned_user_ids))
    );

-- Delete orders: Only Directors/Admins
CREATE POLICY "Directors can delete orders" ON order_lines
    FOR DELETE USING (is_director_admin());

-- =============================================
-- QUANTITY TRACKING POLICIES
-- =============================================

-- Order Line Quantities: Same as order lines
CREATE POLICY "Users can read order quantities" ON order_line_quantities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM order_lines ol 
            WHERE ol.id = order_line_quantities.order_line_id
        )
    );

CREATE POLICY "Users can update order quantities" ON order_line_quantities
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM order_lines ol 
            WHERE ol.id = order_line_quantities.order_line_id
            AND (
                has_permission('EDIT_ORDERS') OR
                ol.created_by = auth.uid() OR
                (auth.uid() = ANY(ol.assigned_user_ids))
            )
        )
    );

-- Quantity Logs: Read based on order access
CREATE POLICY "Users can read quantity logs" ON quantity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM order_lines ol 
            WHERE ol.id = quantity_logs.order_line_id
        )
    );

CREATE POLICY "Users can create quantity logs" ON quantity_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM order_lines ol 
            WHERE ol.id = quantity_logs.order_line_id
        )
    );

-- =============================================
-- CT NUMBER POLICIES
-- =============================================

-- Read CT numbers: Based on order access
CREATE POLICY "Users can read CT numbers" ON ct_numbers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM order_lines ol 
            WHERE ol.id = ct_numbers.order_line_id
        )
    );

-- Assign CT numbers: Users with permission
CREATE POLICY "Users can assign CT numbers" ON ct_numbers
    FOR INSERT WITH CHECK (
        has_permission('ASSIGN_CT_NUMBERS') AND
        EXISTS (
            SELECT 1 FROM order_lines ol 
            WHERE ol.id = ct_numbers.order_line_id
        )
    );

-- Update CT numbers: For approval workflow
CREATE POLICY "Users can update CT numbers" ON ct_numbers
    FOR UPDATE USING (
        has_permission('ASSIGN_CT_NUMBERS') OR
        has_permission('APPROVE_DUPLICATE_CT')
    );

-- =============================================
-- FAI DOCUMENT POLICIES
-- =============================================

-- FAI Documents: Read for all, upload for authorized
CREATE POLICY "Users can read FAI documents" ON fai_documents
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized users can upload FAI" ON fai_documents
    FOR INSERT WITH CHECK (
        has_permission('EDIT_ORDERS') OR 
        is_director_admin()
    );

-- FAI Images: Same as documents
CREATE POLICY "Users can read FAI images" ON fai_images
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Master Images: Same as FAI
CREATE POLICY "Users can read master images" ON master_images
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized users can upload master images" ON master_images
    FOR INSERT WITH CHECK (
        has_permission('EDIT_ORDERS') OR 
        is_director_admin()
    );

-- =============================================
-- NP LOCATION POLICIES
-- =============================================

-- NP Quantities: Only NP staff and Directors
CREATE POLICY "NP staff can read NP quantities" ON np_quantities
    FOR SELECT USING (
        has_permission('MANAGE_NPQC') OR 
        is_director_admin()
    );

CREATE POLICY "NP staff can manage NP quantities" ON np_quantities
    FOR ALL USING (
        has_permission('MANAGE_NPQC') OR 
        is_director_admin()
    );

-- Transfers: Based on location permissions
CREATE POLICY "Users can read transfers" ON transfers
    FOR SELECT USING (
        (from_location = 'SB' AND has_permission('MANAGE_KITTING_PACKING')) OR
        (from_location = 'NP' AND has_permission('MANAGE_NPQC')) OR
        (to_location = 'SB' AND has_permission('MANAGE_KITTING_PACKING')) OR
        (to_location = 'NP' AND has_permission('MANAGE_NPQC')) OR
        is_director_admin()
    );

CREATE POLICY "Users can create transfers" ON transfers
    FOR INSERT WITH CHECK (
        has_permission('CREATE_TRANSFERS') OR
        is_director_admin()
    );

CREATE POLICY "Users can update transfers" ON transfers
    FOR UPDATE USING (
        created_by = auth.uid() OR
        has_permission('CREATE_TRANSFERS') OR
        is_director_admin()
    );

-- =============================================
-- INVOICING POLICIES
-- =============================================

-- Invoices: Accountants and Directors
CREATE POLICY "Accountants can read invoices" ON invoices
    FOR SELECT USING (
        has_permission('ACCESS_INVOICING') OR 
        is_director_admin()
    );

CREATE POLICY "Accountants can manage invoices" ON invoices
    FOR ALL USING (
        has_permission('CREATE_INVOICES') OR 
        is_director_admin()
    );

-- Invoice Line Items: Same as invoices
CREATE POLICY "Accountants can read invoice items" ON invoice_line_items
    FOR SELECT USING (
        has_permission('ACCESS_INVOICING') OR 
        is_director_admin()
    );

CREATE POLICY "Accountants can manage invoice items" ON invoice_line_items
    FOR ALL USING (
        has_permission('CREATE_INVOICES') OR 
        is_director_admin()
    );

-- =============================================
-- AUDIT & SYSTEM POLICIES
-- =============================================

-- Audit Logs: Read-only for Directors, limited read for others
CREATE POLICY "Directors can read all audit logs" ON audit_logs
    FOR SELECT USING (is_director_admin());

CREATE POLICY "Users can read own audit logs" ON audit_logs
    FOR SELECT USING (user_id = auth.uid());

-- System Settings: Directors only
CREATE POLICY "Directors can manage system settings" ON system_settings
    FOR ALL USING (is_director_admin());

-- =============================================
-- CT GENERATION TEMPLATES POLICIES
-- =============================================

CREATE POLICY "Users can read CT templates" ON ct_generation_templates
    FOR SELECT USING (
        has_permission('ASSIGN_CT_NUMBERS') OR 
        is_director_admin()
    );

CREATE POLICY "Users can manage CT templates" ON ct_generation_templates
    FOR ALL USING (
        has_permission('ASSIGN_CT_NUMBERS') OR 
        is_director_admin()
    );

-- =============================================
-- SPECIAL POLICIES FOR REAL-TIME SUBSCRIPTIONS
-- =============================================

-- Enable real-time for authenticated users on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE order_lines;
ALTER PUBLICATION supabase_realtime ADD TABLE order_line_quantities;
ALTER PUBLICATION supabase_realtime ADD TABLE quantity_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE ct_numbers;
ALTER PUBLICATION supabase_realtime ADD TABLE transfers;