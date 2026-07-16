-- 034_add_seller_id_to_public_storefront.sql
-- Expose seller_id through the public storefront payload so the storefront
-- can pass it into transaction-creation RPCs without requiring the buyer
-- to be an authenticated seller.

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
  rating_count bigint,
  seller_id uuid
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
     ), 0) as rating_count,
     s.id as seller_id
  from trova_storefronts sf
  join trova_sellers s on s.id = sf.seller_id
  join trova_profiles p on p.id = s.profile_id
  where lower(sf.handle) = lower(p_handle)
     or lower(sf.business_name) = lower(p_handle)
     or lower(s.business_name) = lower(p_handle)
  limit 1;
end;
$$ language plpgsql security definer;

grant execute on function public.get_public_storefront_by_handle(text) to anon, authenticated, service_role;
