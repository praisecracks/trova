-- 031_public_storefront_payload.sql
-- Consolidated, publicly-queryable storefront payload.
-- Replaces the previous split reads (trova_storefronts + seller-profile RPC)
-- so the public storefront depends ONLY on the :handle route param and
-- Supabase. Everything the public page renders comes from this single query:
-- business, profile, bio, photo, bank, verified status, referral tier,
-- rating, catalog, and social links.

drop function if exists public.get_public_storefront_by_handle(text);

create or replace function public.get_public_storefront_by_handle(p_handle text)
returns table (
  id uuid,
  handle text,
  business_name text,
  tagline text,
  profile_image_url text,
  links jsonb,
  items jsonb,
  bank_name text,
  account_number text,
  account_name text,
  account_type text,
  currency text,
  store_created_at timestamptz,
  display_name text,
  bio text,
  avatar_url text,
  instagram_handle text,
  whatsapp text,
  twitter_handle text,
  website text,
  sticker text,
  contact_phone text,
  kyc_status text,
  status text,
  active_referrals bigint,
  rating_average numeric,
  rating_count bigint
) as $$
begin
  return query
   select
     sf.id,
     sf.handle,
     sf.business_name,
     sf.tagline as bio,
     sf.profile_image_url as avatar_url,
     sf.links,
     sf.items,
     sf.bank_name,
     sf.account_number,
     sf.account_name,
     sf.account_type,
     sf.currency,
     sf.created_at,
     p.display_name,
     sf.tagline,
     sf.profile_image_url,
     p.metadata ->> 'instagram_handle' as instagram_handle,
     p.metadata ->> 'whatsapp' as whatsapp,
     p.metadata ->> 'twitter_handle' as twitter_handle,
     s.business_website as website,
     p.metadata ->> 'sticker' as sticker,
     p.metadata ->> 'contact_phone' as contact_phone,
     p.kyc_status,
     p.metadata ->> 'status' as status,
     coalesce((
       select count(*)
       from trova_referrals r
       where r.referrer_seller_id = s.id
         and r.status = 'Active'
     ), 0) as active_referrals,
     coalesce((
       select avg(rt.score)
       from trova_ratings rt
       join trova_transactions t on rt.transaction_id = t.id
       where t.seller_id = s.id
     ), 0) as rating_average,
     coalesce((
       select count(*)
       from trova_ratings rt
       join trova_transactions t on rt.transaction_id = t.id
       where t.seller_id = s.id
     ), 0) as rating_count
  from trova_storefronts sf
  join trova_sellers s on s.id = sf.seller_id
  join trova_profiles p on p.id = s.profile_id
  where lower(sf.handle) = lower(p_handle)
     or lower(sf.business_name) = lower(p_handle)
     or lower(s.business_name) = lower(p_handle)
  limit 1;
end;
$$ language plpgsql security definer;

-- The function is SECURITY DEFINER, so it reads through RLS as the owner and
-- exposes only public storefront data. Grant execute to anon so unauthenticated
-- visitors can load a storefront from its :handle URL.
grant execute on function public.get_public_storefront_by_handle(text) to anon, authenticated, service_role;