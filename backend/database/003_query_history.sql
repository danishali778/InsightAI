-- Migration 003: Query Executions
-- Adds support for tracking execution history of both ad-hoc and saved queries in Supabase.

-- 1. Query Executions
CREATE TABLE IF NOT EXISTS query_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    connection_id UUID REFERENCES database_connections(id) ON DELETE SET NULL,
    query_id UUID REFERENCES saved_queries(id) ON DELETE SET NULL,
    sql TEXT NOT NULL,
    success BOOLEAN NOT NULL,
    row_count INTEGER DEFAULT 0,
    execution_time_ms FLOAT DEFAULT 0.0,
    error TEXT,
    triggered_by TEXT DEFAULT 'manual', -- manual, schedule, assistant
    ran_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Query Executions
ALTER TABLE query_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own query executions" 
ON query_executions 
FOR ALL 
USING (auth.uid() = owner_id);

-- Log Migration
INSERT INTO schema_migrations (name) VALUES ('003_query_executions');
