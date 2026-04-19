-- Migration 007: User Settings Table
-- Run this in your Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS user_settings (
    owner_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Profile
    full_name TEXT,
    job_title TEXT,
    timezone TEXT DEFAULT 'UTC',
    
    -- Appearance
    theme TEXT DEFAULT 'light',
    accent_color TEXT DEFAULT 'cyan',
    density TEXT DEFAULT 'comfortable',
    show_run_counts BOOLEAN DEFAULT TRUE,
    animate_charts BOOLEAN DEFAULT TRUE,
    syntax_highlighting BOOLEAN DEFAULT TRUE,
    
    -- AI & Queries
    ai_model TEXT DEFAULT 'claude-sonnet-4-6',
    stream_responses BOOLEAN DEFAULT TRUE,
    default_row_limit INTEGER DEFAULT 500,
    auto_save_queries BOOLEAN DEFAULT FALSE,
    system_prompt TEXT DEFAULT '',
    
    -- Notifications
    email_scheduled BOOLEAN DEFAULT TRUE,
    email_failed BOOLEAN DEFAULT TRUE,
    email_alerts BOOLEAN DEFAULT FALSE,
    delivery_format TEXT DEFAULT 'CSV + Chart PNG',
    slack_enabled BOOLEAN DEFAULT FALSE,
    slack_webhook TEXT,
    slack_channel TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own settings" 
ON user_settings FOR SELECT 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own settings" 
ON user_settings FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own settings" 
ON user_settings FOR UPDATE 
USING (auth.uid() = owner_id);

-- Log Migration
INSERT INTO schema_migrations (name) VALUES ('007_user_settings') ON CONFLICT DO NOTHING;
