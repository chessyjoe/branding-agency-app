-- Enable Row Level Security (RLS) and define policies for user-owned tables
-- Run this after your tables are created.

-- USERS (UUID id)
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view self" ON users;
DROP POLICY IF EXISTS "Users can update self" ON users;
CREATE POLICY "Users can view self" ON users
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update self" ON users
  FOR UPDATE USING (id = auth.uid());

-- GENERATIONS (user_id UUID)
ALTER TABLE IF EXISTS generations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own generations select" ON generations;
DROP POLICY IF EXISTS "Own generations insert" ON generations;
DROP POLICY IF EXISTS "Own generations update" ON generations;
DROP POLICY IF EXISTS "Own generations delete" ON generations;
CREATE POLICY "Own generations select" ON generations
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Own generations insert" ON generations
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own generations update" ON generations
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Own generations delete" ON generations
  FOR DELETE USING (user_id = auth.uid());

-- GENERATED_IMAGES (user_id TEXT)
ALTER TABLE IF EXISTS generated_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own images select" ON generated_images;
DROP POLICY IF EXISTS "Own images insert" ON generated_images;
DROP POLICY IF EXISTS "Own images update" ON generated_images;
DROP POLICY IF EXISTS "Own images delete" ON generated_images;
CREATE POLICY "Own images select" ON generated_images
  FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Own images insert" ON generated_images
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "Own images update" ON generated_images
  FOR UPDATE USING (user_id = auth.uid()::text);
CREATE POLICY "Own images delete" ON generated_images
  FOR DELETE USING (user_id = auth.uid()::text);

-- IMAGE_TEMPLATES (image_id -> generated_images)
ALTER TABLE IF EXISTS image_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own image templates select" ON image_templates;
DROP POLICY IF EXISTS "Own image templates insert" ON image_templates;
DROP POLICY IF EXISTS "Own image templates update" ON image_templates;
DROP POLICY IF EXISTS "Own image templates delete" ON image_templates;
CREATE POLICY "Own image templates select" ON image_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM generated_images gi
      WHERE gi.id = image_templates.image_id
      AND gi.user_id = auth.uid()::text
    )
  );
CREATE POLICY "Own image templates insert" ON image_templates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM generated_images gi
      WHERE gi.id = image_templates.image_id
      AND gi.user_id = auth.uid()::text
    )
  );
CREATE POLICY "Own image templates update" ON image_templates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM generated_images gi
      WHERE gi.id = image_templates.image_id
      AND gi.user_id = auth.uid()::text
    )
  );
CREATE POLICY "Own image templates delete" ON image_templates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM generated_images gi
      WHERE gi.id = image_templates.image_id
      AND gi.user_id = auth.uid()::text
    )
  );

-- TEMPLATE_CATEGORIES (public metadata) - optional RLS; allow read-all
ALTER TABLE IF EXISTS template_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read template categories" ON template_categories;
CREATE POLICY "Public read template categories" ON template_categories
  FOR SELECT USING (true);

-- TEMPLATES (created_by UUID, is_public BOOLEAN)
ALTER TABLE IF EXISTS templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Templates public or own select" ON templates;
DROP POLICY IF EXISTS "Templates own insert" ON templates;
DROP POLICY IF EXISTS "Templates own update" ON templates;
DROP POLICY IF EXISTS "Templates own delete" ON templates;
CREATE POLICY "Templates public or own select" ON templates
  FOR SELECT USING (is_public = true OR created_by = auth.uid());
CREATE POLICY "Templates own insert" ON templates
  FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Templates own update" ON templates
  FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Templates own delete" ON templates
  FOR DELETE USING (created_by = auth.uid());

-- USER_FAVORITES (user_id UUID)
ALTER TABLE IF EXISTS user_favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own favorites select" ON user_favorites;
DROP POLICY IF EXISTS "Own favorites insert" ON user_favorites;
DROP POLICY IF EXISTS "Own favorites delete" ON user_favorites;
CREATE POLICY "Own favorites select" ON user_favorites
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Own favorites insert" ON user_favorites
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own favorites delete" ON user_favorites
  FOR DELETE USING (user_id = auth.uid());

-- USER_SETTINGS (user_id TEXT)
ALTER TABLE IF EXISTS user_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own settings select" ON user_settings;
DROP POLICY IF EXISTS "Own settings upsert" ON user_settings;
CREATE POLICY "Own settings select" ON user_settings
  FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Own settings upsert" ON user_settings
  FOR INSERT WITH CHECK (user_id = auth.uid()::text)
  TO PUBLIC;
ALTER POLICY "Own settings upsert" ON user_settings
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- API_KEYS (user_id TEXT)
ALTER TABLE IF EXISTS api_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own api keys select" ON api_keys;
DROP POLICY IF EXISTS "Own api keys insert" ON api_keys;
DROP POLICY IF EXISTS "Own api keys update" ON api_keys;
DROP POLICY IF EXISTS "Own api keys delete" ON api_keys;
CREATE POLICY "Own api keys select" ON api_keys
  FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Own api keys insert" ON api_keys
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "Own api keys update" ON api_keys
  FOR UPDATE USING (user_id = auth.uid()::text);
CREATE POLICY "Own api keys delete" ON api_keys
  FOR DELETE USING (user_id = auth.uid()::text);

-- API_KEY_USAGE_LOGS (via api_keys)
ALTER TABLE IF EXISTS api_key_usage_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own api key logs select" ON api_key_usage_logs;
CREATE POLICY "Own api key logs select" ON api_key_usage_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM api_keys k
      WHERE k.id = api_key_id AND k.user_id = auth.uid()::text
    )
  );

-- USER_QUOTAS (user_id TEXT)
ALTER TABLE IF EXISTS user_quotas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own quotas select" ON user_quotas;
DROP POLICY IF EXISTS "Own quotas upsert" ON user_quotas;
CREATE POLICY "Own quotas select" ON user_quotas
  FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Own quotas upsert" ON user_quotas
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);
ALTER POLICY "Own quotas upsert" ON user_quotas
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- SYSTEM_CONFIG (public config)
ALTER TABLE IF EXISTS system_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "System config public read" ON system_config;
CREATE POLICY "System config public read" ON system_config
  FOR SELECT USING (is_public = true);

-- BRAND_KITS (user_id UUID)
ALTER TABLE IF EXISTS brand_kits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own brand kits select" ON brand_kits;
DROP POLICY IF EXISTS "Own brand kits insert" ON brand_kits;
DROP POLICY IF EXISTS "Own brand kits update" ON brand_kits;
DROP POLICY IF EXISTS "Own brand kits delete" ON brand_kits;
CREATE POLICY "Own brand kits select" ON brand_kits
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Own brand kits insert" ON brand_kits
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own brand kits update" ON brand_kits
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Own brand kits delete" ON brand_kits
  FOR DELETE USING (user_id = auth.uid());


