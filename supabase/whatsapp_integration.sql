-- WhatsApp Integration Database Schema
-- Tables for WhatsApp messaging, templates, and N8N webhook management

-- WhatsApp Message Templates
CREATE TABLE whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('qc_alerts', 'procurement', 'transfers', 'approvals', 'security', 'general')),
    content TEXT NOT NULL,
    placeholders TEXT[], -- Array of placeholder names like ['{{UID}}', '{{CustomerName}}']
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- WhatsApp Messages (sent message history)
CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES whatsapp_templates(id),
    content TEXT NOT NULL,
    recipients TEXT[], -- Array of phone numbers
    recipient_groups TEXT[], -- Array of group names
    order_line_id VARCHAR(20) REFERENCES order_lines(uid),
    triggered_by UUID REFERENCES auth.users(id) NOT NULL,
    message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('manual', 'qc_rejection', 'part_mapping_approval', 'transfer_notification', 'security_alert', 'eta_update', 'procurement_request')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'cancelled')),
    delivery_status VARCHAR(20) CHECK (delivery_status IN ('delivered', 'read', 'failed', 'pending')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    sent_at TIMESTAMPTZ DEFAULT now(),
    delivered_at TIMESTAMPTZ,
    error_message TEXT
);

-- WhatsApp Groups Configuration
CREATE TABLE whatsapp_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    members TEXT[], -- Array of phone numbers
    permissions TEXT[], -- Array of role names that can send to this group
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- WhatsApp Users (internal staff WhatsApp numbers)
CREATE TABLE whatsapp_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    groups TEXT[], -- Array of group names
    is_active BOOLEAN DEFAULT true,
    role VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- N8N Webhook Configuration
CREATE TABLE whatsapp_webhook_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    message_type VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    auth_token TEXT,
    headers JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default WhatsApp templates
INSERT INTO whatsapp_templates (name, category, content, placeholders, is_default, created_by) VALUES
('QC Rejection Alert', 'qc_alerts', '🚨 QC REJECTION ALERT

Order: {{UID}}
Part: {{CustomerPartNumber}}
CT: {{CTNumbers}}
Reason: {{Reason}}

Immediate attention required.', ARRAY['{{UID}}', '{{CustomerPartNumber}}', '{{CTNumbers}}', '{{Reason}}'], true, (SELECT id FROM auth.users WHERE email = 'admin@minierp.test')),

('Pull Part from Stock', 'procurement', '📦 STOCK PULL REQUEST

Order: {{UID}}
Part: {{CustomerPartNumber}}
Description: {{BPIDescription}}
Quantity: {{OrderQuantity}}

Please pull from stock and update system.', ARRAY['{{UID}}', '{{CustomerPartNumber}}', '{{BPIDescription}}', '{{OrderQuantity}}'], true, (SELECT id FROM auth.users WHERE email = 'admin@minierp.test')),

('Transfer to NP', 'transfers', '🔄 TRANSFER TO NP

Order: {{UID}}
Part: {{CustomerPartNumber}}
Quantity: {{OrderQuantity}}
CT Numbers: {{CTNumbers}}

Ready for NP processing.', ARRAY['{{UID}}', '{{CustomerPartNumber}}', '{{OrderQuantity}}', '{{CTNumbers}}'], true, (SELECT id FROM auth.users WHERE email = 'admin@minierp.test')),

('Part Mapping Approval', 'approvals', '✅ APPROVE PART MAPPING

Customer Part: {{CustomerPartNumber}}
Our Description: {{BPIDescription}}
Order: {{UID}}
Quantity: {{OrderQuantity}}

Please confirm mapping is correct.', ARRAY['{{CustomerPartNumber}}', '{{BPIDescription}}', '{{UID}}', '{{OrderQuantity}}'], true, (SELECT id FROM auth.users WHERE email = 'admin@minierp.test')),

('New Device Login Alert', 'security', '🔐 SECURITY ALERT

User: {{UserName}}
New device login detected
Time: {{DateTime}}

If this was not authorized, please investigate immediately.', ARRAY['{{UserName}}', '{{DateTime}}'], true, (SELECT id FROM auth.users WHERE email = 'admin@minierp.test'));

-- Insert default WhatsApp groups
INSERT INTO whatsapp_groups (name, description, permissions, is_active) VALUES
('directors', 'Management and Directors', ARRAY['director', 'admin'], true),
('sbStaff', 'SB Location Staff', ARRAY['director', 'admin', 'warehouse_ops_manager'], true),
('npStaff', 'NP Location Staff', ARRAY['director', 'admin', 'np_location_manager'], true),
('procurement', 'Procurement Team', ARRAY['director', 'admin', 'procurement_staff'], true);

-- Add RLS policies for WhatsApp tables

-- WhatsApp Templates: Admins can manage, others can read active templates
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage whatsapp_templates" ON whatsapp_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.user_id = auth.uid() 
            AND r.name IN ('Director/Admin', 'Accountant')
        )
    );

CREATE POLICY "Users can view active whatsapp_templates" ON whatsapp_templates
    FOR SELECT USING (is_active = true);

-- WhatsApp Messages: Users can see their own messages and relevant ones
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and manage their whatsapp_messages" ON whatsapp_messages
    FOR ALL USING (
        triggered_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.user_id = auth.uid() 
            AND r.name IN ('Director/Admin', 'Accountant')
        )
    );

-- WhatsApp Groups: Admins can manage, others can read based on permissions
ALTER TABLE whatsapp_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage whatsapp_groups" ON whatsapp_groups
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.user_id = auth.uid() 
            AND r.name IN ('Director/Admin')
        )
    );

CREATE POLICY "Users can view accessible whatsapp_groups" ON whatsapp_groups
    FOR SELECT USING (
        is_active = true AND
        EXISTS (
            SELECT 1 FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.user_id = auth.uid() 
            AND r.name = ANY(permissions)
        )
    );

-- WhatsApp Users: Admins can manage, users can view based on role
ALTER TABLE whatsapp_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage whatsapp_users" ON whatsapp_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.user_id = auth.uid() 
            AND r.name IN ('Director/Admin')
        )
    );

CREATE POLICY "Users can view active whatsapp_users" ON whatsapp_users
    FOR SELECT USING (is_active = true);

-- Webhook Configs: Only admins can manage
ALTER TABLE whatsapp_webhook_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage webhook_configs" ON whatsapp_webhook_configs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.user_id = auth.uid() 
            AND r.name IN ('Director/Admin')
        )
    );

-- Create indexes for performance
CREATE INDEX idx_whatsapp_messages_order_line_id ON whatsapp_messages(order_line_id);
CREATE INDEX idx_whatsapp_messages_message_type ON whatsapp_messages(message_type);
CREATE INDEX idx_whatsapp_messages_sent_at ON whatsapp_messages(sent_at);
CREATE INDEX idx_whatsapp_templates_category ON whatsapp_templates(category);
CREATE INDEX idx_whatsapp_templates_active ON whatsapp_templates(is_active);
CREATE INDEX idx_whatsapp_users_phone_number ON whatsapp_users(phone_number);
CREATE INDEX idx_whatsapp_webhook_configs_message_type ON whatsapp_webhook_configs(message_type);

-- Add updated_at triggers for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_whatsapp_templates_updated_at BEFORE UPDATE ON whatsapp_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_groups_updated_at BEFORE UPDATE ON whatsapp_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_users_updated_at BEFORE UPDATE ON whatsapp_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_webhook_configs_updated_at BEFORE UPDATE ON whatsapp_webhook_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();