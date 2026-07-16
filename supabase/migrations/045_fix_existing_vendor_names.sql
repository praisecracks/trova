-- 045_fix_existing_vendor_names.sql
-- Updates existing transactions where vendor_name was incorrectly set
-- to the seller's personal name instead of their business name.
-- Only updates when seller has a business_name and the transaction
-- vendor_name matches the seller's profile display_name (full name).

create or replace function public.fix_existing_vendor_names()
returns void
language plpgsql
security definer
as $$
begin
  update trova_transactions t
  set vendor_name = s.business_name
  from trova_sellers s
  join trova_profiles p on p.id = s.profile_id
  where t.seller_id = s.id
    and s.business_name is not null
    and trim(s.business_name) <> ''
    and t.vendor_name = p.display_name;
end;
$$;

select public.fix_existing_vendor_names();

drop function public.fix_existing_vendor_names();
