-- Create editor sessions table
CREATE TABLE IF NOT EXISTS editor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_name TEXT NOT NULL,
  original_image_url TEXT NOT NULL,
  current_canvas_data JSONB NOT NULL,
  layers JSONB NOT NULL DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create editor history table for undo/redo
CREATE TABLE IF NOT EXISTS editor_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES editor_sessions(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'draw', 'erase', 'ai_edit', 'layer_change', etc.
  canvas_state JSONB NOT NULL,
  layers_state JSONB NOT NULL,
  action_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_editor_sessions_user_id ON editor_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_editor_sessions_updated_at ON editor_sessions(updated_at);
CREATE INDEX IF NOT EXISTS idx_editor_history_session_id ON editor_history(session_id);
CREATE INDEX IF NOT EXISTS idx_editor_history_created_at ON editor_history(created_at);

-- Add RLS policies
ALTER TABLE editor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE editor_history ENABLE ROW LEVEL SECURITY;

-- Users can only access their own editor sessions
CREATE POLICY "Users can view their own editor sessions" ON editor_sessions
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own editor sessions" ON editor_sessions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own editor sessions" ON editor_sessions
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own editor sessions" ON editor_sessions
  FOR DELETE USING (auth.uid()::text = user_id);

-- Users can only access history for their own sessions
CREATE POLICY "Users can view their own editor history" ON editor_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM editor_sessions 
      WHERE editor_sessions.id = editor_history.session_id 
      AND editor_sessions.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert their own editor history" ON editor_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM editor_sessions 
      WHERE editor_sessions.id = editor_history.session_id 
      AND editor_sessions.user_id = auth.uid()::text
    )
  );
