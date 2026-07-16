-- 030_production_hardening.sql
-- Production-correct hardening:
-- 1. Remove bank data exposure from public storefront RPC
-- 2. Add RLS on trova_profiles (bank columns owner-only)
-- 3. Add useful indexes

-- ============================================================
-- 1. Update public RPC: NO bank details, NO account-level data
--    Public storefront gets its bank info ONLY from trova_storefronts
-- ============================================================

drop function if exists public.get_public_seller_profile_by_handle(text);

create or replace function public.get_public_seller_profile_by_handle(p_handle text)
returns table (
  id uuid,
  profile_id uuid,
  email text,
  display_name text,
  business_name text,
  phone text,
  bio text,
  avatar_url text,
  instagram_handle text,
  whatsapp text,
  twitter_handle text,
  website text,
  sticker text,
  contact_phone text,
  kyc_status text,
  kyc_rejection_reason text,
  kyc_submitted_at timestamptz,
  kyc_approved_at timestamptz,
  status text,
  created_at timestamptz
) as $$
begin
  return query
  select
    s.id,
    s.profile_id,
    p.email,
    p.display_name,
    s.business_name,
    p.phone,
    p.metadata->>'bio' as bio,
    p.metadata->>'avatar_url' as avatar_url,
    p.metadata->>'instagram_handle' as instagram_handle,
    p.metadata->>'whatsapp' as whatsapp,
    p.metadata->>'twitter_handle' as twitter_handle,
    s.business_website as website,
    p.metadata->>'sticker' as sticker,
    p.metadata->>'contact_phone' as contact_phone,
    p.kyc_status,
    p.kyc_rejection_reason,
    p.kyc_submitted_at,
    p.kyc_approved_at,
    p.metadata->>'status' as status,
    s.created_at
  from trova_storefronts sf
  join trova_sellers s on s.id = sf.seller_id
  join trova_profiles p on p.id = s.profile_id
  where lower(sf.handle) = lower(p_handle)
     or lower(sf.business_name) = lower(p_handle)
     or lower(s.business_name) = lower(p_handle)
  limit 1;
end;
$$ language plpgsql security definer;

-- ============================================================
-- 2. RLS on trova_profiles
--    Account bank columns must never be readable by the public.
--    Only the owner (via auth.uid() -> trova_sellers) and service
--    role can access full profile rows.
-- ============================================================

alter table trova_profiles enable row level security;

drop policy if exists profiles_select_owner on trova_profiles;
drop policy if exists profiles_update_owner on trova_profiles;
drop policy if exists profiles_select_service_role on trova_profiles;

create policy profiles_select_owner on trova_profiles for select using (
  id = (select profile_id from trova_sellers where profile_id = auth.uid() limit 1)
);

create policy profiles_update_owner on trova_profiles for update using (
  id = (select profile_id from trova_sellers where profile_id = auth.uid() limit 1)
) with check (
  id = (select profile_id from trova_sellers where profile_id = auth.uid() limit 1)
);

create policy profiles_select_service_role on trova_profiles for select to service_role using (true);

-- ============================================================
-- 3. Indexes for production query performance
-- ============================================================

create index if not exists idx_trova_storefronts_handle on trova_storefronts(lower(handle));
create index if not exists idx_trova_storefronts_business_name on trova_storefronts(lower(business_name));
create index if not exists idx_trova_storefronts_seller_id on trova_storefronts(seller_id);
create index if not exists idx_trova_profiles_bank_name on trova_profiles(bank_name);
create index if not exists idx_trova_profiles_currency on trova_profiles(currency);
