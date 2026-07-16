-- Migration: Add Storefront Views Tracking
-- Purpose: Track public storefront page views for analytics

-- Create storefront_views table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.storefront_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storefront_id uuid NOT NULL REFERENCES public.trova_storefronts(id) ON DELETE CASCADE,
  viewer_session_id text NOT NULL, -- anonymous session identifier
  viewed_at timestamp NOT NULL DEFAULT now(),
  referrer text,
  user_agent text,
  ip_address text
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_storefront_views_storefront_id ON public.storefront_views(storefront_id);
CREATE INDEX IF NOT EXISTS idx_storefront_views_viewed_at ON public.storefront_views(viewed_at DESC);

-- RPC function to increment storefront view
CREATE OR REPLACE FUNCTION increment_storefront_views(
  p_storefront_id uuid,
  p_session_id text,
  p_referrer text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_ip_address text DEFAULT NULL
)
RETURNS TABLE (
  success boolean,
  message text,
  view_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_view_count bigint;
BEGIN
  -- Validate storefront exists
  IF NOT EXISTS (SELECT 1 FROM trova_storefronts WHERE id = p_storefront_id) THEN
    RETURN QUERY SELECT false, 'Storefront not found'::text, 0::bigint;
    RETURN;
  END IF;

  -- Insert view record
  INSERT INTO public.storefront_views (
    storefront_id,
    viewer_session_id,
    referrer,
    user_agent,
    ip_address
  ) VALUES (
    p_storefront_id,
    p_session_id,
    p_referrer,
    p_user_agent,
    p_ip_address
  );

  -- Get total views for this storefront
  SELECT COUNT(*)::bigint INTO v_view_count
  FROM public.storefront_views
  WHERE storefront_id = p_storefront_id;

  RETURN QUERY SELECT true, 'View tracked'::text, v_view_count;
EXCEPTION WHEN others THEN
  RETURN QUERY SELECT false, 'Error tracking view: ' || SQLERRM, 0::bigint;
END;
$$;

-- RPC function to get storefront views count for dashboard
CREATE OR REPLACE FUNCTION get_storefront_views_stats(
  p_days_back integer DEFAULT 7
)
RETURNS TABLE (
  total_views bigint,
  unique_views bigint,
  views_today bigint,
  views_this_week bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT
    COALESCE(COUNT(*)::bigint, 0) as total_views,
    COALESCE(COUNT(DISTINCT viewer_session_id)::bigint, 0) as unique_views,
    COALESCE(COUNT(*) FILTER (WHERE viewed_at > now() - interval '1 day')::bigint, 0) as views_today,
    COALESCE(COUNT(*) FILTER (WHERE viewed_at > now() - (p_days_back * interval '1 day'))::bigint, 0) as views_this_week
  FROM public.storefront_views;
END;
$$;

-- RPC function to get per-seller storefront views
DROP FUNCTION IF EXISTS public.get_seller_storefront_views(uuid, integer);
DROP FUNCTION IF EXISTS public.get_seller_storefront_views(integer, uuid);
CREATE OR REPLACE FUNCTION get_seller_storefront_views(
  p_seller_id uuid,
  p_days_back integer DEFAULT 30
)
RETURNS TABLE (
  seller_id uuid,
  total_views bigint,
  unique_views bigint,
  views_today bigint,
  views_period bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT
    p_seller_id,
    COALESCE(COUNT(*)::bigint, 0) as total_views,
    COALESCE(COUNT(DISTINCT viewer_session_id)::bigint, 0) as unique_views,
    COALESCE(COUNT(*) FILTER (WHERE viewed_at > now() - interval '1 day')::bigint, 0) as views_today,
    COALESCE(COUNT(*) FILTER (WHERE viewed_at > now() - (p_days_back * interval '1 day'))::bigint, 0) as views_period
  FROM public.storefront_views sv
  JOIN public.trova_storefronts s ON sv.storefront_id = s.id
  WHERE s.seller_id = p_seller_id;
END;
$$;

-- Enable RLS if needed
ALTER TABLE public.storefront_views ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can insert views (public tracking)
DROP POLICY IF EXISTS "Allow public storefront view tracking" ON public.storefront_views;
CREATE POLICY "Allow public storefront view tracking" ON public.storefront_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- RLS Policy: Only admins and sellers can view their own stats
DROP POLICY IF EXISTS "Allow sellers to view their storefront stats" ON public.storefront_views;
CREATE POLICY "Allow sellers to view their storefront stats" ON public.storefront_views
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trova_storefronts s
      WHERE s.id = storefront_views.storefront_id
      AND s.seller_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.trova_profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );
