-- Initial Data Setup for Mini-ERP Order Management QC App
-- This file populates the database with default roles, permissions, and sample data

-- =============================================
-- INSERT DEFAULT ROLES WITH PERMISSIONS
-- =============================================

-- Director/Admin Role (Full Access)
INSERT INTO roles (name, description, permissions) VALUES
('Director/Admin', 'Full system access with all administrative privileges', '{
    "VIEW_ALL_ORDERS": true,
    "VIEW_OWN_ORDERS": true,
    "CREATE_ORDERS": true,
    "EDIT_ORDERS": true,
    "DELETE_ORDERS": true,
    "VIEW_ORDER_PRICES": true,
    "VIEW_CUSTOMER_NAMES": true,
    "ASSIGN_CT_NUMBERS": true,
    "OVERRIDE_DUPLICATE_CT": true,
    "APPROVE_DUPLICATE_CT": true,
    "MANAGE_KITTING_PACKING": true,
    "MANAGE_SCREENING_QC": true,
    "MANAGE_NPQC": true,
    "CREATE_TRANSFERS": true,
    "MANAGE_USERS": true,
    "MANAGE_ROLES": true,
    "MANAGE_SYSTEM_SETTINGS": true,
    "ACCESS_ADMIN_PANEL": true,
    "ACCESS_INVOICING": true,
    "CREATE_INVOICES": true,
    "UPLOAD_DOCUMENTS": true,
    "ACCESS_PROCUREMENT": true,
    "MANAGE_VENDORS": true,
    "SEND_WHATSAPP": true
}');

-- Accountant Role
INSERT INTO roles (name, description, permissions) VALUES
('Accountant', 'Access to invoicing module and financial reports', '{
    "VIEW_ALL_ORDERS": false,
    "VIEW_OWN_ORDERS": false,
    "CREATE_ORDERS": false,
    "EDIT_ORDERS": false,
    "DELETE_ORDERS": false,
    "VIEW_ORDER_PRICES": true,
    "VIEW_CUSTOMER_NAMES": true,
    "ASSIGN_CT_NUMBERS": false,
    "OVERRIDE_DUPLICATE_CT": false,
    "APPROVE_DUPLICATE_CT": false,
    "MANAGE_KITTING_PACKING": false,
    "MANAGE_SCREENING_QC": false,
    "MANAGE_NPQC": false,
    "CREATE_TRANSFERS": false,
    "MANAGE_USERS": false,
    "MANAGE_ROLES": false,
    "MANAGE_SYSTEM_SETTINGS": false,
    "ACCESS_ADMIN_PANEL": false,
    "ACCESS_INVOICING": true,
    "CREATE_INVOICES": true,
    "UPLOAD_DOCUMENTS": true,
    "ACCESS_PROCUREMENT": false,
    "MANAGE_VENDORS": false,
    "SEND_WHATSAPP": false
}');

-- Warehouse Operations Manager (SB)
INSERT INTO roles (name, description, permissions) VALUES
('Warehouse Ops Manager', 'SB location oversight without price visibility', '{
    "VIEW_ALL_ORDERS": true,
    "VIEW_OWN_ORDERS": true,
    "CREATE_ORDERS": true,
    "EDIT_ORDERS": true,
    "DELETE_ORDERS": false,
    "VIEW_ORDER_PRICES": false,
    "VIEW_CUSTOMER_NAMES": true,
    "ASSIGN_CT_NUMBERS": true,
    "OVERRIDE_DUPLICATE_CT": false,
    "APPROVE_DUPLICATE_CT": true,
    "MANAGE_KITTING_PACKING": true,
    "MANAGE_SCREENING_QC": true,
    "MANAGE_NPQC": false,
    "CREATE_TRANSFERS": true,
    "MANAGE_USERS": false,
    "MANAGE_ROLES": false,
    "MANAGE_SYSTEM_SETTINGS": false,
    "ACCESS_ADMIN_PANEL": false,
    "ACCESS_INVOICING": false,
    "CREATE_INVOICES": false,
    "UPLOAD_DOCUMENTS": false,
    "ACCESS_PROCUREMENT": true,
    "MANAGE_VENDORS": false,
    "SEND_WHATSAPP": true
}');

-- SB Kitting/Packing Staff
INSERT INTO roles (name, description, permissions) VALUES
('SB Kitting/Packing Staff', 'Simplified kitting and packing interface', '{
    "VIEW_ALL_ORDERS": false,
    "VIEW_OWN_ORDERS": true,
    "CREATE_ORDERS": false,
    "EDIT_ORDERS": false,
    "DELETE_ORDERS": false,
    "VIEW_ORDER_PRICES": false,
    "VIEW_CUSTOMER_NAMES": false,
    "ASSIGN_CT_NUMBERS": true,
    "OVERRIDE_DUPLICATE_CT": false,
    "APPROVE_DUPLICATE_CT": false,
    "MANAGE_KITTING_PACKING": true,
    "MANAGE_SCREENING_QC": false,
    "MANAGE_NPQC": false,
    "CREATE_TRANSFERS": false,
    "MANAGE_USERS": false,
    "MANAGE_ROLES": false,
    "MANAGE_SYSTEM_SETTINGS": false,
    "ACCESS_ADMIN_PANEL": false,
    "ACCESS_INVOICING": false,
    "CREATE_INVOICES": false,
    "UPLOAD_DOCUMENTS": false,
    "ACCESS_PROCUREMENT": false,
    "MANAGE_VENDORS": false,
    "SEND_WHATSAPP": false
}');

-- SB Screening/QC Staff
INSERT INTO roles (name, description, permissions) VALUES
('SB Screening/QC Staff', 'Quality control workflow access', '{
    "VIEW_ALL_ORDERS": false,
    "VIEW_OWN_ORDERS": true,
    "CREATE_ORDERS": false,
    "EDIT_ORDERS": false,
    "DELETE_ORDERS": false,
    "VIEW_ORDER_PRICES": false,
    "VIEW_CUSTOMER_NAMES": false,
    "ASSIGN_CT_NUMBERS": false,
    "OVERRIDE_DUPLICATE_CT": false,
    "APPROVE_DUPLICATE_CT": false,
    "MANAGE_KITTING_PACKING": false,
    "MANAGE_SCREENING_QC": true,
    "MANAGE_NPQC": false,
    "CREATE_TRANSFERS": false,
    "MANAGE_USERS": false,
    "MANAGE_ROLES": false,
    "MANAGE_SYSTEM_SETTINGS": false,
    "ACCESS_ADMIN_PANEL": false,
    "ACCESS_INVOICING": false,
    "CREATE_INVOICES": false,
    "UPLOAD_DOCUMENTS": false,
    "ACCESS_PROCUREMENT": false,
    "MANAGE_VENDORS": false,
    "SEND_WHATSAPP": false
}');

-- NP Location Manager
INSERT INTO roles (name, description, permissions) VALUES
('NP Location Manager', 'NP operations without customer names or prices', '{
    "VIEW_ALL_ORDERS": false,
    "VIEW_OWN_ORDERS": true,
    "CREATE_ORDERS": false,
    "EDIT_ORDERS": true,
    "DELETE_ORDERS": false,
    "VIEW_ORDER_PRICES": false,
    "VIEW_CUSTOMER_NAMES": false,
    "ASSIGN_CT_NUMBERS": true,
    "OVERRIDE_DUPLICATE_CT": false,
    "APPROVE_DUPLICATE_CT": false,
    "MANAGE_KITTING_PACKING": false,
    "MANAGE_SCREENING_QC": false,
    "MANAGE_NPQC": true,
    "CREATE_TRANSFERS": true,
    "MANAGE_USERS": false,
    "MANAGE_ROLES": false,
    "MANAGE_SYSTEM_SETTINGS": false,
    "ACCESS_ADMIN_PANEL": false,
    "ACCESS_INVOICING": false,
    "CREATE_INVOICES": false,
    "UPLOAD_DOCUMENTS": false,
    "ACCESS_PROCUREMENT": true,
    "MANAGE_VENDORS": false,
    "SEND_WHATSAPP": false
}');

-- NP QC/Testing Staff
INSERT INTO roles (name, description, permissions) VALUES
('NP QC/Testing Staff', 'NP testing and quality control', '{
    "VIEW_ALL_ORDERS": false,
    "VIEW_OWN_ORDERS": true,
    "CREATE_ORDERS": false,
    "EDIT_ORDERS": false,
    "DELETE_ORDERS": false,
    "VIEW_ORDER_PRICES": false,
    "VIEW_CUSTOMER_NAMES": false,
    "ASSIGN_CT_NUMBERS": true,
    "OVERRIDE_DUPLICATE_CT": false,
    "APPROVE_DUPLICATE_CT": false,
    "MANAGE_KITTING_PACKING": false,
    "MANAGE_SCREENING_QC": false,
    "MANAGE_NPQC": true,
    "CREATE_TRANSFERS": false,
    "MANAGE_USERS": false,
    "MANAGE_ROLES": false,
    "MANAGE_SYSTEM_SETTINGS": false,
    "ACCESS_ADMIN_PANEL": false,
    "ACCESS_INVOICING": false,
    "CREATE_INVOICES": false,
    "UPLOAD_DOCUMENTS": false,
    "ACCESS_PROCUREMENT": false,
    "MANAGE_VENDORS": false,
    "SEND_WHATSAPP": false
}');

-- Procurement Staff
INSERT INTO roles (name, description, permissions) VALUES
('Procurement Staff', 'Vendor communication and procurement tools', '{
    "VIEW_ALL_ORDERS": true,
    "VIEW_OWN_ORDERS": true,
    "CREATE_ORDERS": false,
    "EDIT_ORDERS": true,
    "DELETE_ORDERS": false,
    "VIEW_ORDER_PRICES": false,
    "VIEW_CUSTOMER_NAMES": true,
    "ASSIGN_CT_NUMBERS": false,
    "OVERRIDE_DUPLICATE_CT": false,
    "APPROVE_DUPLICATE_CT": false,
    "MANAGE_KITTING_PACKING": false,
    "MANAGE_SCREENING_QC": false,
    "MANAGE_NPQC": false,
    "CREATE_TRANSFERS": false,
    "MANAGE_USERS": false,
    "MANAGE_ROLES": false,
    "MANAGE_SYSTEM_SETTINGS": false,
    "ACCESS_ADMIN_PANEL": false,
    "ACCESS_INVOICING": false,
    "CREATE_INVOICES": false,
    "UPLOAD_DOCUMENTS": false,
    "ACCESS_PROCUREMENT": true,
    "MANAGE_VENDORS": true,
    "SEND_WHATSAPP": true
}');

-- =============================================
-- INSERT DEFAULT CUSTOMERS
-- =============================================

INSERT INTO customers (name, code, is_active) VALUES
('HP Inc.', 'HP', true),
('Lenovo Group', 'LEN', true),
('Dell Technologies', 'DELL', true),
('ASUS', 'ASUS', true),
('Acer Inc.', 'ACER', true);

-- =============================================
-- INSERT DEFAULT PRODUCT CATEGORIES
-- =============================================

INSERT INTO product_categories (name, description, is_active, sort_order) VALUES
('Laptop LCD Screen', 'Laptop LCD displays and screens', true, 1),
('Laptop Keyboard', 'Laptop keyboards and keypads', true, 2),
('Laptop Battery', 'Laptop batteries and power units', true, 3),
('Laptop Motherboard', 'Laptop motherboards and main boards', true, 4),
('Laptop Memory (RAM)', 'Laptop memory modules', true, 5),
('Laptop Hard Drive', 'Laptop storage devices', true, 6),
('Laptop Charger/Adapter', 'Laptop power adapters and chargers', true, 7),
('Laptop Speaker', 'Laptop audio components', true, 8),
('Laptop WiFi Card', 'Laptop wireless networking components', true, 9),
('Laptop Webcam', 'Laptop camera modules', true, 10),
('Laptop Cooling Fan', 'Laptop cooling and thermal components', true, 11),
('Laptop Top Cover', 'Laptop exterior case components', true, 12),
('Laptop Bottom Case', 'Laptop base and bottom case parts', true, 13),
('Laptop Hinges', 'Laptop hinge and bracket components', true, 14),
('Other Components', 'Miscellaneous laptop parts and accessories', true, 15);

-- =============================================
-- INSERT DEFAULT VENDORS
-- =============================================

INSERT INTO vendors (vid, name, contact_info, is_active) VALUES
('VENDOR001', 'Prime Components Ltd', '{"email": "sales@primecomp.com", "phone": "+1234567890"}', true),
('VENDOR002', 'TechSource Global', '{"email": "orders@techsource.com", "phone": "+1234567891"}', true),
('VENDOR003', 'ElectroMax Supply', '{"email": "info@electromax.com", "phone": "+1234567892"}', true),
('VENDOR004', 'ComponentHub Asia', '{"email": "sales@comphub.asia", "phone": "+1234567893"}', true),
('VENDOR005', 'Digital Parts Direct', '{"email": "orders@digitaldirect.com", "phone": "+1234567894"}', true);

-- =============================================
-- INSERT DEFAULT SYSTEM SETTINGS
-- =============================================

INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('uid_prefix', '"A"', 'Default prefix for order line UIDs'),
('eta_colors', '{
    "rfq": {"color": "gray", "label": "RFQ ETA"},
    "first": {"color": "green", "label": "First ETA"},
    "second": {"color": "yellow", "label": "Second ETA"},
    "third": {"color": "red", "label": "Third ETA"},
    "final": {"color": "red", "blink": true, "label": "Final ETA"}
}', 'ETA color coding configuration'),
('rejection_reasons', '[
    "Cosmetic Damage",
    "Functional Failure",
    "Wrong Part Number",
    "Specification Mismatch",
    "Quality Issues",
    "Packaging Damage",
    "Incomplete Item",
    "DOA (Dead on Arrival)",
    "Other"
]', 'Predefined rejection reasons'),
('hold_reasons', '[
    "Pending Customer Clarification",
    "Quality Review Required",
    "Awaiting Parts",
    "Technical Issue",
    "Packaging Issue",
    "Documentation Missing",
    "Other"
]', 'Predefined hold reasons'),
('whatsapp_settings', '{
    "enabled": false,
    "n8n_webhook_url": "",
    "evolution_api_url": "",
    "default_groups": {
        "directors": [],
        "qc_alerts": [],
        "np_notifications": []
    }
}', 'WhatsApp integration configuration'),
('new_device_delay', '0', 'Access delay in minutes for new device logins (0 = disabled)'),
('label_printer_settings', '{
    "nps_url": "",
    "default_printers": {},
    "label_storage_path": "/labels"
}', 'Label printing and NPS configuration');

-- =============================================
-- INSERT DEFAULT CT GENERATION TEMPLATES
-- =============================================

INSERT INTO ct_generation_templates (name, template_type, template_string, randomize_length, is_global_default) VALUES
('Global Default Template', 'global_prefix', 'HP', 4, true),
('FAI Master Template', 'fai_master', '', 3, false),
('Last Used Template', 'last_used', '', 4, false);

-- =============================================
-- SAMPLE ORDER DATA (Optional - for testing)
-- =============================================

-- Note: Commented out sample orders to avoid conflicts with real data
-- Uncomment these for development/testing purposes

/*
-- Sample order lines for testing
DO $$
DECLARE
    hp_customer_id UUID;
    lenovo_customer_id UUID;
    lcd_category_id UUID;
    keyboard_category_id UUID;
    director_role_id UUID;
BEGIN
    -- Get IDs for sample data
    SELECT id INTO hp_customer_id FROM customers WHERE name = 'HP Inc.';
    SELECT id INTO lenovo_customer_id FROM customers WHERE name = 'Lenovo Group';
    SELECT id INTO lcd_category_id FROM product_categories WHERE name = 'Laptop LCD Screen';
    SELECT id INTO keyboard_category_id FROM product_categories WHERE name = 'Laptop Keyboard';
    SELECT id INTO director_role_id FROM roles WHERE name = 'Director/Admin';
    
    -- Insert sample order lines
    INSERT INTO order_lines (
        uid, customer_id, po_number, po_date, customer_part_number, 
        customer_description, bpi_description, product_category_id, 
        order_quantity, price, lead_time, current_eta
    ) VALUES
    ('A001', hp_customer_id, 'PO2024001', '2024-01-15', 'L12345-601', 
     'EliteBook 840 G10 LCD Screen 14"', 'Laptop 840 G10 LCD', lcd_category_id, 
     10, 125.50, '7 days', '2024-01-22'),
    ('A002', hp_customer_id, 'PO2024001', '2024-01-15', 'L12346-602', 
     'EliteBook 840 G10 Keyboard US Layout', 'Laptop 840 G10 KB', keyboard_category_id, 
     5, 45.75, '5 days', '2024-01-20'),
    ('A003', lenovo_customer_id, 'LEN-PO-001', '2024-01-16', 'FRU-01CV123', 
     'ThinkPad X1 Carbon LCD Panel', 'ThinkPad X1 LCD', lcd_category_id, 
     8, 180.00, 'Ready Stock', '2024-01-17');
END $$;
*/