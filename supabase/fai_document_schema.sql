-- FAI Document Integration Database Schema
-- First Article Inspection document and image management tables

-- Table: fai_documents
-- Stores uploaded FAI Excel files with metadata
CREATE TABLE IF NOT EXISTS fai_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_part_number VARCHAR(255) NOT NULL,
    filename VARCHAR(500) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(50) NOT NULL DEFAULT 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    version VARCHAR(50) DEFAULT '1.0',
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID NOT NULL REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: fai_images  
-- Stores images extracted from FAI documents
CREATE TABLE IF NOT EXISTS fai_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fai_document_id UUID NOT NULL REFERENCES fai_documents(id) ON DELETE CASCADE,
    customer_part_number VARCHAR(255) NOT NULL,
    image_name VARCHAR(500) NOT NULL,
    image_path TEXT NOT NULL,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_size BIGINT NOT NULL,
    image_format VARCHAR(10) NOT NULL,
    width INTEGER,
    height INTEGER,
    extraction_order INTEGER DEFAULT 0,
    is_master_image BOOLEAN DEFAULT FALSE,
    extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: master_images
-- Stores high-resolution master reference images for parts
CREATE TABLE IF NOT EXISTS master_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_part_number VARCHAR(255) NOT NULL,
    image_name VARCHAR(500) NOT NULL,
    image_path TEXT NOT NULL,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_size BIGINT NOT NULL,
    image_format VARCHAR(10) NOT NULL,
    width INTEGER,
    height INTEGER,
    is_primary BOOLEAN DEFAULT FALSE,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID NOT NULL REFERENCES users(id),
    description TEXT,
    view_angle VARCHAR(100),
    quality_notes TEXT,
    approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: image_extraction_jobs
-- Tracks background jobs for extracting images from FAI documents
CREATE TABLE IF NOT EXISTS image_extraction_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fai_document_id UUID NOT NULL REFERENCES fai_documents(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    progress_percentage INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    images_extracted INTEGER DEFAULT 0,
    total_images_found INTEGER DEFAULT 0,
    extraction_log JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: fai_storage_config
-- Configuration for FAI file and image storage
CREATE TABLE IF NOT EXISTS fai_storage_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storage_type VARCHAR(20) DEFAULT 'cloud' CHECK (storage_type IN ('local', 'cloud', 'hybrid')),
    local_path TEXT,
    cloud_bucket VARCHAR(100),
    max_file_size BIGINT DEFAULT 104857600, -- 100MB default
    allowed_formats JSONB DEFAULT '["xlsx", "xls"]',
    auto_extract_images BOOLEAN DEFAULT TRUE,
    create_thumbnails BOOLEAN DEFAULT TRUE,
    thumbnail_width INTEGER DEFAULT 300,
    thumbnail_height INTEGER DEFAULT 300,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fai_documents_customer_part ON fai_documents(customer_part_number);
CREATE INDEX IF NOT EXISTS idx_fai_documents_uploaded_by ON fai_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_fai_documents_upload_date ON fai_documents(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_fai_documents_is_active ON fai_documents(is_active);

CREATE INDEX IF NOT EXISTS idx_fai_images_document_id ON fai_images(fai_document_id);
CREATE INDEX IF NOT EXISTS idx_fai_images_customer_part ON fai_images(customer_part_number);
CREATE INDEX IF NOT EXISTS idx_fai_images_extraction_order ON fai_images(extraction_order);

CREATE INDEX IF NOT EXISTS idx_master_images_customer_part ON master_images(customer_part_number);
CREATE INDEX IF NOT EXISTS idx_master_images_uploaded_by ON master_images(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_master_images_is_primary ON master_images(is_primary);
CREATE INDEX IF NOT EXISTS idx_master_images_approval_status ON master_images(approval_status);

CREATE INDEX IF NOT EXISTS idx_extraction_jobs_document_id ON image_extraction_jobs(fai_document_id);
CREATE INDEX IF NOT EXISTS idx_extraction_jobs_status ON image_extraction_jobs(status);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE fai_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE fai_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_extraction_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fai_storage_config ENABLE ROW LEVEL SECURITY;

-- FAI Documents policies
CREATE POLICY "Users can view FAI documents they have permission for" ON fai_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_role_permissions urp
            JOIN users u ON u.role_id = urp.role_id
            WHERE u.id = auth.uid()
            AND (urp.permissions->>'VIEW_FAI_IMAGES')::boolean = true
        )
    );

CREATE POLICY "Users can upload FAI documents with permission" ON fai_documents
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_role_permissions urp
            JOIN users u ON u.role_id = urp.role_id
            WHERE u.id = auth.uid()
            AND (urp.permissions->>'UPLOAD_FAI_DOCUMENTS')::boolean = true
        )
        AND uploaded_by = auth.uid()
    );

CREATE POLICY "Users can update their own FAI documents" ON fai_documents
    FOR UPDATE USING (
        uploaded_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM user_role_permissions urp
            JOIN users u ON u.role_id = urp.role_id
            WHERE u.id = auth.uid()
            AND (urp.permissions->>'UPLOAD_FAI_DOCUMENTS')::boolean = true
        )
    );

-- FAI Images policies
CREATE POLICY "Users can view FAI images they have permission for" ON fai_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_role_permissions urp
            JOIN users u ON u.role_id = urp.role_id
            WHERE u.id = auth.uid()
            AND (urp.permissions->>'VIEW_FAI_IMAGES')::boolean = true
        )
    );

-- Master Images policies
CREATE POLICY "Users can view master images they have permission for" ON master_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_role_permissions urp
            JOIN users u ON u.role_id = urp.role_id
            WHERE u.id = auth.uid()
            AND (urp.permissions->>'VIEW_FAI_IMAGES')::boolean = true
        )
    );

CREATE POLICY "Users can upload master images with permission" ON master_images
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_role_permissions urp
            JOIN users u ON u.role_id = urp.role_id
            WHERE u.id = auth.uid()
            AND (urp.permissions->>'UPLOAD_MASTER_IMAGES')::boolean = true
        )
        AND uploaded_by = auth.uid()
    );

CREATE POLICY "Users can update their own master images" ON master_images
    FOR UPDATE USING (
        uploaded_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM user_role_permissions urp
            JOIN users u ON u.role_id = urp.role_id
            WHERE u.id = auth.uid()
            AND (urp.permissions->>'APPROVE_MASTER_IMAGES')::boolean = true
        )
    );

-- Image Extraction Jobs policies
CREATE POLICY "Users can view extraction jobs for their documents" ON image_extraction_jobs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM fai_documents fd
            WHERE fd.id = fai_document_id
            AND fd.uploaded_by = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM user_role_permissions urp
            JOIN users u ON u.role_id = urp.role_id
            WHERE u.id = auth.uid()
            AND (urp.permissions->>'MANAGE_FAI_SETTINGS')::boolean = true
        )
    );

-- Storage Config policies (admin only)
CREATE POLICY "Only admins can view storage config" ON fai_storage_config
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_role_permissions urp
            JOIN users u ON u.role_id = urp.role_id
            WHERE u.id = auth.uid()
            AND (urp.permissions->>'MANAGE_FAI_SETTINGS')::boolean = true
        )
    );

CREATE POLICY "Only admins can modify storage config" ON fai_storage_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_role_permissions urp
            JOIN users u ON u.role_id = urp.role_id
            WHERE u.id = auth.uid()
            AND (urp.permissions->>'MANAGE_FAI_SETTINGS')::boolean = true
        )
    );

-- Functions

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to update updated_at
CREATE TRIGGER update_fai_documents_updated_at BEFORE UPDATE ON fai_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_master_images_updated_at BEFORE UPDATE ON master_images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_extraction_jobs_updated_at BEFORE UPDATE ON image_extraction_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fai_storage_config_updated_at BEFORE UPDATE ON fai_storage_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to ensure only one primary master image per part
CREATE OR REPLACE FUNCTION ensure_single_primary_master()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting this image as primary, remove primary flag from others
    IF NEW.is_primary = TRUE THEN
        UPDATE master_images 
        SET is_primary = FALSE 
        WHERE customer_part_number = NEW.customer_part_number 
        AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER ensure_single_primary_master_trigger
    BEFORE INSERT OR UPDATE ON master_images
    FOR EACH ROW EXECUTE FUNCTION ensure_single_primary_master();

-- Insert default storage configuration
INSERT INTO fai_storage_config (
    storage_type,
    cloud_bucket,
    max_file_size,
    allowed_formats,
    auto_extract_images,
    create_thumbnails,
    thumbnail_width,
    thumbnail_height
) VALUES (
    'cloud',
    'fai-documents',
    104857600, -- 100MB
    '["xlsx", "xls", "png", "jpg", "jpeg", "tiff"]',
    true,
    true,
    300,
    300
) ON CONFLICT DO NOTHING;