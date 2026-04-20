-- Add sharing capabilities to dashboards
ALTER TABLE dashboards
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS share_token UUID DEFAULT gen_random_uuid();

-- Create an index to quickly find shared dashboards
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboards_share_token ON dashboards(share_token);

-- Update RLS policies to allow unauthenticated read access if is_public is true
CREATE POLICY "Public dashboards viewable by anyone" 
  ON dashboards FOR SELECT
  USING (is_public = true);

-- Also allow reading widgets belonging to public dashboards
CREATE POLICY "Widgets for public dashboards viewable by anyone" 
  ON dashboard_widgets FOR SELECT
  USING (
    dashboard_id IN (
      SELECT id FROM dashboards WHERE is_public = true
    )
  );
