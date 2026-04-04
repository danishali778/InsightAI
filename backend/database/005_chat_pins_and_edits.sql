-- Migration 005: Add Pin Status to Chat Messages
-- Adds an is_pinned column to the chat_messages table.

ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- Log Migration
INSERT INTO schema_migrations (name) VALUES ('005_chat_pins_and_edits');
