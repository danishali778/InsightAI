-- Migration 011: Private dashboards, indexes, and RLS policy optimization.
-- Applied to Supabase through MCP as 011_private_dashboards_indexes_rls_optimization.

-- Dashboards are private for now. Keep sharing columns for app compatibility,
-- but remove anonymous read policies and mark existing dashboards private.
UPDATE public.dashboards
SET is_public = false
WHERE is_public = true;

DROP POLICY IF EXISTS "Public dashboards viewable by anyone" ON public.dashboards;
DROP POLICY IF EXISTS "Widgets for public dashboards viewable by anyone" ON public.dashboard_widgets;

-- Indexes for foreign keys and common owner/session/dashboard lookups.
CREATE INDEX IF NOT EXISTS idx_database_connections_owner_id_created_at
  ON public.database_connections (owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_queries_owner_id_created_at
  ON public.saved_queries (owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_queries_connection_id
  ON public.saved_queries (connection_id);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_owner_id_created_at
  ON public.chat_sessions (owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_connection_id
  ON public.chat_sessions (last_connection_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id_created_at
  ON public.chat_messages (session_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_owner_id_created_at
  ON public.chat_messages (owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_connection_id
  ON public.chat_messages (connection_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_parent_id
  ON public.chat_messages (parent_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_prev_query_id
  ON public.chat_messages (prev_query_id);

CREATE INDEX IF NOT EXISTS idx_query_executions_owner_id_ran_at
  ON public.query_executions (owner_id, ran_at DESC);
CREATE INDEX IF NOT EXISTS idx_query_executions_connection_id
  ON public.query_executions (connection_id);
CREATE INDEX IF NOT EXISTS idx_query_executions_query_id
  ON public.query_executions (query_id);

CREATE INDEX IF NOT EXISTS idx_dashboards_owner_id_created_at
  ON public.dashboards (owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_dashboard_id_order_index
  ON public.dashboard_widgets (dashboard_id, order_index ASC);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_owner_id
  ON public.dashboard_widgets (owner_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_connection_id
  ON public.dashboard_widgets (connection_id);

-- Recreate RLS policies with initplan-friendly auth.uid() usage.
DROP POLICY IF EXISTS "Users can manage their own connections" ON public.database_connections;
CREATE POLICY "Users can manage their own connections"
  ON public.database_connections
  FOR ALL
  TO public
  USING ((select auth.uid()) = owner_id)
  WITH CHECK ((select auth.uid()) = owner_id);

DROP POLICY IF EXISTS "Users can manage their own queries" ON public.saved_queries;
CREATE POLICY "Users can manage their own queries"
  ON public.saved_queries
  FOR ALL
  TO public
  USING ((select auth.uid()) = owner_id)
  WITH CHECK ((select auth.uid()) = owner_id);

DROP POLICY IF EXISTS "Users can manage their own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can manage their own chat sessions"
  ON public.chat_sessions
  FOR ALL
  TO public
  USING ((select auth.uid()) = owner_id)
  WITH CHECK ((select auth.uid()) = owner_id);

DROP POLICY IF EXISTS "Users can manage their own chat messages" ON public.chat_messages;
CREATE POLICY "Users can manage their own chat messages"
  ON public.chat_messages
  FOR ALL
  TO public
  USING ((select auth.uid()) = owner_id)
  WITH CHECK ((select auth.uid()) = owner_id);

DROP POLICY IF EXISTS "Users can manage their own query executions" ON public.query_executions;
CREATE POLICY "Users can manage their own query executions"
  ON public.query_executions
  FOR ALL
  TO public
  USING ((select auth.uid()) = owner_id)
  WITH CHECK ((select auth.uid()) = owner_id);

DROP POLICY IF EXISTS "Users can manage their own dashboards" ON public.dashboards;
CREATE POLICY "Users can manage their own dashboards"
  ON public.dashboards
  FOR ALL
  TO public
  USING ((select auth.uid()) = owner_id)
  WITH CHECK ((select auth.uid()) = owner_id);

DROP POLICY IF EXISTS "Users can manage their own widgets" ON public.dashboard_widgets;
CREATE POLICY "Users can manage their own widgets"
  ON public.dashboard_widgets
  FOR ALL
  TO public
  USING ((select auth.uid()) = owner_id)
  WITH CHECK ((select auth.uid()) = owner_id);

DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
CREATE POLICY "Users can view their own settings"
  ON public.user_settings
  FOR SELECT
  TO public
  USING ((select auth.uid()) = owner_id);

DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
CREATE POLICY "Users can insert their own settings"
  ON public.user_settings
  FOR INSERT
  TO public
  WITH CHECK ((select auth.uid()) = owner_id);

DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
CREATE POLICY "Users can update their own settings"
  ON public.user_settings
  FOR UPDATE
  TO public
  USING ((select auth.uid()) = owner_id)
  WITH CHECK ((select auth.uid()) = owner_id);

DROP POLICY IF EXISTS "Users can view their own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can view their own subscription"
  ON public.user_subscriptions
  FOR SELECT
  TO public
  USING ((select auth.uid()) = owner_id);

DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can insert their own subscription"
  ON public.user_subscriptions
  FOR INSERT
  TO public
  WITH CHECK ((select auth.uid()) = owner_id);

DROP POLICY IF EXISTS "Users can update their own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can update their own subscription"
  ON public.user_subscriptions
  FOR UPDATE
  TO public
  USING ((select auth.uid()) = owner_id)
  WITH CHECK ((select auth.uid()) = owner_id);
