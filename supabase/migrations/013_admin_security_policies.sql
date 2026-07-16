
-- 013_admin_security_policies.sql
-- Fix admin RLS policies with a SECURITY DEFINER function to avoid infinite recursion
-- and properly secure admin-only operations

-- Step 1: Create SECURITY DEFINER is_admin() function that checks admin status without recursion
-- This function runs with elevated privileges, so we can read trova_profiles safely
drop function if exists is_admin();

create or replace function is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  -- First, check auth.uid() is not null
  if auth.uid() is null then
    return false;
  end if;
  
  -- Now, safely get the role without using RLS-policies-enabled select:
  -- Use SECURITY DEFINER lets us read trova_profiles without recursion
  select role into v_role from trova_profiles where id = auth.uid();
  
  if v_role = 'admin' then
    return true;
  else
    return false;
  end if;

exception
  when others then
    return false;
end;
$$;

-- Step 2: Update all admin policies to use our safe is_admin() function instead of recursive subqueries

-- First, restore admin policies
alter table trova_profiles enable row level security;
drop policy if exists profiles_select_admin on trova_profiles;
drop policy if exists profiles_update_admin on trova_profiles;
create policy profiles_select_admin on trova_profiles
  for select
  using (auth.uid() = id or is_admin());
create policy profiles_update_admin on trova_profiles
  for update
  using (auth.uid() = id or is_admin())
  with check (true);

-- Sellers admin policies
alter table trova_sellers enable row level security;
drop policy if exists sellers_select_admin on trova_sellers;
drop policy if exists sellers_update_admin on trova_sellers;
drop policy if exists sellers_insert_admin on trova_sellers;
create policy sellers_select_admin on trova_sellers
  for select
  using (profile_id = auth.uid() or is_admin());
create policy sellers_update_admin on trova_sellers
  for update
  using (profile_id = auth.uid() or is_admin())
  with check (true);
create policy sellers_insert_admin on trova_sellers
  for insert
  with check (profile_id = auth.uid() or is_admin());

-- Buyers admin policies
alter table trova_buyers enable row level security;
drop policy if exists buyers_select_admin on trova_buyers;
drop policy if exists buyers_update_admin on trova_buyers;
drop policy if exists buyers_insert_admin on trova_buyers;
create policy buyers_select_admin on trova_buyers
  for select
  using (profile_id = auth.uid() or is_admin());
create policy buyers_update_admin on trova_buyers
  for update
  using (profile_id = auth.uid() or is_admin())
  with check (true);
create policy buyers_insert_admin on trova_buyers
  for insert
  with check (profile_id = auth.uid() or is_admin());

-- Transactions admin policies
alter table trova_transactions enable row level security;
drop policy if exists transactions_select_admin on trova_transactions;
drop policy if exists transactions_update_admin on trova_transactions;
drop policy if exists transactions_insert_admin on trova_transactions;
create policy transactions_select_admin on trova_transactions
  for select
  using (
    seller_id = (select id from trova_sellers where profile_id = auth.uid())
    or buyer_id = (select id from trova_buyers where profile_id = auth.uid())
    or is_admin()
  );
create policy transactions_update_admin on trova_transactions
  for update
  using (
    seller_id = (select id from trova_sellers where profile_id = auth.uid())
    or buyer_id = (select id from trova_buyers where profile_id = auth.uid())
    or is_admin()
  )
  with check (true);
create policy transactions_insert_admin on trova_transactions
  for insert
  with check (
    (seller_id is null) or seller_id = (select id from trova_sellers where profile_id = auth.uid()) or is_admin()
  );

-- KYC Applications Admin Policies: only admins can update status
alter table trova_kyc_applications enable row level security;
drop policy if exists kyc_select_admin on trova_kyc_applications;
drop policy if exists kyc_update_admin on trova_kyc_applications;
drop policy if exists kyc_insert_admin on trova_kyc_applications;
create policy kyc_select_admin on trova_kyc_applications
  for select
  using (seller_id = (select id from trova_sellers where profile_id = auth.uid()) or is_admin());
create policy kyc_update_admin on trova_kyc_applications
  for update
  using (is_admin())
  with check (true);
create policy kyc_insert_admin on trova_kyc_applications
  for insert
  with check (seller_id = (select id from trova_sellers where profile_id = auth.uid()) or is_admin());

-- Disputes admin policies
alter table trova_disputes enable row level security;
drop policy if exists disputes_select_admin on trova_disputes;
drop policy if exists disputes_update_admin on trova_disputes;
drop policy if exists disputes_insert_admin on trova_disputes;
create policy disputes_select_admin on trova_disputes
  for select
  using (
    exists (
      select 1 from trova_transactions t 
      where t.id = transaction_id 
      and (
        t.seller_id = (select id from trova_sellers where profile_id = auth.uid())
        or t.buyer_id = (select id from trova_buyers where profile_id = auth.uid())
      )
    )
    or is_admin()
  );
create policy disputes_update_admin on trova_disputes
  for update
  using (is_admin())
  with check (true);
create policy disputes_insert_admin on trova_disputes
  for insert
  with check (true);

-- Dispute messages
alter table trova_dispute_messages enable row level security;
drop policy if exists dispute_msgs_select_admin on trova_dispute_messages;
drop policy if exists dispute_msgs_insert_admin on trova_dispute_messages;
create policy dispute_msgs_select_admin on trova_dispute_messages
  for select
  using (
    exists (
      select 1 from trova_disputes d 
      where d.id = dispute_id 
      and (
        exists (
          select 1 from trova_transactions t 
          where t.id = d.transaction_id 
          and (
            t.seller_id = (select id from trova_sellers where profile_id = auth.uid())
            or t.buyer_id = (select id from trova_buyers where profile_id = auth.uid())
          )
        )
      )
    )
    or is_admin()
  );
create policy dispute_msgs_insert_admin on trova_dispute_messages
  for insert
  with check (sender_profile_id = auth.uid() or is_admin());

-- Support messages
alter table trova_support_messages enable row level security;
drop policy if exists support_select_admin on trova_support_messages;
drop policy if exists support_insert_admin on trova_support_messages;
create policy support_select_admin on trova_support_messages
  for select
  using (profile_id = auth.uid() or is_admin());
create policy support_insert_admin on trova_support_messages
  for insert
  with check (profile_id = auth.uid() or is_admin());

-- Payouts admin policies
alter table trova_payouts enable row level security;
drop policy if exists payouts_select_admin on trova_payouts;
drop policy if exists payouts_update_admin on trova_payouts;
drop policy if exists payouts_insert_admin on trova_payouts;
create policy payouts_select_admin on trova_payouts
  for select
  using (seller_id = (select id from trova_sellers where profile_id = auth.uid()) or is_admin());
create policy payouts_update_admin on trova_payouts
  for update
  using (is_admin())
  with check (true);
create policy payouts_insert_admin on trova_payouts
  for insert
  with check (seller_id = (select id from trova_sellers where profile_id = auth.uid()) or is_admin());

-- Ratings admin policies
alter table trova_ratings enable row level security;
drop policy if exists ratings_select_admin on trova_ratings;
drop policy if exists ratings_insert_admin on trova_ratings;
create policy ratings_select_admin on trova_ratings
  for select
  using (rater_profile_id = auth.uid() or is_admin());
create policy ratings_insert_admin on trova_ratings
  for insert
  with check (rater_profile_id = auth.uid() or is_admin());

-- Referrals admin policies
alter table trova_referrals enable row level security;
drop policy if exists referrals_select_admin on trova_referrals;
drop policy if exists referrals_insert_admin on trova_referrals;
create policy referrals_select_admin on trova_referrals
  for select
  using (referrer_seller_id = (select id from trova_sellers where profile_id = auth.uid()) or is_admin());
create policy referrals_insert_admin on trova_referrals
  for insert
  with check (referrer_seller_id = (select id from trova_sellers where profile_id = auth.uid()) or is_admin());

-- Audit logs admin policies
alter table trova_audit_logs enable row level security;
drop policy if exists audit_select_admin on trova_audit_logs;
drop policy if exists audit_insert_admin on trova_audit_logs;
create policy audit_select_admin on trova_audit_logs
  for select
  using (is_admin());
create policy audit_insert_admin on trova_audit_logs
  for insert
  with check (is_admin());

-- Notifications
alter table trova_notifications enable row level security;
drop policy if exists notifications_select_admin on trova_notifications;
drop policy if exists notifications_insert_admin on trova_notifications;
create policy notifications_select_admin on trova_notifications
  for select
  using (profile_id = auth.uid() or is_admin());
create policy notifications_insert_admin on trova_notifications
  for insert
  with check (profile_id = auth.uid() or is_admin());

-- System settings
alter table trova_system_settings enable row level security;
drop policy if exists settings_select_admin on trova_system_settings;
drop policy if exists settings_update_admin on trova_system_settings;
create policy settings_select_admin on trova_system_settings
  for select
  using (is_admin());
create policy settings_update_admin on trova_system_settings
  for update
  using (is_admin())
  with check (true);
