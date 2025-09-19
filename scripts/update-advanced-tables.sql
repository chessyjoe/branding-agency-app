-- Update generations table to support new advanced tool types
ALTER TABLE generations 
DROP CONSTRAINT IF EXISTS generations_type_check;

ALTER TABLE generations 
ADD CONSTRAINT generations_type_check 
CHECK (type IN ('logo', 'banner', 'poster', 'business-card', 'slogan', 'brand-kit', 'website', 'video', 'code'));

-- Create table for website deployments and previews
CREATE TABLE IF NOT EXISTS website_deployments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  generation_id UUID REFERENCES generations(id) ON DELETE CASCADE,
  preview_url TEXT NOT NULL,
  deployment_status TEXT DEFAULT 'pending' CHECK (deployment_status IN ('pending', 'building', 'ready', 'failed')),
  framework TEXT NOT NULL,
  build_logs TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_website_deployments_generation_id ON website_deployments(generation_id);
CREATE INDEX IF NOT EXISTS idx_website_deployments_status ON website_deployments(deployment_status);

-- Create table for video processing and rendering
CREATE TABLE IF NOT EXISTS video_renders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  generation_id UUID REFERENCES generations(id) ON DELETE CASCADE,
  video_url TEXT,
  render_status TEXT DEFAULT 'queued' CHECK (render_status IN ('queued', 'processing', 'completed', 'failed')),
  duration INTEGER NOT NULL,
  format TEXT NOT NULL,
  resolution TEXT NOT NULL,
  file_size INTEGER,
  processing_logs TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_video_renders_generation_id ON video_renders(generation_id);
CREATE INDEX IF NOT EXISTS idx_video_renders_status ON video_renders(render_status);

-- Create table for code snippets and projects
CREATE TABLE IF NOT EXISTS code_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  generation_id UUID REFERENCES generations(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  language TEXT NOT NULL,
  framework TEXT,
  main_file_content TEXT NOT NULL,
  additional_files JSONB DEFAULT '{}',
  dependencies JSONB DEFAULT '[]',
  documentation TEXT,
  test_files JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_code_projects_generation_id ON code_projects(generation_id);
CREATE INDEX IF NOT EXISTS idx_code_projects_language ON code_projects(language);

-- Create table for advanced tool usage analytics
CREATE TABLE IF NOT EXISTS tool_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  tool_type TEXT NOT NULL CHECK (tool_type IN ('website', 'video', 'code')),
  generation_time INTEGER, -- in seconds
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  usage_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tool_analytics_user_id ON tool_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_analytics_tool_type ON tool_analytics(tool_type);
CREATE INDEX IF NOT EXISTS idx_tool_analytics_created_at ON tool_analytics(created_at DESC);
