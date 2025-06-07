-- WhatsApp Provider Management Schema
-- Tables for dual provider system (Meta Cloud API + N8N Evolution API)

-- WhatsApp Provider Configuration
CREATE TABLE whatsapp_provider_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('meta_cloud_api', 'n8n_evolution_api')),
    is_active BOOLEAN DEFAULT true,
    fallback_provider VARCHAR(50) CHECK (fallback_provider IN ('meta_cloud_api', 'n8n_evolution_api')),
    
    -- Meta Cloud API Configuration
    meta_config JSONB, -- Contains: appId, appSecret, businessAccountId, phoneNumberId, accessToken, webhookVerifyToken, apiVersion
    
    -- N8N Evolution API Configuration  
    n8n_config JSONB, -- Contains: webhookUrl, authToken, headers
    
    -- Cost Optimization Settings
    cost_optimization JSONB DEFAULT '{"useMetaForCritical": false, "useN8NForBulk": true}',
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- WhatsApp Messages Enhanced (with provider info)
CREATE TABLE whatsapp_messages_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('meta_cloud_api', 'n8n_evolution_api')),
    provider_message_id VARCHAR(255), -- Provider's message ID
    
    -- Message Details
    template_id UUID REFERENCES whatsapp_templates(id),
    content TEXT NOT NULL,
    message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('text', 'template', 'interactive')),
    
    -- Recipients
    to_phone_number VARCHAR(20) NOT NULL,
    recipients TEXT[], -- Array of phone numbers (for group messages)
    recipient_groups TEXT[], -- Array of group names
    
    -- Interactive Message Data
    interactive_data JSONB, -- Interactive message structure for Meta API
    
    -- Template Data
    template_name VARCHAR(255),
    template_language VARCHAR(10) DEFAULT 'en',
    template_parameters JSONB,
    
    -- Status and Tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'delivered', 'read', 'failed', 'cancelled')),
    delivery_status VARCHAR(20) CHECK (delivery_status IN ('delivered', 'read', 'failed', 'pending')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Order Context
    order_line_id VARCHAR(20) REFERENCES order_lines(uid),
    triggered_by UUID REFERENCES auth.users(id) NOT NULL,
    trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('manual', 'qc_rejection', 'part_mapping_approval', 'transfer_notification', 'security_alert', 'eta_update', 'procurement_request')),
    
    -- Timestamps
    sent_at TIMESTAMPTZ DEFAULT now(),
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    
    -- Error Handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3
);

-- WhatsApp Approval Workflows
CREATE TABLE whatsapp_approval_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('ct_duplicate_approval', 'qc_rejection_approval', 'part_mapping_approval', 'transfer_authorization')),
    
    -- Order Context
    order_line_id VARCHAR(20) NOT NULL REFERENCES order_lines(uid),
    requested_by UUID NOT NULL REFERENCES auth.users(id),
    
    -- Approval Details
    approvers TEXT[] NOT NULL, -- Array of phone numbers or user IDs
    context JSONB NOT NULL, -- Workflow-specific data
    message JSONB NOT NULL, -- Interactive message structure
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    responses JSONB DEFAULT '[]', -- Array of approval responses
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ
);

-- WhatsApp Provider Cost Tracking
CREATE TABLE whatsapp_provider_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('meta_cloud_api', 'n8n_evolution_api')),
    date DATE NOT NULL,
    
    -- Message Counts
    messages_sent INTEGER DEFAULT 0,
    text_messages INTEGER DEFAULT 0,
    template_messages INTEGER DEFAULT 0,
    interactive_messages INTEGER DEFAULT 0,
    
    -- Cost Data
    cost_amount DECIMAL(10,4) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Meta API specific costs
    conversation_costs DECIMAL(10,4) DEFAULT 0,
    template_costs DECIMAL(10,4) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(provider, date)
);

-- WhatsApp Webhook Events (for Meta API)
CREATE TABLE whatsapp_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- 'message', 'status', 'button_response'
    
    -- Webhook Data
    webhook_id VARCHAR(255),
    phone_number_id VARCHAR(255),
    from_phone VARCHAR(20),
    message_id VARCHAR(255),
    
    -- Event Data
    event_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    
    -- Workflow Context (for approval responses)
    workflow_id UUID REFERENCES whatsapp_approval_workflows(id),
    response_action VARCHAR(20), -- 'approve', 'reject'
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies

-- Provider Configs: Only admins can manage
ALTER TABLE whatsapp_provider_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage provider configs" ON whatsapp_provider_configs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.user_id = auth.uid() 
            AND r.name IN ('Director/Admin')
        )
    );

-- Enhanced Messages: Users can see their own messages and relevant ones
ALTER TABLE whatsapp_messages_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and manage their whatsapp_messages_v2" ON whatsapp_messages_v2
    FOR ALL USING (
        triggered_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.user_id = auth.uid() 
            AND r.name IN ('Director/Admin', 'Accountant')
        )
    );

-- Approval Workflows: Users can see workflows they're involved in
ALTER TABLE whatsapp_approval_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view relevant approval workflows" ON whatsapp_approval_workflows
    FOR SELECT USING (
        requested_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.user_id = auth.uid() 
            AND r.name IN ('Director/Admin')
        )
    );

CREATE POLICY "Admins can manage approval workflows" ON whatsapp_approval_workflows
    FOR INSERT USING (
        EXISTS (
            SELECT 1 FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.user_id = auth.uid() 
            AND r.name IN ('Director/Admin', 'Warehouse Ops Manager', 'SB Kitting/Packing Staff', 'SB Screening/QC Staff')
        )
    );

-- Cost Tracking: Only admins can view
ALTER TABLE whatsapp_provider_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view cost tracking" ON whatsapp_provider_costs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.user_id = auth.uid() 
            AND r.name IN ('Director/Admin', 'Accountant')
        )
    );

-- Webhook Events: Only system can manage
ALTER TABLE whatsapp_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view webhook events" ON whatsapp_webhook_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.user_id = auth.uid() 
            AND r.name IN ('Director/Admin')
        )
    );

-- Create indexes for performance
CREATE INDEX idx_whatsapp_messages_v2_provider ON whatsapp_messages_v2(provider);
CREATE INDEX idx_whatsapp_messages_v2_order_line_id ON whatsapp_messages_v2(order_line_id);
CREATE INDEX idx_whatsapp_messages_v2_status ON whatsapp_messages_v2(status);
CREATE INDEX idx_whatsapp_messages_v2_sent_at ON whatsapp_messages_v2(sent_at);
CREATE INDEX idx_whatsapp_approval_workflows_status ON whatsapp_approval_workflows(status);
CREATE INDEX idx_whatsapp_approval_workflows_expires_at ON whatsapp_approval_workflows(expires_at);
CREATE INDEX idx_whatsapp_provider_costs_provider_date ON whatsapp_provider_costs(provider, date);
CREATE INDEX idx_whatsapp_webhook_events_processed ON whatsapp_webhook_events(processed);
CREATE INDEX idx_whatsapp_webhook_events_workflow_id ON whatsapp_webhook_events(workflow_id);

-- Add updated_at triggers
CREATE TRIGGER update_whatsapp_provider_configs_updated_at BEFORE UPDATE ON whatsapp_provider_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default provider configuration
INSERT INTO whatsapp_provider_configs (provider, is_active, n8n_config, cost_optimization) VALUES (
    'n8n_evolution_api',
    true,
    jsonb_build_object(
        'webhookUrl', '',
        'authToken', null,
        'headers', null
    ),
    jsonb_build_object(
        'useMetaForCritical', false,
        'useN8NForBulk', true,
        'maxMetaMessagesPerDay', null
    )
);