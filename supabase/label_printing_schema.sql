-- Label Printing System Schema

-- Label Templates Table
CREATE TABLE IF NOT EXISTS label_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('ct_label', 'shipping', 'internal', 'generic', 'custom')),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    canvas_data TEXT NOT NULL, -- JSON stringified Fabric.js canvas
    label_size JSONB NOT NULL, -- {width, height, unit}
    is_default BOOLEAN DEFAULT FALSE,
    permissions JSONB, -- {roles: [], users: []}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT unique_default_per_category UNIQUE (category, customer_id, is_default) 
        DEFERRABLE INITIALLY DEFERRED
);

-- Printer Configurations Table
CREATE TABLE IF NOT EXISTS printer_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    ip_address INET NOT NULL,
    port INTEGER NOT NULL DEFAULT 9100,
    location VARCHAR(10) NOT NULL CHECK (location IN ('SB', 'NP')),
    model VARCHAR(100),
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    capabilities JSONB, -- {max_width, max_height, dpi, color}
    nps_url VARCHAR(500), -- Network Print Server URL if applicable
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_default_per_location UNIQUE (location, is_default) 
        DEFERRABLE INITIALLY DEFERRED
);

-- Print Jobs Table (for tracking)
CREATE TABLE IF NOT EXISTS print_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID REFERENCES label_templates(id) ON DELETE SET NULL,
    printer_id UUID REFERENCES printer_configs(id) ON DELETE SET NULL,
    order_line_id UUID REFERENCES order_lines(id) ON DELETE CASCADE,
    data JSONB, -- Dynamic data used for printing
    zpl_content TEXT, -- Generated ZPL code
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'printing', 'completed', 'failed')),
    error_message TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Quick Print Templates (Predefined)
CREATE TABLE IF NOT EXISTS quick_print_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    template_id UUID REFERENCES label_templates(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Template Usage Statistics
CREATE TABLE IF NOT EXISTS template_usage_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID REFERENCES label_templates(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(template_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_label_templates_category ON label_templates(category);
CREATE INDEX idx_label_templates_customer ON label_templates(customer_id);
CREATE INDEX idx_label_templates_created_by ON label_templates(created_by);
CREATE INDEX idx_printer_configs_location ON printer_configs(location);
CREATE INDEX idx_printer_configs_active ON printer_configs(is_active);
CREATE INDEX idx_print_jobs_status ON print_jobs(status);
CREATE INDEX idx_print_jobs_created_at ON print_jobs(created_at);
CREATE INDEX idx_print_jobs_order_line ON print_jobs(order_line_id);

-- RLS Policies

-- Label Templates
ALTER TABLE label_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Label templates viewable by all authenticated users"
    ON label_templates FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Label templates creatable by authenticated users"
    ON label_templates FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Label templates updatable by creator or admin"
    ON label_templates FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = created_by OR 
        EXISTS (
            SELECT 1 FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid() AND r.name IN ('Director', 'Admin')
        )
    );

CREATE POLICY "Label templates deletable by creator or admin"
    ON label_templates FOR DELETE
    TO authenticated
    USING (
        auth.uid() = created_by OR 
        EXISTS (
            SELECT 1 FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid() AND r.name IN ('Director', 'Admin')
        )
    );

-- Printer Configs (Admin only)
ALTER TABLE printer_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Printer configs viewable by authenticated users"
    ON printer_configs FOR SELECT
    TO authenticated
    USING (is_active = true);

CREATE POLICY "Printer configs manageable by admin only"
    ON printer_configs FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid() AND r.name IN ('Director', 'Admin')
        )
    );

-- Print Jobs
ALTER TABLE print_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Print jobs viewable by creator"
    ON print_jobs FOR SELECT
    TO authenticated
    USING (auth.uid() = created_by);

CREATE POLICY "Print jobs creatable by authenticated users"
    ON print_jobs FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- Quick Print Templates (Admin only)
ALTER TABLE quick_print_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Quick print templates viewable by all"
    ON quick_print_templates FOR SELECT
    TO authenticated
    USING (is_active = true);

CREATE POLICY "Quick print templates manageable by admin"
    ON quick_print_templates FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid() AND r.name IN ('Director', 'Admin')
        )
    );

-- Template Usage Stats
ALTER TABLE template_usage_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usage stats viewable by user"
    ON template_usage_stats FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Usage stats updatable by user"
    ON template_usage_stats FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

-- Insert default quick print templates
INSERT INTO label_templates (name, category, canvas_data, label_size, is_default)
VALUES 
    ('HP ORDER - EXTERNAL BOX', 'shipping', '{"version":"5.3.0","objects":[]}', '{"width":4,"height":6,"unit":"inch"}', false),
    ('FRAGILE - HANDLE WITH CARE', 'generic', '{"version":"5.3.0","objects":[]}', '{"width":4,"height":2,"unit":"inch"}', false),
    ('PRIORITY SHIPMENT', 'shipping', '{"version":"5.3.0","objects":[]}', '{"width":4,"height":2,"unit":"inch"}', false),
    ('QC HOLD - DO NOT SHIP', 'internal', '{"version":"5.3.0","objects":[]}', '{"width":3,"height":2,"unit":"inch"}', false),
    ('PARTS INSPECTION REQUIRED', 'internal', '{"version":"5.3.0","objects":[]}', '{"width":3,"height":2,"unit":"inch"}', false),
    ('MOTHERBOARD - STATIC SENSITIVE', 'generic', '{"version":"5.3.0","objects":[]}', '{"width":2,"height":1,"unit":"inch"}', false),
    ('RETURN TO VENDOR', 'internal', '{"version":"5.3.0","objects":[]}', '{"width":3,"height":2,"unit":"inch"}', false)
ON CONFLICT DO NOTHING;