-- Create user settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Create API keys table with encryption
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  service TEXT NOT NULL CHECK (service IN ('openai', 'vercel-v0', 'supabase', 'runway', 'elevenlabs', 'pexels', 'unsplash')),
  name TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMP WITH TIME ZONE,
  last_tested TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, service, name)
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_service ON api_keys(service);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);

-- Create API key usage logs for monitoring
CREATE TABLE IF NOT EXISTS api_key_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  status_code INTEGER,
  response_time INTEGER, -- in milliseconds
  tokens_used INTEGER,
  cost_cents INTEGER, -- cost in cents
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_key_usage_logs_api_key_id ON api_key_usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_logs_created_at ON api_key_usage_logs(created_at DESC);

-- Create user quotas and limits table
CREATE TABLE IF NOT EXISTS user_quotas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'enterprise')),
  monthly_generations INTEGER DEFAULT 0,
  monthly_limit INTEGER DEFAULT 100,
  api_calls_today INTEGER DEFAULT 0,
  daily_api_limit INTEGER DEFAULT 1000,
  total_storage_mb INTEGER DEFAULT 0,
  storage_limit_mb INTEGER DEFAULT 1000,
  reset_date DATE DEFAULT CURRENT_DATE + INTERVAL '1 month',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_quotas_user_id ON user_quotas(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quotas_plan_type ON user_quotas(plan_type);

-- Create system configuration table for admin settings
CREATE TABLE IF NOT EXISTS system_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key TEXT UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(config_key);
CREATE INDEX IF NOT EXISTS idx_system_config_public ON system_config(is_public);

-- Insert default system configurations
INSERT INTO system_config (config_key, config_value, description, is_public) VALUES
('default_models', '{"text": "gpt-4o", "image": "flux-1.1-pro", "video": "runway-gen3"}', 'Default AI models for each generation type', true),
('rate_limits', '{"free": {"daily": 50, "monthly": 200}, "pro": {"daily": 500, "monthly": 2000}}', 'Rate limits by plan type', false),
('feature_flags', '{"website_creator": true, "video_developer": true, "code_generator": true}', 'Feature availability flags', true),
('maintenance_mode', 'false', 'System maintenance mode toggle', true)
ON CONFLICT (config_key) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_quotas_updated_at BEFORE UPDATE ON user_quotas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update service constraint (Together removed)
ALTER TABLE api_keys 
DROP CONSTRAINT IF EXISTS api_keys_service_check;

ALTER TABLE api_keys 
ADD CONSTRAINT api_keys_service_check 
CHECK (service IN ('openai', 'vercel-v0', 'supabase', 'runway', 'elevenlabs', 'pexels', 'unsplash'));
