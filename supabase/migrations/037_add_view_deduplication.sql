-- 037_add_view_deduplication.sql
-- Prevent inflated storefront view counts from page refreshes and bots.
-- The same browser tab session can only register one view per hour.

CREATE OR REPLACE FUNCTION public.increment_storefront_views(
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
  IF NOT EXISTS (SELECT 1 FROM trova_storefronts WHERE id = p_storefront_id) THEN
    RETURN QUERY SELECT false, 'Storefront not found'::text, 0::bigint;
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.storefront_views
    WHERE storefront_id = p_storefront_id
      AND viewer_session_id = p_session_id
      AND viewed_at > now() - interval '1 hour'
  ) THEN
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
  END IF;

  SELECT COUNT(*)::bigint INTO v_view_count
  FROM public.storefront_views
  WHERE storefront_id = p_storefront_id;

  RETURN QUERY SELECT true, 'View tracked'::text, v_view_count;
EXCEPTION WHEN others THEN
  RETURN QUERY SELECT false, 'Error tracking view: ' || SQLERRM, 0::bigint;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_storefront_views(uuid, text, text, text, text) TO anon, authenticated, service_role;
