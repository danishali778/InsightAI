-- Migration 008: User Subscriptions and Usage Tracking
-- Run this in your Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS user_subscriptions (
    owner_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    plan_type TEXT DEFAULT 'free', -- 'free' or 'pro'
    
    queries_used INTEGER DEFAULT 0,
    queries_limit INTEGER DEFAULT 100, -- Free tier limit
    
    ai_used INTEGER DEFAULT 0,
    ai_limit INTEGER DEFAULT 30, -- Free tier limit
    
    next_reset_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month'),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own subscription" 
ON user_subscriptions FOR SELECT 
USING (auth.uid() = owner_id);

-- Only backend should typically insert/update, but for demonstration/mocking:
CREATE POLICY "Users can insert their own subscription" 
ON user_subscriptions FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own subscription" 
ON user_subscriptions FOR UPDATE 
USING (auth.uid() = owner_id);

-- Log Migration
INSERT INTO schema_migrations (name) VALUES ('008_user_usage') ON CONFLICT DO NOTHING;
