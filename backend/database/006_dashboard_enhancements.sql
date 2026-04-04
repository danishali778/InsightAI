-- Migration: 006_dashboard_enhancements.sql
-- Description: Adds Global Filters support and persistent ordering to Dashboards.

-- 1. Add filters column to dashboards (JSONB to store date ranges/categories)
ALTER TABLE dashboards 
ADD COLUMN IF NOT EXISTS filters JSONB DEFAULT '{}';

-- 2. Add order_index column to dashboard_widgets for persistent dragging
ALTER TABLE dashboard_widgets 
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- 3. Log the migration
INSERT INTO schema_migrations (name) VALUES ('006_dashboard_enhancements');
