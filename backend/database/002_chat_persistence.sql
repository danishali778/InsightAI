-- Migration 002: Chat Persistence
-- Adds support for saving chat history and sessions in Supabase.

-- 1. Chat Sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    last_connection_id UUID REFERENCES database_connections(id) ON DELETE SET NULL,
    connection_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Chat Sessions
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own chat sessions" 
ON chat_sessions 
FOR ALL 
USING (auth.uid() = owner_id);

-- 2. Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- user, assistant
    content TEXT NOT NULL,
    sql TEXT,
    results JSONB,
    error TEXT,
    connection_id UUID REFERENCES database_connections(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Chat Messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own chat messages" 
ON chat_messages 
FOR ALL 
USING (auth.uid() = owner_id);

-- Log Migration
INSERT INTO schema_migrations (name) VALUES ('002_chat_persistence');
