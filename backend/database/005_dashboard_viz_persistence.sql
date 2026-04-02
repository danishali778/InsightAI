-- Add rows and columns to dashboard_widgets for persistence
ALTER TABLE dashboard_widgets 
ADD COLUMN IF NOT EXISTS rows JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS columns TEXT[] DEFAULT '{}';

-- Update RLS if needed (usually not required for new columns on existing tables with owner_id)
COMMENT ON COLUMN dashboard_widgets.rows IS 'Stores the serialized query results (rows) for the widget.';
COMMENT ON COLUMN dashboard_widgets.columns IS 'Stores the column names for the query results.';
