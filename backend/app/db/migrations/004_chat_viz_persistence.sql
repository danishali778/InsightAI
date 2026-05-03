-- Migration: Add visualization persistence columns to chat_messages
-- 004_chat_viz_persistence.sql

ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS chart_recommendation JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS columns TEXT[] DEFAULT NULL;

-- Note: We use the existing 'results' JSONB column to store the 'rows' data.
-- This ensures that the frontend can fully reconstruct visualizations upon session reload.
