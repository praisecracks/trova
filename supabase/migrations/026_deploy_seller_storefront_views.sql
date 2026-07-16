-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create storefront_views table
CREATE TABLE IF NOT EXISTS public.storefront_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storefront_id uuid NOT NULL REFERENCES public.trova_storefronts(id) ON DELETE CASCADE,
  viewer_session_id text NOT NULL,
  viewed_at timestamp NOT NULL DEFAULT now(),
  referrer text,
  user_agent text,
  ip_address text
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_storefront_views_storefront_id ON public.storefront_views(storefront_id);
CREATE INDEX IF NOT EXISTS idx_storefront_views_viewed_at ON public.storefront_views(viewed_at DESC);

-- Deploy RPC function
DROP FUNCTION IF EXISTS public.get_seller_storefront_views(uuid, integer);
DROP FUNCTION IF EXISTS public.get_seller_storefront_views(integer, uuid);

CREATE OR REPLACE FUNCTION public.get_seller_storefront_views(
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

-- Enable RLS
ALTER TABLE public.storefront_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow public storefront view tracking" ON public.storefront_views;
CREATE POLICY "Allow public storefront view tracking" ON public.storefront_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

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
