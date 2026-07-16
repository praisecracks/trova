-- 024_add_public_seller_profile_rpc.sql
-- RPC to fetch public seller profile by storefront handle (no auth required)

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
  selected_bank text,
  account_number text,
  resolved_account_name text,
  custom_bank_name text,
  custom_bank_country text,
  custom_bank_currency text,
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
    p.metadata->>'selected_bank' as selected_bank,
    p.metadata->>'account_number' as account_number,
    p.metadata->>'resolved_account_name' as resolved_account_name,
    p.metadata->>'custom_bank_name' as custom_bank_name,
    p.metadata->>'custom_bank_country' as custom_bank_country,
    p.metadata->>'custom_bank_currency' as custom_bank_currency,
    p.kyc_status,
    p.kyc_rejection_reason,
    p.kyc_submitted_at,
    p.kyc_approved_at,
    p.metadata->>'status' as status,
    s.created_at
  from trova_storefronts sf
  join trova_sellers s on s.id = sf.seller_id
  join trova_profiles p on p.id = s.profile_id
  where sf.handle = p_handle;
end;
$$ language plpgsql security definer;
