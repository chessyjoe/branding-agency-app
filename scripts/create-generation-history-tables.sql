-- Create generated_images table
CREATE TABLE IF NOT EXISTS generated_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('logo', 'banner', 'poster', 'business-card', 'website', 'video', 'code', 'slogan')),
    prompt TEXT NOT NULL,
    refined_prompt TEXT,
    model TEXT NOT NULL,
    image_url TEXT NOT NULL,
    image_data BYTEA, -- Backup of image data
    svg_content TEXT, -- For SVG logos
    colors JSONB DEFAULT '[]'::jsonb,
    brand_voice JSONB DEFAULT '{}'::jsonb,
    advanced_options JSONB DEFAULT '{}'::jsonb,
    aspect_ratio TEXT,
    is_template BOOLEAN DEFAULT false,
    is_favorite BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_generated_images_user_id ON generated_images(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_type ON generated_images(type);
CREATE INDEX IF NOT EXISTS idx_generated_images_is_template ON generated_images(is_template);
CREATE INDEX IF NOT EXISTS idx_generated_images_is_favorite ON generated_images(is_favorite);
CREATE INDEX IF NOT EXISTS idx_generated_images_created_at ON generated_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_images_tags ON generated_images USING GIN(tags);

-- Create template_categories table
CREATE TABLE IF NOT EXISTS template_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO template_categories (name, description, icon, color) VALUES
('Business', 'Professional business designs', 'briefcase', '#1f2937'),
('Creative', 'Artistic and creative designs', 'palette', '#7c3aed'),
('Tech', 'Technology and startup designs', 'cpu', '#0ea5e9'),
('Minimal', 'Clean and minimalist designs', 'circle', '#6b7280'),
('Vintage', 'Retro and vintage style designs', 'clock', '#92400e'),
('Modern', 'Contemporary and modern designs', 'zap', '#059669')
ON CONFLICT (name) DO NOTHING;

-- Create image_templates table for organizing templates
CREATE TABLE IF NOT EXISTS image_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    image_id UUID NOT NULL REFERENCES generated_images(id) ON DELETE CASCADE,
    category_id UUID REFERENCES template_categories(id),
    title TEXT,
    description TEXT,
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    popularity_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for image_templates
CREATE INDEX IF NOT EXISTS idx_image_templates_image_id ON image_templates(image_id);
CREATE INDEX IF NOT EXISTS idx_image_templates_category_id ON image_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_image_templates_popularity ON image_templates(popularity_score DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_generated_images_updated_at BEFORE UPDATE ON generated_images FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_image_templates_updated_at BEFORE UPDATE ON image_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
