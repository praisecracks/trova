
-- 001_initial_schema.sql
-- Initial Trova schema: profiles, sellers, buyers, transactions, kyc, disputes, messages, payouts, ratings, referrals, audit logs, notifications, system settings

-- Enable required extensions
create extension if not exists "pgcrypto";

-- Profiles
create table if not exists trova_profiles (
  id uuid primary key,
  email text not null unique,
  role text not null check (role in ('buyer','seller','admin')),
  display_name text,
  phone text,
  metadata jsonb,
  kyc_status text default 'unverified',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sellers
create table if not exists trova_sellers (
  id uuid primary key,
  profile_id uuid not null references trova_profiles(id) on delete cascade,
  business_name text,
  business_website text,
  payout_details jsonb,
  created_at timestamptz default now()
);

-- Buyers (optional account holders)
create table if not exists trova_buyers (
  id uuid primary key,
  profile_id uuid not null references trova_profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- Transactions / Escrow Links
create table if not exists trova_transactions (
  id text primary key,
  seller_id uuid references trova_sellers(id) on delete set null,
  buyer_id uuid references trova_buyers(id) on delete set null,
  buyer_email text,
  product_name text,
  amount numeric not null,
  shipping_fee numeric default 0,
  currency_code text default 'NGN',
  currency_symbol text default '₦',
  status text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  expires_at timestamptz
);

-- KYC Applications
create table if not exists trova_kyc_applications (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references trova_sellers(id) on delete cascade,
  status text not null check (status in ('pending','reviewing','verified','rejected')),
  submitted_at timestamptz default now(),
  reviewed_at timestamptz,
  review_comments text
);

-- Disputes
create table if not exists trova_disputes (
  id uuid primary key default gen_random_uuid(),
  transaction_id text references trova_transactions(id) on delete cascade,
  status text not null check (status in ('open','escalated','resolved','closed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Dispute messages
create table if not exists trova_dispute_messages (
  id uuid primary key default gen_random_uuid(),
  dispute_id uuid references trova_disputes(id) on delete cascade,
  sender_profile_id uuid references trova_profiles(id) on delete set null,
  sender_role text not null check (sender_role in ('buyer','seller','admin')),
  message text not null,
  created_at timestamptz default now()
);

-- Support messages (admin or system messages)
create table if not exists trova_support_messages (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references trova_profiles(id) on delete cascade,
  subject text,
  message text,
  created_at timestamptz default now()
);

-- Payouts
create table if not exists trova_payouts (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references trova_sellers(id) on delete cascade,
  amount numeric not null,
  currency_code text default 'NGN',
  currency_symbol text default '₦',
  status text not null check (status in ('pending','processing','completed','failed')),
  created_at timestamptz default now(),
  processed_at timestamptz
);

-- Ratings
create table if not exists trova_ratings (
  id uuid primary key default gen_random_uuid(),
  transaction_id text references trova_transactions(id) on delete cascade,
  rater_profile_id uuid references trova_profiles(id) on delete set null,
  score smallint check (score &gt;= 1 and score &lt;= 5),
  comment text,
  created_at timestamptz default now()
);

-- Referrals
create table if not exists trova_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_seller_id uuid references trova_sellers(id) on delete cascade,
  referee_email text not null,
  store_name text,
  sign_up_date timestamptz,
  status text not null check (status in ('Pending','Active','Cancelled')),
  created_at timestamptz default now()
);

-- Audit logs
create table if not exists trova_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references trova_profiles(id) on delete set null,
  action text not null,
  category text,
  target_id text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Notifications
create table if not exists trova_notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references trova_profiles(id) on delete cascade,
  text_payload text,
  read boolean default false,
  created_at timestamptz default now()
);

-- System settings
create table if not exists trova_system_settings (
  key text primary key,
  value jsonb
);

-- Enable RLS and policies

-- Idempotent cleanup for databases where these policies already exist.
drop policy if exists profiles_select_own on trova_profiles;
drop policy if exists profiles_insert on trova_profiles;
drop policy if exists profiles_update_own on trova_profiles;
drop policy if exists profiles_delete_admin on trova_profiles;

drop policy if exists sellers_select_owner on trova_sellers;
drop policy if exists sellers_insert on trova_sellers;
drop policy if exists sellers_update_owner on trova_sellers;
drop policy if exists sellers_delete_admin on trova_sellers;

drop policy if exists buyers_select_owner on trova_buyers;
drop policy if exists buyers_insert on trova_buyers;
drop policy if exists buyers_update_owner on trova_buyers;

drop policy if exists transactions_select_owner on trova_transactions;
drop policy if exists transactions_insert_seller on trova_transactions;
drop policy if exists transactions_update_owner on trova_transactions;

drop policy if exists kyc_select_owner on trova_kyc_applications;
drop policy if exists kyc_insert_owner on trova_kyc_applications;
drop policy if exists kyc_update_owner on trova_kyc_applications;

drop policy if exists disputes_select_owner on trova_disputes;
drop policy if exists disputes_insert on trova_disputes;
drop policy if exists disputes_update_owner on trova_disputes;

drop policy if exists dispute_msgs_select_owner on trova_dispute_messages;
drop policy if exists dispute_msgs_insert_owner on trova_dispute_messages;

drop policy if exists support_select_owner on trova_support_messages;
drop policy if exists support_insert on trova_support_messages;

drop policy if exists payouts_select_owner on trova_payouts;
drop policy if exists payouts_insert_owner on trova_payouts;
drop policy if exists payouts_update_owner on trova_payouts;

drop policy if exists ratings_select_owner on trova_ratings;
drop policy if exists ratings_insert_owner on trova_ratings;

drop policy if exists referrals_select_owner on trova_referrals;
drop policy if exists referrals_insert_owner on trova_referrals;

drop policy if exists audit_select_admin on trova_audit_logs;
drop policy if exists audit_insert_admin on trova_audit_logs;

drop policy if exists notifications_select_owner on trova_notifications;
drop policy if exists notifications_insert_owner on trova_notifications;

drop policy if exists settings_select_admin on trova_system_settings;
drop policy if exists settings_update_admin on trova_system_settings;

-- Profiles policies
alter table trova_profiles enable row level security;
create policy profiles_select_own on trova_profiles for select using (id = auth.uid());
create policy profiles_insert on trova_profiles for insert with check (auth.uid() is not null and auth.uid() = id);
create policy profiles_update_own on trova_profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_delete_admin on trova_profiles for delete using (false);

-- Sellers policies
alter table trova_sellers enable row level security;
create policy sellers_select_owner on trova_sellers for select using (profile_id = auth.uid());
create policy sellers_insert on trova_sellers for insert with check (auth.uid() is not null and profile_id = auth.uid());
create policy sellers_update_owner on trova_sellers for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy sellers_delete_admin on trova_sellers for delete using (false);

-- Buyers policies
alter table trova_buyers enable row level security;
create policy buyers_select_owner on trova_buyers for select using (profile_id = auth.uid() or exists (select 1 from trova_profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy buyers_insert on trova_buyers for insert with check (profile_id = auth.uid() or exists (select 1 from trova_profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy buyers_update_owner on trova_buyers for update using (profile_id = auth.uid() or exists (select 1 from trova_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (profile_id = auth.uid() or exists (select 1 from trova_profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Transactions policies
alter table trova_transactions enable row level security;
create policy transactions_select_owner on trova_transactions for select using (
  seller_id = (select id from trova_sellers where profile_id = auth.uid())
  or buyer_id = (select id from trova_buyers where profile_id = auth.uid())
  or exists (select 1 from trova_profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy transactions_insert_seller on trova_transactions for insert with check (
  (seller_id is null) or seller_id = (select id from trova_sellers where profile_id = auth.uid()) or exists (select 1 from trova_profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy transactions_update_owner on trova_transactions for update using (
  seller_id = (select id from trova_sellers where profile_id = auth.uid())
  or buyer_id = (select id from trova_buyers where profile_id = auth.uid())
  or exists (select 1 from trova_profiles p where p.id = auth.uid() and p.role = 'admin')
) with check (
  seller_id = (select id from trova_sellers where profile_id = auth.uid())
  or buyer_id = (select id from trova_buyers where profile_id = auth.uid())
  or exists (select 1 from trova_profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- KYC policies
alter table trova_kyc_applications enable row level security;
create policy kyc_select_owner on trova_kyc_applications for select using (
  seller_id = (select id from trova_sellers where profile_id = auth.uid())
  or exists (select 1 from trova_profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy kyc_insert_owner on trova_kyc_applications for insert with check (seller_id = (select id from trova_sellers where profile_id = auth.uid()) or exists (select 1 from trova_profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy kyc_update_owner on trova_kyc_applications for update using (seller_id = (select id from trova_sellers where profile_id = auth.uid()) or exists (select 1 from trova_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (seller_id = (select id from trova_sellers where profile_id = auth.uid()) or exists (select 1 from trova_profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Disputes &amp; messages policies
alter table trova_disputes enable row level security;
create policy disputes_select_owner on trova_disputes for select using (
  exists (select 1 from trova_transactions t where t.id = transaction_id and (t.seller_id = (select id from trova_sellers where profile_id = auth.uid()) or t.buyer_id = (select id from trova_buyers where profile_id = auth.uid())))
  or exists (select 1 from trova_profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy disputes_insert on trova_disputes for insert with check (true);
create policy disputes_update_owner on trova_disputes for update using (exists (select 1 from trova_profiles p where p.id = auth.uid() and p.role = 'admin') or exists (select 1 from trova_transactions t where t.id = transaction_id and t.seller_id = (select id from trova_sellers where profile_id = auth.uid()))) with check (true);

alter table trova_dispute_messages enable row level security;
create policy dispute_msgs_select_owner on trova_dispute_messages for select using (
  exists (select 1 from trova_disputes d where d.id = dispute_id and (
    exists (select 1 from trova_transactions t where t.id = d.transaction_id and (t.seller_id = (select id from trova_sellers where profile_id = auth.uid()) or t.buyer_id = (select id from trova_buyers where profile_id = auth.uid())))
  )) or exists (select 1 from trova_profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy dispute_msgs_insert_owner on trova_dispute_messages for insert with check (sender_profile_id = auth.uid() or exists (select 1 from trova_profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Support messages
alter table trova_support_messages enable row level security;
create policy support_select_owner on trova_support_messages for select using (profile_id = auth.uid() or exists (select 1 from trova_profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy support_insert on trova_support_messages for insert with check (profile_id = auth.uid() or exists (select 1 from trova_profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Payouts
alter table trova_payouts enable row level security;
create policy payouts_select_owner on trova_payouts for select using (seller_id = (select id from trova_sellers where profile_id = auth.uid()) or exists (select 1 from trova_profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy payouts_insert_owner on trova_payouts for insert with check (seller_id = (select id from trova_sellers where profile_id = auth.uid()) or exists (select 1 from trova_profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy payouts_update_owner on trova_payouts for update using (seller_id = (select id from trova_sellers where profile_id = auth.uid()) or exists (select 1 from trova_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (seller_id = (select id from trova_sellers where profile_id = auth.uid()) or exists (select 1 from trova_profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Ratings
alter table trova_ratings enable row level security;
create policy ratings_select_owner on trova_ratings for select using (rater_profile_id = auth.uid() or exists (select 1 from trova_profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy ratings_insert_owner on trova_ratings for insert with check (rater_profile_id = auth.uid() or exists (select 1 from trova_profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Referrals
alter table trova_referrals enable row level security;
create policy referrals_select_owner on trova_referrals for select using (referrer_seller_id = (select id from trova_sellers where profile_id = auth.uid()) or exists (select 1 from trova_profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy referrals_insert_owner on trova_referrals for insert with check (referrer_seller_id = (select id from trova_sellers where profile_id = auth.uid()) or exists (select 1 from trova_profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Audit logs
alter table trova_audit_logs enable row level security;
create policy audit_select_admin on trova_audit_logs for select using (exists (select 1 from trova_profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy audit_insert_admin on trova_audit_logs for insert with check (exists (select 1 from trova_profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Notifications
alter table trova_notifications enable row level security;
create policy notifications_select_owner on trova_notifications for select using (profile_id = auth.uid() or exists (select 1 from trova_profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy notifications_insert_owner on trova_notifications for insert with check (profile_id = auth.uid() or exists (select 1 from trova_profiles p where p.id = auth.uid() and p.role = 'admin'));

-- System settings
alter table trova_system_settings enable row level security;
create policy settings_select_admin on trova_system_settings for select using (exists (select 1 from trova_profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy settings_update_admin on trova_system_settings for update using (exists (select 1 from trova_profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from trova_profiles p where p.id = auth.uid() and p.role = 'admin'));

-- 002_fix_sellers_id_default.sql
-- Ensure trova_sellers.id has a default UUID generator
alter table trova_sellers alter column id set default gen_random_uuid();

-- 003_create_profiles_on_auth.sql
-- Create function to insert trova_profiles and trova_sellers when a new auth user is created
create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Insert profile row if not exists
  insert into public.trova_profiles (id, email, role, display_name, created_at)
  values (new.id, new.email, 'seller', (new.raw_user_meta-&gt;&gt;'full_name')::text, now())
  on conflict (id) do nothing;

  -- Insert seller row if not exists
  insert into public.trova_sellers (id, profile_id, business_name, created_at)
  values (new.id, new.id, (new.raw_user_meta-&gt;&gt;'business_name')::text, now())
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Create trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_auth_user_created();

-- 004_fix_rls_policies.sql
-- Fix RLS policies that are causing infinite recursion during profile lookup.
-- Change profile access rules to owner-only checks and remove self-referential subqueries.

-- Drop existing problematic policies
drop policy if exists profiles_select_own on trova_profiles;
drop policy if exists profiles_insert on trova_profiles;
drop policy if exists profiles_update_own on trova_profiles;
drop policy if exists profiles_delete_admin on trova_profiles;

drop policy if exists sellers_select_owner on trova_sellers;
drop policy if exists sellers_insert on trova_sellers;
drop policy if exists sellers_update_owner on trova_sellers;
drop policy if exists sellers_delete_admin on trova_sellers;

-- Recreate profiles policies with safe owner-only rules
create policy profiles_select_own on trova_profiles
  for select
  using (auth.uid() = id);

create policy profiles_insert on trova_profiles
  for insert
  with check (auth.uid() is not null and auth.uid() = id);

create policy profiles_update_own on trova_profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy profiles_delete_admin on trova_profiles
  for delete
  using (false);

-- Recreate seller policies with safe owner-only rules
create policy sellers_select_owner on trova_sellers
  for select
  using (profile_id = auth.uid());

create policy sellers_insert on trova_sellers
  for insert
  with check (auth.uid() is not null and profile_id = auth.uid());

create policy sellers_update_owner on trova_sellers
  for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy sellers_delete_admin on trova_sellers
  for delete
  using (false);

-- 004_add_kyc_fields_to_profiles.sql
alter table trova_profiles 
  add column if not exists kyc_rejection_reason text,
  add column if not exists kyc_submitted_at timestamptz,
  add column if not exists kyc_approved_at timestamptz;

-- 005_safe_profile_policy_fix.sql
-- Fix infinite recursion in RLS policies and keep profile access limited to the authenticated owner.
-- This migration is intended to correct the live DB state for existing deployments.

-- Drop the old recursive policies that caused "infinite recursion detected" on trova_profiles
drop policy if exists profiles_select_own on trova_profiles;
drop policy if exists profiles_insert on trova_profiles;
drop policy if exists profiles_update_own on trova_profiles;
drop policy if exists profiles_delete_admin on trova_profiles;

-- Recreate safe profile policies without self-referential subqueries
create policy profiles_select_own on trova_profiles
  for select
  using (auth.uid() = id);

create policy profiles_insert on trova_profiles
  for insert
  with check (auth.uid() is not null and auth.uid() = id);

create policy profiles_update_own on trova_profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Prevent client-side delete access on profiles until a trusted admin policy is added
create policy profiles_delete_admin on trova_profiles
  for delete
  using (false);

-- Drop seller policies that used nested same-table subqueries
drop policy if exists sellers_select_owner on trova_sellers;
drop policy if exists sellers_insert on trova_sellers;
drop policy if exists sellers_update_owner on trova_sellers;
drop policy if exists sellers_delete_admin on trova_sellers;

-- Recreate seller policies with owner-only access
create policy sellers_select_owner on trova_sellers
  for select
  using (profile_id = auth.uid());

create policy sellers_insert on trova_sellers
  for insert
  with check (auth.uid() is not null and profile_id = auth.uid());

create policy sellers_update_owner on trova_sellers
  for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy sellers_delete_admin on trova_sellers
  for delete
  using (false);

-- 006_real_transaction_creation.sql
-- Adds production fields and RPCs for real escrow transaction creation.
alter table trova_sellers
  add column if not exists status text not null default 'active' check (status in ('active', 'suspended'));

alter table trova_transactions
  add column if not exists buyer_phone text,
  add column if not exists description text not null default '',
  add column if not exists transaction_type text not null default 'physical' check (transaction_type in ('physical', 'service')),
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists payment_reference text unique,
  add column if not exists paystack_reference text unique,
  add column if not exists idempotency_key text unique;

create index if not exists idx_trova_transactions_seller_status
  on trova_transactions (seller_id, status);

create index if not exists idx_trova_transactions_expires_at
  on trova_transactions (expires_at);

create index if not exists idx_trova_transactions_payment_reference
  on trova_transactions (payment_reference);

insert into trova_system_settings (key, value)
values
  ('transaction_limits', '{
    "unverifiedDailyCreationLimit": 5,
    "unverifiedSingleTransactionLimitNgn": 50000,
    "unverifiedComplianceDeclineLimitNgn": 1000000,
    "singleTransactionCapNgn": 5000000
  }'::jsonb),
  ('currency_exchange_rates', '{
    "USD_NGN": 1500
  }'::jsonb)
on conflict (key) do update set value = excluded.value;

create or replace function public.trova_create_transaction(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid := auth.uid();
  v_profile_role text;
  v_kyc_status text;
  v_seller_id uuid;
  v_seller_status text;
  v_amount numeric;
  v_shipping_fee numeric;
  v_currency_code text;
  v_currency_symbol text;
  v_transaction_type text;
  v_description text;
  v_buyer_phone text;
  v_buyer_email text;
  v_product_name text;
  v_amount_naira numeric;
  v_exchange_rate numeric;
  v_single_cap numeric;
  v_unverified_single_limit numeric;
  v_unverified_compliance_limit numeric;
  v_generated_id text;
  v_attempts int := 0;
  v_transaction trova_transactions;
begin
  if v_profile_id is null then
    raise exception 'Authentication required' using errcode = 'P0001';
  end if;

  select p.role, p.kyc_status
  into v_profile_role, v_kyc_status
  from trova_profiles p
  where p.id = v_profile_id;

  if v_profile_role is null then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  if v_profile_role &lt;&gt; 'seller' then
    raise exception 'Only seller accounts can create escrow links' using errcode = 'P0003';
  end if;

  select s.id, s.status
  into v_seller_id, v_seller_status
  from trova_sellers s
  where s.profile_id = v_profile_id;

  if v_seller_id is null then
    raise exception 'Seller profile not found' using errcode = 'P0004';
  end if;

  if v_seller_status = 'suspended' then
    raise exception 'Seller account is suspended' using errcode = 'P0005';
  end if;

  v_product_name := nullif(trim(coalesce(payload-&gt;&gt;'productName', payload-&gt;&gt;'product_name')), '');
  v_buyer_phone := nullif(trim(coalesce(payload-&gt;&gt;'buyerPhone', payload-&gt;&gt;'buyer_phone')), '');
  v_buyer_email := nullif(trim(payload-&gt;&gt;'buyerEmail'), '');
  v_description := trim(coalesce(payload-&gt;&gt;'description', ''));
  v_amount := coalesce(nullif((payload-&gt;&gt;'amount')::numeric, 0), 0);
  v_shipping_fee := coalesce(nullif((payload-&gt;&gt;'shippingFee')::numeric, 0), 0);
  v_currency_code := upper(coalesce(payload-&gt;&gt;'currencyCode', payload-&gt;&gt;'currency_code', 'NGN'));
  v_transaction_type := coalesce(payload-&gt;&gt;'transactionType', payload-&gt;&gt;'transaction_type', 'physical');
  v_currency_symbol := case when v_currency_code = 'USD' then '$' else '₦' end;
  v_exchange_rate := coalesce(((select value-&gt;&gt;'USD_NGN' from trova_system_settings where key = 'currency_exchange_rates')::numeric), 1500);
  v_amount_naira := case when v_currency_code = 'USD' then v_amount * v_exchange_rate else v_amount end;

  select
    coalesce((value-&gt;&gt;'singleTransactionCapNgn')::numeric, 5000000),
    coalesce((value-&gt;&gt;'unverifiedSingleTransactionLimitNgn')::numeric, 50000),
    coalesce((value-&gt;&gt;'unverifiedComplianceDeclineLimitNgn')::numeric, 1000000)
  into v_single_cap, v_unverified_single_limit, v_unverified_compliance_limit
  from trova_system_settings
  where key = 'transaction_limits';

  if v_product_name is null then
    raise exception 'Product name is required' using errcode = 'P0006';
  end if;

  if length(v_product_name) &gt; 160 then
    raise exception 'Product name is too long' using errcode = 'P0007';
  end if;

  if v_buyer_phone is null then
    raise exception 'Buyer phone number is required' using errcode = 'P0008';
  end if;

  if v_amount &lt;= 0 then
    raise exception 'Amount must be greater than zero' using errcode = 'P0009';
  end if;

  if v_shipping_fee &lt; 0 then
    raise exception 'Shipping fee cannot be negative' using errcode = 'P0010';
  end if;

  if v_currency_code not in ('NGN', 'USD') then
    raise exception 'Unsupported currency' using errcode = 'P0011';
  end if;

  if v_transaction_type not in ('physical', 'service') then
    raise exception 'Unsupported transaction type' using errcode = 'P0012';
  end if;

  if v_amount_naira &gt; v_single_cap then
    raise exception 'Transaction amount exceeds platform cap' using errcode = 'P0013';
  end if;

  if coalesce(v_kyc_status, 'unverified') &lt;&gt; 'verified' then
    if v_amount_naira &gt; v_unverified_single_limit then
      raise exception 'Unverified sellers can only create escrow links up to the active limit' using errcode = 'P0014';
    end if;

    if v_amount_naira &gt; v_unverified_compliance_limit then
      raise exception 'Transaction requires verified KYC status' using errcode = 'P0015';
    end if;
  end if;

  loop
    v_attempts := v_attempts + 1;
    v_generated_id := 'TL-' || floor(1000 + random() * 9000)::int::text;

    if not exists (select 1 from trova_transactions where id = v_generated_id) then
      exit;
    end if;

    if v_attempts &gt;= 10 then
      raise exception 'Unable to generate unique transaction reference' using errcode = 'P0016';
    end if;
  end loop;

  insert into trova_transactions (
    id,
    seller_id,
    buyer_email,
    buyer_phone,
    product_name,
    amount,
    shipping_fee,
    currency_code,
    currency_symbol,
    status,
    description,
    transaction_type,
    expires_at,
    metadata
  ) values (
    v_generated_id,
    v_seller_id,
    v_buyer_email,
    v_buyer_phone,
    v_product_name,
    v_amount,
    v_shipping_fee,
    v_currency_code,
    v_currency_symbol,
    'pending_deposit',
    v_description,
    v_transaction_type,
    now() + interval '72 hours',
    jsonb_build_object(
      'createdByProfileId', v_profile_id,
      'kycStatusAtCreation', coalesce(v_kyc_status, 'unverified'),
      'amountInNgn', v_amount_naira
    )
  )
  returning * into v_transaction;

  insert into trova_notifications (profile_id, text_payload, read)
  values (
    v_profile_id,
    format('New escrow link created: %s (%s).', v_product_name, v_generated_id),
    false
  );

  return jsonb_build_object(
    'transaction', jsonb_build_object(
      'id', v_transaction.id,
      'sellerId', v_transaction.seller_id,
      'buyerEmail', v_transaction.buyer_email,
      'buyerPhone', v_transaction.buyer_phone,
      'productName', v_transaction.product_name,
      'amount', v_transaction.amount,
      'shippingFee', v_transaction.shipping_fee,
      'currencyCode', v_transaction.currency_code,
      'currencySymbol', v_transaction.currency_symbol,
      'status', v_transaction.status,
      'description', v_transaction.description,
      'transactionType', v_transaction.transaction_type,
      'createdAt', v_transaction.created_at,
      'updatedAt', v_transaction.updated_at,
      'expiresAt', v_transaction.expires_at
    ),
    'paymentUrl', format('/pay/%s', v_generated_id),
    'trackingUrl', format('/track/%s', v_generated_id)
  );
exception
  when others then
    raise exception '%', sqlerrm using errcode = coalesce(sqlstate, 'P0099');
end;
$$;

create or replace function public.trova_get_public_transaction(p_transaction_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_transaction jsonb;
begin
  select jsonb_build_object(
    'id', t.id,
    'sellerName', s.business_name,
    'buyerId', t.buyer_id,
    'buyerEmail', t.buyer_email,
    'buyerPhone', t.buyer_phone,
    'productName', t.product_name,
    'amount', t.amount,
    'shippingFee', t.shipping_fee,
    'currencyCode', t.currency_code,
    'currencySymbol', t.currency_symbol,
    'status', t.status,
    'description', t.description,
    'transactionType', t.transaction_type,
    'createdAt', t.created_at,
    'updatedAt', t.updated_at,
    'expiresAt', t.expires_at
  )
  into v_transaction
  from trova_transactions t
  left join trova_sellers s on s.id = t.seller_id
  where t.id = p_transaction_id;

  if v_transaction is null then
    raise exception 'Transaction not found' using errcode = 'P0002';
  end if;

  return v_transaction;
end;
$$;

revoke all on function public.trova_create_transaction(jsonb) from public;
grant execute on function public.trova_create_transaction(jsonb) to authenticated;

grant execute on function public.trova_get_public_transaction(text) to public;

-- 007_fix_transaction_rpc_error_handling.sql
-- Replaces the transaction creation RPC with safer error handling and stricter numeric parsing.
create or replace function public.trova_create_transaction(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid := auth.uid();
  v_profile_role text;
  v_kyc_status text;
  v_seller_id uuid;
  v_seller_status text;
  v_amount numeric;
  v_shipping_fee numeric;
  v_currency_code text;
  v_currency_symbol text;
  v_transaction_type text;
  v_description text;
  v_buyer_phone text;
  v_buyer_email text;
  v_product_name text;
  v_amount_naira numeric;
  v_exchange_rate numeric;
  v_single_cap numeric;
  v_unverified_single_limit numeric;
  v_unverified_compliance_limit numeric;
  v_generated_id text;
  v_attempts int := 0;
  v_transaction trova_transactions;
begin
  if v_profile_id is null then
    raise exception 'Authentication required' using errcode = 'P0001';
  end if;

  select p.role, p.kyc_status
  into v_profile_role, v_kyc_status
  from trova_profiles p
  where p.id = v_profile_id;

  if v_profile_role is null then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  if v_profile_role &lt;&gt; 'seller' then
    raise exception 'Only seller accounts can create escrow links' using errcode = 'P0003';
  end if;

  select s.id, s.status
  into v_seller_id, v_seller_status
  from trova_sellers s
  where s.profile_id = v_profile_id;

  if v_seller_id is null then
    raise exception 'Seller profile not found' using errcode = 'P0004';
  end if;

  if v_seller_status = 'suspended' then
    raise exception 'Seller account is suspended' using errcode = 'P0005';
  end if;

  v_product_name := nullif(trim(coalesce(payload-&gt;&gt;'productName', payload-&gt;&gt;'product_name')), '');
  v_buyer_phone := nullif(trim(coalesce(payload-&gt;&gt;'buyerPhone', payload-&gt;&gt;'buyer_phone')), '');
  v_buyer_email := nullif(trim(coalesce(payload-&gt;&gt;'buyerEmail', payload-&gt;&gt;'buyer_email')), '');
  v_description := trim(coalesce(payload-&gt;&gt;'description', ''));
  v_amount := coalesce(nullif(nullif(payload-&gt;&gt;'amount', ''), '0')::numeric, 0);
  v_shipping_fee := coalesce(nullif(nullif(payload-&gt;&gt;'shippingFee', ''), '0')::numeric, 0);
  v_currency_code := upper(coalesce(payload-&gt;&gt;'currencyCode', payload-&gt;&gt;'currency_code', 'NGN'));
  v_transaction_type := lower(coalesce(payload-&gt;&gt;'transactionType', payload-&gt;&gt;'transaction_type', 'physical'));
  v_currency_symbol := case when v_currency_code = 'USD' then '$' else '₦' end;
  v_exchange_rate := coalesce(((select value-&gt;&gt;'USD_NGN' from trova_system_settings where key = 'currency_exchange_rates')::numeric), 1500);
  v_amount_naira := case when v_currency_code = 'USD' then v_amount * v_exchange_rate else v_amount end;

  select
    coalesce((value-&gt;&gt;'singleTransactionCapNgn')::numeric, 5000000),
    coalesce((value-&gt;&gt;'unverifiedSingleTransactionLimitNgn')::numeric, 50000),
    coalesce((value-&gt;&gt;'unverifiedComplianceDeclineLimitNgn')::numeric, 1000000)
  into v_single_cap, v_unverified_single_limit, v_unverified_compliance_limit
  from trova_system_settings
  where key = 'transaction_limits';

  if v_product_name is null then
    raise exception 'Product name is required' using errcode = 'P0006';
  end if;

  if length(v_product_name) &gt; 160 then
    raise exception 'Product name is too long' using errcode = 'P0007';
  end if;

  if v_buyer_phone is null then
    raise exception 'Buyer phone number is required' using errcode = 'P0008';
  end if;

  if v_amount &lt;= 0 then
    raise exception 'Amount must be greater than zero' using errcode = 'P0009';
  end if;

  if v_shipping_fee &lt; 0 then
    raise exception 'Shipping fee cannot be negative' using errcode = 'P0010';
  end if;

  if v_currency_code not in ('NGN', 'USD') then
    raise exception 'Unsupported currency' using errcode = 'P0011';
  end if;

  if v_transaction_type not in ('physical', 'service') then
    raise exception 'Unsupported transaction type' using errcode = 'P0012';
  end if;

  if v_amount_naira &gt; v_single_cap then
    raise exception 'Transaction amount exceeds platform cap' using errcode = 'P0013';
  end if;

  if coalesce(v_kyc_status, 'unverified') &lt;&gt; 'verified' then
    if v_amount_naira &gt; v_unverified_single_limit then
      raise exception 'Unverified sellers can only create escrow links up to the active limit' using errcode = 'P0014';
    end if;

    if v_amount_naira &gt; v_unverified_compliance_limit then
      raise exception 'Transaction requires verified KYC status' using errcode = 'P0015';
    end if;
  end if;

  loop
    v_attempts := v_attempts + 1;
    v_generated_id := 'TL-' || floor(1000 + random() * 9000)::int::text;

    if not exists (select 1 from trova_transactions where id = v_generated_id) then
      exit;
    end if;

    if v_attempts &gt;= 10 then
      raise exception 'Unable to generate unique transaction reference' using errcode = 'P0016';
    end if;
  end loop;

  insert into trova_transactions (
    id,
    seller_id,
    buyer_email,
    buyer_phone,
    product_name,
    amount,
    shipping_fee,
    currency_code,
    currency_symbol,
    status,
    description,
    transaction_type,
    expires_at,
    metadata
  ) values (
    v_generated_id,
    v_seller_id,
    v_buyer_email,
    v_buyer_phone,
    v_product_name,
    v_amount,
    v_shipping_fee,
    v_currency_code,
    v_currency_symbol,
    'pending_deposit',
    v_description,
    v_transaction_type,
    now() + interval '72 hours',
    jsonb_build_object(
      'createdByProfileId', v_profile_id,
      'kycStatusAtCreation', coalesce(v_kyc_status, 'unverified'),
      'amountInNgn', v_amount_naira
    )
  )
  returning * into v_transaction;

  insert into trova_notifications (profile_id, text_payload, read)
  values (
    v_profile_id,
    format('New escrow link created: %s (%s).', v_product_name, v_generated_id),
    false
  );

  return jsonb_build_object(
    'transaction', jsonb_build_object(
      'id', v_transaction.id,
      'sellerId', v_transaction.seller_id,
      'buyerEmail', v_transaction.buyer_email,
      'buyerPhone', v_transaction.buyer_phone,
      'productName', v_transaction.product_name,
      'amount', v_transaction.amount,
      'shippingFee', v_transaction.shipping_fee,
      'currencyCode', v_transaction.currency_code,
      'currencySymbol', v_transaction.currency_symbol,
      'status', v_transaction.status,
      'description', v_transaction.description,
      'transactionType', v_transaction.transaction_type,
      'createdAt', v_transaction.created_at,
      'updatedAt', v_transaction.updated_at,
      'expiresAt', v_transaction.expires_at
    ),
    'paymentUrl', format('/pay/%s', v_generated_id),
    'trackingUrl', format('/track/%s', v_generated_id)
  );
exception
  when others then
    raise exception '%', sqlerrm;
end;
$$;

revoke all on function public.trova_create_transaction(jsonb) from public;
grant execute on function public.trova_create_transaction(jsonb) to authenticated;

-- 008_sanitize_transaction_creation_inputs.sql
-- Makes transaction creation resilient to formatted currency inputs such as "₦100,000" or "100,000.50".
create or replace function public.trova_create_transaction(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid := auth.uid();
  v_profile_role text;
  v_kyc_status text;
  v_seller_id uuid;
  v_seller_status text;
  v_amount numeric;
  v_shipping_fee numeric;
  v_currency_code text;
  v_currency_symbol text;
  v_transaction_type text;
  v_description text;
  v_buyer_phone text;
  v_buyer_email text;
  v_product_name text;
  v_amount_naira numeric;
  v_exchange_rate numeric;
  v_single_cap numeric;
  v_unverified_single_limit numeric;
  v_unverified_compliance_limit numeric;
  v_generated_id text;
  v_attempts int := 0;
  v_transaction trova_transactions;
begin
  if v_profile_id is null then
    raise exception 'Authentication required' using errcode = 'P0001';
  end if;

  select p.role, p.kyc_status
  into v_profile_role, v_kyc_status
  from trova_profiles p
  where p.id = v_profile_id;

  if v_profile_role is null then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  if v_profile_role &lt;&gt; 'seller' then
    raise exception 'Only seller accounts can create escrow links' using errcode = 'P0003';
  end if;

  select s.id, s.status
  into v_seller_id, v_seller_status
  from trova_sellers s
  where s.profile_id = v_profile_id;

  if v_seller_id is null then
    raise exception 'Seller profile not found' using errcode = 'P0004';
  end if;

  if v_seller_status = 'suspended' then
    raise exception 'Seller account is suspended' using errcode = 'P0005';
  end if;

  v_product_name := nullif(trim(coalesce(payload-&gt;&gt;'productName', payload-&gt;&gt;'product_name')), '');
  v_buyer_phone := nullif(trim(coalesce(payload-&gt;&gt;'buyerPhone', payload-&gt;&gt;'buyer_phone')), '');
  v_buyer_email := nullif(trim(coalesce(payload-&gt;&gt;'buyerEmail', payload-&gt;&gt;'buyer_email')), '');
  v_description := trim(coalesce(payload-&gt;&gt;'description', ''));
  v_amount := coalesce(nullif(regexp_replace(payload-&gt;&gt;'amount', '[^0-9.\-]', '', 'g'), '')::numeric, 0);
  v_shipping_fee := coalesce(nullif(regexp_replace(payload-&gt;&gt;'shippingFee', '[^0-9.\-]', '', 'g'), '')::numeric, 0);
  v_currency_code := upper(coalesce(payload-&gt;&gt;'currencyCode', payload-&gt;&gt;'currency_code', 'NGN'));
  v_transaction_type := lower(coalesce(payload-&gt;&gt;'transactionType', payload-&gt;&gt;'transaction_type', 'physical'));
  v_currency_symbol := case when v_currency_code = 'USD' then '$' else '₦' end;
  v_exchange_rate := coalesce(((select value-&gt;&gt;'USD_NGN' from trova_system_settings where key = 'currency_exchange_rates')::numeric), 1500);
  v_amount_naira := case when v_currency_code = 'USD' then v_amount * v_exchange_rate else v_amount end;

  select
    coalesce((value-&gt;&gt;'singleTransactionCapNgn')::numeric, 5000000),
    coalesce((value-&gt;&gt;'unverifiedSingleTransactionLimitNgn')::numeric, 50000),
    coalesce((value-&gt;&gt;'unverifiedComplianceDeclineLimitNgn')::numeric, 1000000)
  into v_single_cap, v_unverified_single_limit, v_unverified_compliance_limit
  from trova_system_settings
  where key = 'transaction_limits';

  if v_product_name is null then
    raise exception 'Product name is required' using errcode = 'P0006';
  end if;

  if length(v_product_name) &gt; 160 then
    raise exception 'Product name is too long' using errcode = 'P0007';
  end if;

  if v_buyer_phone is null then
    raise exception 'Buyer phone number is required' using errcode = 'P0008';
  end if;

  if v_amount &lt;= 0 then
    raise exception 'Amount must be greater than zero' using errcode = 'P0009';
  end if;

  if v_shipping_fee &lt; 0 then
    raise exception 'Shipping fee cannot be negative' using errcode = 'P0010';
  end if;

  if v_currency_code not in ('NGN', 'USD') then
    raise exception 'Unsupported currency' using errcode = 'P0011';
  end if;

  if v_transaction_type not in ('physical', 'service') then
    raise exception 'Unsupported transaction type' using errcode = 'P0012';
  end if;

  if v_amount_naira &gt; v_single_cap then
    raise exception 'Transaction amount exceeds platform cap' using errcode = 'P0013';
  end if;

  if coalesce(v_kyc_status, 'unverified') &lt;&gt; 'verified' then
    if v_amount_naira &gt; v_unverified_single_limit then
      raise exception 'Unverified sellers can only create escrow links up to the active limit' using errcode = 'P0014';
    end if;

    if v_amount_naira &gt; v_unverified_compliance_limit then
      raise exception 'Transaction requires verified KYC status' using errcode = 'P0015';
    end if;
  end if;

  loop
    v_attempts := v_attempts + 1;
    v_generated_id := 'TL-' || floor(1000 + random() * 9000)::int::text;

    if not exists (select 1 from trova_transactions where id = v_generated_id) then
      exit;
    end if;

    if v_attempts &gt;= 10 then
      raise exception 'Unable to generate unique transaction reference' using errcode = 'P0016';
    end if;
  end loop;

  insert into trova_transactions (
    id,
    seller_id,
    buyer_email,
    buyer_phone,
    product_name,
    amount,
    shipping_fee,
    currency_code,
    currency_symbol,
    status,
    description,
    transaction_type,
    expires_at,
    metadata
  ) values (
    v_generated_id,
    v_seller_id,
    v_buyer_email,
    v_buyer_phone,
    v_product_name,
    v_amount,
    v_shipping_fee,
    v_currency_code,
    v_currency_symbol,
    'pending_deposit',
    v_description,
    v_transaction_type,
    now() + interval '72 hours',
    jsonb_build_object(
      'createdByProfileId', v_profile_id,
      'kycStatusAtCreation', coalesce(v_kyc_status, 'unverified'),
      'amountInNgn', v_amount_naira
    )
  )
  returning * into v_transaction;

  insert into trova_notifications (profile_id, text_payload, read)
  values (
    v_profile_id,
    format('New escrow link created: %s (%s).', v_product_name, v_generated_id),
    false
  );

  return jsonb_build_object(
    'transaction', jsonb_build_object(
      'id', v_transaction.id,
      'sellerId', v_transaction.seller_id,
      'buyerEmail', v_transaction.buyer_email,
      'buyerPhone', v_transaction.buyer_phone,
      'productName', v_transaction.product_name,
      'amount', v_transaction.amount,
      'shippingFee', v_transaction.shipping_fee,
      'currencyCode', v_transaction.currency_code,
      'currencySymbol', v_transaction.currency_symbol,
      'status', v_transaction.status,
      'description', v_transaction.description,
      'transactionType', v_transaction.transaction_type,
      'createdAt', v_transaction.created_at,
      'updatedAt', v_transaction.updated_at,
      'expiresAt', v_transaction.expires_at
    ),
    'paymentUrl', format('/pay/%s', v_generated_id),
    'trackingUrl', format('/track/%s', v_generated_id)
  );
exception
  when others then
    raise exception '%', sqlerrm;
end;
$$;

revoke all on function public.trova_create_transaction(jsonb) from public;
grant execute on function public.trova_create_transaction(jsonb) to authenticated;

notify pgrst, 'reload schema';

-- 009_buyer_claim_console.sql
-- Adds buyer claim/linking RPCs and buyer console support.
alter table trova_buyers
  add column if not exists display_name text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz default now();

create index if not exists idx_trova_buyers_profile_id on trova_buyers (profile_id);
create index if not exists idx_trova_buyers_email_lower on trova_buyers ((lower(email)));
create index if not exists idx_trova_buyers_phone_digits on trova_buyers ((regexp_replace(phone, '\D', '', 'g')));
create unique index if not exists idx_trova_buyers_email_unique on trova_buyers ((lower(email))) where email is not null;
create unique index if not exists idx_trova_buyers_phone_unique on trova_buyers ((regexp_replace(phone, '\D', '', 'g'))) where phone is not null and regexp_replace(phone, '\D', '', 'g') &lt;&gt; '';

create or replace function public.trova_create_transaction(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid := auth.uid();
  v_profile_role text;
  v_kyc_status text;
  v_seller_id uuid;
  v_seller_status text;
  v_amount numeric;
  v_shipping_fee numeric;
  v_currency_code text;
  v_currency_symbol text;
  v_transaction_type text;
  v_description text;
  v_buyer_phone text;
  v_buyer_email text;
  v_product_name text;
  v_amount_naira numeric;
  v_exchange_rate numeric;
  v_single_cap numeric;
  v_unverified_single_limit numeric;
  v_unverified_compliance_limit numeric;
  v_generated_id text;
  v_attempts int := 0;
  v_transaction trova_transactions;
begin
  if v_profile_id is null then
    raise exception 'Authentication required' using errcode = 'P0001';
  end if;

  select p.role, p.kyc_status
  into v_profile_role, v_kyc_status
  from trova_profiles p
  where p.id = v_profile_id;

  if v_profile_role is null then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  if v_profile_role &lt;&gt; 'seller' then
    raise exception 'Only seller accounts can create escrow links' using errcode = 'P0003';
  end if;

  select s.id, s.status
  into v_seller_id, v_seller_status
  from trova_sellers s
  where s.profile_id = v_profile_id;

  if v_seller_id is null then
    raise exception 'Seller profile not found' using errcode = 'P0004';
  end if;

  if v_seller_status = 'suspended' then
    raise exception 'Seller account is suspended' using errcode = 'P0005';
  end if;

  v_product_name := nullif(trim(coalesce(payload-&gt;&gt;'productName', payload-&gt;&gt;'product_name')), '');
  v_buyer_phone := nullif(trim(coalesce(payload-&gt;&gt;'buyerPhone', payload-&gt;&gt;'buyer_phone')), '');
  v_buyer_email := nullif(trim(coalesce(payload-&gt;&gt;'buyerEmail', payload-&gt;&gt;'buyer_email')), '');
  v_description := trim(coalesce(payload-&gt;&gt;'description', ''));
  v_amount := coalesce(nullif(regexp_replace(payload-&gt;&gt;'amount', '[^0-9.\-]', '', 'g'), '')::numeric, 0);
  v_shipping_fee := coalesce(nullif(regexp_replace(payload-&gt;&gt;'shippingFee', '[^0-9.\-]', '', 'g'), '')::numeric, 0);
  v_currency_code := upper(coalesce(payload-&gt;&gt;'currencyCode', payload-&gt;&gt;'currency_code', 'NGN'));
  v_transaction_type := lower(coalesce(payload-&gt;&gt;'transactionType', payload-&gt;&gt;'transaction_type', 'physical'));
  v_currency_symbol := case when v_currency_code = 'USD' then '$' else '₦' end;
  v_exchange_rate := coalesce(((select value-&gt;&gt;'USD_NGN' from trova_system_settings where key = 'currency_exchange_rates')::numeric), 1500);
  v_amount_naira := case when v_currency_code = 'USD' then v_amount * v_exchange_rate else v_amount end;

  select
    coalesce((value-&gt;&gt;'singleTransactionCapNgn')::numeric, 5000000),
    coalesce((value-&gt;&gt;'unverifiedSingleTransactionLimitNgn')::numeric, 50000),
    coalesce((value-&gt;&gt;'unverifiedComplianceDeclineLimitNgn')::numeric, 1000000)
  into v_single_cap, v_unverified_single_limit, v_unverified_compliance_limit
  from trova_system_settings
  where key = 'transaction_limits';

  if v_product_name is null then
    raise exception 'Product name is required' using errcode = 'P0006';
  end if;

  if length(v_product_name) &gt; 160 then
    raise exception 'Product name is too long' using errcode = 'P0007';
  end if;

  if v_buyer_phone is null then
    raise exception 'Buyer phone number is required' using errcode = 'P0008';
  end if;

  if v_amount &lt;= 0 then
    raise exception 'Amount must be greater than zero' using errcode = 'P0009';
  end if;

  if v_shipping_fee &lt; 0 then
    raise exception 'Shipping fee cannot be negative' using errcode = 'P0010';
  end if;

  if v_currency_code not in ('NGN', 'USD') then
    raise exception 'Unsupported currency' using errcode = 'P0011';
  end if;

  if v_transaction_type not in ('physical', 'service') then
    raise exception 'Unsupported transaction type' using errcode = 'P0012';
  end if;

  if v_amount_naira &gt; v_single_cap then
    raise exception 'Transaction amount exceeds platform cap' using errcode = 'P0013';
  end if;

  if coalesce(v_kyc_status, 'unverified') &lt;&gt; 'verified' then
    if v_amount_naira &gt; v_unverified_single_limit then
      raise exception 'Unverified sellers can only create escrow links up to the active limit' using errcode = 'P0014';
    end if;

    if v_amount_naira &gt; v_unverified_compliance_limit then
      raise exception 'Transaction requires verified KYC status' using errcode = 'P0015';
    end if;
  end if;

  loop
    v_attempts := v_attempts + 1;
    v_generated_id := 'TL-' || floor(1000 + random() * 9000)::int::text;

    if not exists (select 1 from trova_transactions where id = v_generated_id) then
      exit;
    end if;

    if v_attempts &gt;= 10 then
      raise exception 'Unable to generate unique transaction reference' using errcode = 'P0016';
    end if;
  end loop;

  insert into trova_transactions (
    id,
    seller_id,
    buyer_email,
    buyer_phone,
    product_name,
    amount,
    shipping_fee,
    currency_code,
    currency_symbol,
    status,
    description,
    transaction_type,
    expires_at,
    metadata
  ) values (
    v_generated_id,
    v_seller_id,
    v_buyer_email,
    v_buyer_phone,
    v_product_name,
    v_amount,
    v_shipping_fee,
    v_currency_code,
    v_currency_symbol,
    'pending_deposit',
    v_description,
    v_transaction_type,
    now() + interval '72 hours',
    jsonb_build_object(
      'createdByProfileId', v_profile_id,
      'kycStatusAtCreation', coalesce(v_kyc_status, 'unverified'),
      'amountInNgn', v_amount_naira
    )
  )
  returning * into v_transaction;

  insert into trova_notifications (profile_id, text_payload, read)
  values (
    v_profile_id,
    format('New escrow link created: %s (%s).', v_product_name, v_generated_id),
    false
  );

  return jsonb_build_object(
    'transaction', jsonb_build_object(
      'id', v_transaction.id,
      'sellerId', v_transaction.seller_id,
      'buyerId', v_transaction.buyer_id,
      'buyerEmail', v_transaction.buyer_email,
      'buyerPhone', v_transaction.buyer_phone,
      'productName', v_transaction.product_name,
      'amount', v_transaction.amount,
      'shippingFee', v_transaction.shipping_fee,
      'currencyCode', v_transaction.currency_code,
      'currencySymbol', v_transaction.currency_symbol,
      'status', v_transaction.status,
      'description', v_transaction.description,
      'transactionType', v_transaction.transaction_type,
      'createdAt', v_transaction.created_at,
      'updatedAt', v_transaction.updated_at,
      'expiresAt', v_transaction.expires_at,
      'claimedByBuyer', v_transaction.buyer_id is not null
    ),
    'paymentUrl', format('/pay/%s', v_generated_id),
    'trackingUrl', format('/track/%s', v_generated_id)
  );
exception
  when others then
    raise exception '%', sqlerrm;
end;
$$;

create or replace function public.trova_get_public_transaction(p_transaction_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_transaction jsonb;
begin
  select jsonb_build_object(
    'id', t.id,
    'sellerName', s.business_name,
    'buyerId', t.buyer_id,
    'buyerName', coalesce(bp.display_name, b.display_name),
    'buyerEmail', t.buyer_email,
    'buyerPhone', t.buyer_phone,
    'productName', t.product_name,
    'amount', t.amount,
    'shippingFee', t.shipping_fee,
    'currencyCode', t.currency_code,
    'currencySymbol', t.currency_symbol,
    'status', t.status,
    'description', t.description,
    'transactionType', t.transaction_type,
    'createdAt', t.created_at,
    'updatedAt', t.updated_at,
    'expiresAt', t.expires_at,
    'claimedByBuyer', t.buyer_id is not null
  )
  into v_transaction
  from trova_transactions t
  left join trova_sellers s on s.id = t.seller_id
  left join trova_buyers b on b.id = t.buyer_id
  left join trova_profiles bp on bp.id = b.profile_id
  where t.id = p_transaction_id;

  if v_transaction is null then
    raise exception 'Transaction not found' using errcode = 'P0002';
  end if;

  return v_transaction;
end;
$$;

create or replace function public.trova_get_or_create_buyer_profile()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_display_name text;
  v_profile trova_profiles;
  v_buyer trova_buyers;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = 'P0001';
  end if;

  v_email := lower(nullif(trim(auth.jwt()-&gt;&gt;'email'), ''));
  v_display_name := nullif(trim(auth.jwt()-&gt;&gt;'full_name'), '');

  select p.* into v_profile
  from trova_profiles p
  where p.id = v_user_id;

  if v_profile.id is null then
    insert into trova_profiles (id, email, role, display_name, kyc_status)
    values (v_user_id, v_email, 'buyer', coalesce(v_display_name, split_part(v_email, '@', 1)), 'unverified')
    on conflict (id) do update
    set role = 'buyer',
        email = coalesce(excluded.email, trova_profiles.email),
        display_name = coalesce(excluded.display_name, trova_profiles.display_name),
        updated_at = now()
    returning * into v_profile;
  else
    update trova_profiles
    set role = case when role = 'seller' then 'seller' else 'buyer' end,
        email = coalesce(v_email, email),
        display_name = coalesce(v_display_name, display_name),
        updated_at = now()
    where id = v_user_id
    returning * into v_profile;
  end if;

  select b.* into v_buyer
  from trova_buyers b
  where b.profile_id = v_user_id;

  if v_buyer.id is null then
    select b.* into v_buyer
    from trova_buyers b
    where (v_email &lt;&gt; '' and lower(b.email) = v_email)
       or (b.phone is not null and b.phone &lt;&gt; '' and lower(b.phone) = lower(v_email))
    limit 1;

    if v_buyer.id is not null and v_buyer.profile_id &lt;&gt; v_user_id then
      delete from trova_profiles where id = v_buyer.profile_id and id &lt;&gt; v_user_id;
    end if;

    insert into trova_buyers (id, profile_id, display_name, email, phone, metadata)
    values (coalesce(v_buyer.id, gen_random_uuid()), v_user_id, coalesce(v_display_name, v_profile.display_name), coalesce(v_email, v_profile.email), v_profile.phone, coalesce(v_buyer.metadata, '{}'::jsonb))
    on conflict (id) do update
    set profile_id = excluded.profile_id,
        display_name = coalesce(excluded.display_name, trova_buyers.display_name),
        email = coalesce(excluded.email, trova_buyers.email),
        phone = coalesce(excluded.phone, trova_buyers.phone),
        metadata = coalesce(excluded.metadata, trova_buyers.metadata),
        updated_at = now()
    returning * into v_buyer;
  else
    update trova_buyers
    set display_name = coalesce(v_display_name, display_name),
        email = coalesce(v_email, email),
        phone = coalesce(v_profile.phone, phone),
        metadata = coalesce(metadata, '{}'::jsonb),
        updated_at = now()
    where id = v_buyer.id
    returning * into v_buyer;
  end if;

  return jsonb_build_object(
    'profile', jsonb_build_object(
      'id', v_profile.id,
      'email', v_profile.email,
      'role', v_profile.role,
      'displayName', v_profile.display_name,
      'phone', v_profile.phone,
      'kycStatus', v_profile.kyc_status
    ),
    'buyer', jsonb_build_object(
      'id', v_buyer.id,
      'profileId', v_buyer.profile_id,
      'displayName', v_buyer.display_name,
      'email', v_buyer.email,
      'phone', v_buyer.phone,
      'metadata', v_buyer.metadata
    )
  );
end;
$$;

create or replace function public.trova_claim_buyer_transaction(
  p_transaction_id text,
  p_email text,
  p_phone text,
  p_full_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile_id uuid;
  v_buyer_id uuid;
  v_email text;
  v_phone text;
  v_display_name text;
  v_existing_profile uuid;
  v_existing_buyer uuid;
  v_transaction trova_transactions;
begin
  v_email := lower(nullif(trim(p_email), ''));
  v_phone := nullif(trim(p_phone), '');
  v_display_name := nullif(trim(coalesce(p_full_name, '')), '');

  if v_email is null and v_phone is null then
    raise exception 'Buyer email or phone number is required' using errcode = 'P0001';
  end if;

  if v_user_id is not null then
    v_profile_id := v_user_id;

    select p.id into v_existing_profile
    from trova_profiles p
    where p.id = v_user_id;

    if v_existing_profile is null then
      insert into trova_profiles (id, email, role, display_name, kyc_status)
      values (v_user_id, v_email, 'buyer', coalesce(v_display_name, split_part(coalesce(v_email, v_user_id::text), '@', 1)), 'unverified')
      returning id into v_profile_id;
    else
      update trova_profiles
      set email = coalesce(v_email, email),
          display_name = coalesce(v_display_name, display_name),
          updated_at = now()
      where id = v_user_id;
    end if;

    select b.id into v_existing_buyer
    from trova_buyers b
    where b.profile_id = v_user_id;

    if v_existing_buyer is null then
      insert into trova_buyers (id, profile_id, display_name, email, phone, metadata)
      values (gen_random_uuid(), v_user_id, v_display_name, v_email, v_phone, '{}'::jsonb)
      returning id into v_existing_buyer;
    else
      update trova_buyers
      set display_name = coalesce(v_display_name, display_name),
          email = coalesce(v_email, email),
          phone = coalesce(v_phone, phone),
          metadata = coalesce(metadata, '{}'::jsonb),
          updated_at = now()
      where id = v_existing_buyer;
    end if;

    v_buyer_id := v_existing_buyer;
  else
    select b.id, b.profile_id
    into v_existing_buyer, v_existing_profile
    from trova_buyers b
    where (v_email is not null and b.email is not null and lower(b.email) = v_email)
       or (v_phone is not null and b.phone is not null and regexp_replace(b.phone, '\D', '', 'g') = regexp_replace(v_phone, '\D', '', 'g'))
    order by b.created_at desc
    limit 1;

    if v_existing_buyer is null and v_email is not null then
      select p.id into v_existing_profile
      from trova_profiles p
      where lower(p.email) = v_email
      limit 1;
    end if;

    if v_existing_profile is null then
      v_existing_profile := gen_random_uuid();
      insert into trova_profiles (id, email, role, display_name, phone, kyc_status)
      values (v_existing_profile, v_email, 'buyer', v_display_name, v_phone, 'unverified');
    else
      update trova_profiles
      set display_name = coalesce(v_display_name, display_name),
          email = coalesce(v_email, email),
          phone = coalesce(v_phone, phone),
          updated_at = now()
      where id = v_existing_profile;
    end if;

    if v_existing_buyer is null then
      insert into trova_buyers (id, profile_id, display_name, email, phone, metadata)
      values (gen_random_uuid(), v_existing_profile, v_display_name, v_email, v_phone, '{}'::jsonb)
      returning id into v_existing_buyer;
    else
      update trova_buyers
      set profile_id = v_existing_profile,
          display_name = coalesce(v_display_name, display_name),
          email = coalesce(v_email, email),
          phone = coalesce(v_phone, phone),
          metadata = coalesce(metadata, '{}'::jsonb),
          updated_at = now()
      where id = v_existing_buyer;
    end if;

    v_profile_id := v_existing_profile;
    v_buyer_id := v_existing_buyer;
  end if;

  update trova_transactions
  set buyer_id = v_buyer_id,
      buyer_email = coalesce(v_email, buyer_email),
      buyer_phone = coalesce(v_phone, buyer_phone),
      metadata = jsonb_set(
        coalesce(metadata, '{}'::jsonb),
        '{buyerClaimedAt}',
        to_jsonb(now()),
        true
      ),
      updated_at = now()
  where id = p_transaction_id
  returning * into v_transaction;

  if v_transaction.id is null then
    raise exception 'Transaction not found' using errcode = 'P0002';
  end if;

  insert into trova_notifications (profile_id, text_payload, read)
  values (
    v_profile_id,
    format('You claimed escrow order %s for "%s".', v_transaction.id, v_transaction.product_name),
    false
  )
  on conflict do nothing;

  return jsonb_build_object(
    'transaction', jsonb_build_object(
      'id', v_transaction.id,
      'sellerId', v_transaction.seller_id,
      'buyerId', v_transaction.buyer_id,
      'buyerEmail', v_transaction.buyer_email,
      'buyerPhone', v_transaction.buyer_phone,
      'productName', v_transaction.product_name,
      'amount', v_transaction.amount,
      'shippingFee', v_transaction.shipping_fee,
      'currencyCode', v_transaction.currency_code,
      'currencySymbol', v_transaction.currency_symbol,
      'status', v_transaction.status,
      'description', v_transaction.description,
      'transactionType', v_transaction.transaction_type,
      'createdAt', v_transaction.created_at,
      'updatedAt', v_transaction.updated_at,
      'expiresAt', v_transaction.expires_at,
      'claimedByBuyer', v_transaction.buyer_id is not null
    ),
    'buyer', jsonb_build_object(
      'id', v_buyer_id,
      'profileId', v_profile_id,
      'displayName', v_display_name,
      'email', v_email,
      'phone', v_phone
    )
  );
end;
$$;

create or replace function public.trova_get_buyer_transactions()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_buyer_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = 'P0001';
  end if;

  select b.id into v_buyer_id
  from trova_buyers b
  where b.profile_id = v_user_id;

  if v_buyer_id is null then
    select b.id into v_buyer_id
    from trova_buyers b
    left join trova_profiles p on p.id = b.profile_id
    where lower(p.email) = lower(auth.jwt()-&gt;&gt;'email')
       or (b.email is not null and lower(b.email) = lower(auth.jwt()-&gt;&gt;'email'))
    order by b.created_at desc
    limit 1;
  end if;

  if v_buyer_id is null then
    return '[]'::jsonb;
  end if;

  return coalesce(jsonb_agg(
    jsonb_build_object(
      'id', t.id,
      'sellerName', s.business_name,
      'buyerId', t.buyer_id,
      'buyerName', coalesce(bp.display_name, b.display_name),
      'buyerEmail', t.buyer_email,
      'buyerPhone', t.buyer_phone,
      'productName', t.product_name,
      'amount', t.amount,
      'shippingFee', t.shipping_fee,
      'currencyCode', t.currency_code,
      'currencySymbol', t.currency_symbol,
      'status', t.status,
      'description', t.description,
      'transactionType', t.transaction_type,
      'createdAt', t.created_at,
      'updatedAt', t.updated_at,
      'expiresAt', t.expires_at,
      'claimedByBuyer', t.buyer_id is not null
    )
    order by t.created_at desc
  ), '[]'::jsonb)
  from trova_transactions t
  left join trova_sellers s on s.id = t.seller_id
  left join trova_buyers b on b.id = t.buyer_id
  left join trova_profiles bp on bp.id = b.profile_id
  where t.buyer_id = v_buyer_id
     or (t.buyer_email is not null and lower(t.buyer_email) = lower(auth.jwt()-&gt;&gt;'email'))
     or (t.buyer_phone is not null and regexp_replace(t.buyer_phone, '\D', '', 'g') = regexp_replace(coalesce(b.phone, ''), '\D', '', 'g'));
end;
$$;

revoke all on function public.trova_create_transaction(jsonb) from public;
revoke all on function public.trova_get_public_transaction(text) from public;
revoke all on function public.trova_get_or_create_buyer_profile() from public;
revoke all on function public.trova_claim_buyer_transaction(text, text, text, text) from public;
revoke all on function public.trova_get_buyer_transactions() from public;

grant execute on function public.trova_create_transaction(jsonb) to authenticated;
grant execute on function public.trova_get_public_transaction(text) to public;
grant execute on function public.trova_get_or_create_buyer_profile() to authenticated;
grant execute on function public.trova_claim_buyer_transaction(text, text, text, text) to public;
grant execute on function public.trova_get_buyer_transactions() to authenticated;

notify pgrst, 'reload schema';

-- 010_preserve_seller_role_in_buyer_profile.sql
-- Prevents buyer console profile creation from converting seller accounts into buyer-only accounts.
create or replace function public.trova_get_or_create_buyer_profile()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_display_name text;
  v_profile trova_profiles;
  v_buyer trova_buyers;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = 'P0001';
  end if;

  v_email := lower(nullif(trim(auth.jwt()-&gt;&gt;'email'), ''));
  v_display_name := nullif(trim(auth.jwt()-&gt;&gt;'full_name'), '');

  select p.* into v_profile
  from trova_profiles p
  where p.id = v_user_id;

  if v_profile.id is null then
    insert into trova_profiles (id, email, role, display_name, kyc_status)
    values (v_user_id, v_email, 'buyer', coalesce(v_display_name, split_part(v_email, '@', 1)), 'unverified')
    on conflict (id) do update
    set role = case when role = 'seller' then 'seller' else 'buyer' end,
        email = coalesce(excluded.email, trova_profiles.email),
        display_name = coalesce(excluded.display_name, trova_profiles.display_name),
        updated_at = now()
    returning * into v_profile;
  else
    update trova_profiles
    set role = case when role = 'seller' then 'seller' else 'buyer' end,
        email = coalesce(v_email, email),
        display_name = coalesce(v_display_name, display_name),
        updated_at = now()
    where id = v_user_id
    returning * into v_profile;
  end if;

  select b.* into v_buyer
  from trova_buyers b
  where b.profile_id = v_user_id;

  if v_buyer.id is null then
    select b.* into v_buyer
    from trova_buyers b
    where (v_email &lt;&gt; '' and lower(b.email) = v_email)
       or (b.phone is not null and b.phone &lt;&gt; '' and lower(b.phone) = lower(v_email))
    limit 1;

    if v_buyer.id is not null and v_buyer.profile_id &lt;&gt; v_user_id then
      delete from trova_profiles where id = v_buyer.profile_id and id &lt;&gt; v_user_id;
    end if;

    insert into trova_buyers (id, profile_id, display_name, email, phone, metadata)
    values (coalesce(v_buyer.id, gen_random_uuid()), v_user_id, coalesce(v_display_name, v_profile.display_name), coalesce(v_email, v_profile.email), v_profile.phone, coalesce(v_buyer.metadata, '{}'::jsonb))
    on conflict (id) do update
    set profile_id = excluded.profile_id,
        display_name = coalesce(excluded.display_name, trova_buyers.display_name),
        email = coalesce(excluded.email, trova_buyers.email),
        phone = coalesce(excluded.phone, trova_buyers.phone),
        metadata = coalesce(excluded.metadata, trova_buyers.metadata),
        updated_at = now()
    returning * into v_buyer;
  else
    update trova_buyers
    set display_name = coalesce(v_display_name, display_name),
        email = coalesce(v_email, email),
        phone = coalesce(v_profile.phone, phone),
        metadata = coalesce(metadata, '{}'::jsonb),
        updated_at = now()
    where id = v_buyer.id
    returning * into v_buyer;
  end if;

  return jsonb_build_object(
    'profile', jsonb_build_object(
      'id', v_profile.id,
      'email', v_profile.email,
      'role', v_profile.role,
      'displayName', v_profile.display_name,
      'phone', v_profile.phone,
      'kycStatus', v_profile.kyc_status
    ),
    'buyer', jsonb_build_object(
      'id', v_buyer.id,
      'profileId', v_buyer.profile_id,
      'displayName', v_buyer.display_name,
      'email', v_buyer.email,
      'phone', v_buyer.phone,
      'metadata', v_buyer.metadata
    )
  );
end;
$$;

revoke all on function public.trova_get_or_create_buyer_profile() from public;
grant execute on function public.trova_get_or_create_buyer_profile() to authenticated;

notify pgrst, 'reload schema';

-- 011_v1_buyer_contact_fields.sql
-- V1 buyer flow stores buyer contact details directly on the transaction record.
-- No buyer account, login, or registration is required to complete checkout or tracking.
alter table trova_transactions
  add column if not exists buyer_name text;

create index if not exists idx_trova_transactions_buyer_contact
  on trova_transactions (buyer_name, buyer_email, buyer_phone);

create or replace function public.trova_claim_buyer_transaction(
  p_transaction_id text,
  p_email text,
  p_phone text,
  p_full_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_transaction_id text;
  v_buyer_name text;
  v_buyer_email text;
  v_buyer_phone text;
  v_transaction trova_transactions;
begin
  v_transaction_id := nullif(trim(p_transaction_id), '');
  v_buyer_name := nullif(trim(p_full_name), '');
  v_buyer_email := lower(nullif(trim(p_email), ''));
  v_buyer_phone := nullif(trim(p_phone), '');

  if v_transaction_id is null then
    raise exception 'Transaction reference is required' using errcode = 'P0001';
  end if;

  if v_buyer_name is null then
    raise exception 'Buyer full name is required' using errcode = 'P0002';
  end if;

  if v_buyer_email is null then
    raise exception 'Buyer email address is required' using errcode = 'P0003';
  end if;

  if v_buyer_phone is null then
    raise exception 'Buyer phone number is required' using errcode = 'P0004';
  end if;

  update trova_transactions
  set buyer_name = v_buyer_name,
      buyer_email = v_buyer_email,
      buyer_phone = v_buyer_phone,
      metadata = jsonb_set(
        coalesce(metadata, '{}'::jsonb),
        '{buyerClaimedAt}',
        to_jsonb(now()),
        true
      ),
      updated_at = now()
  where id = v_transaction_id
  returning * into v_transaction;

  if v_transaction.id is null then
    raise exception 'Transaction not found' using errcode = 'P0005';
  end if;

  return jsonb_build_object(
    'transaction', jsonb_build_object(
      'id', v_transaction.id,
      'sellerId', v_transaction.seller_id,
      'buyerId', v_transaction.buyer_id,
      'buyerName', v_transaction.buyer_name,
      'buyerEmail', v_transaction.buyer_email,
      'buyerPhone', v_transaction.buyer_phone,
      'productName', v_transaction.product_name,
      'amount', v_transaction.amount,
      'shippingFee', v_transaction.shipping_fee,
      'currencyCode', v_transaction.currency_code,
      'currencySymbol', v_transaction.currency_symbol,
      'status', v_transaction.status,
      'description', v_transaction.description,
      'transactionType', v_transaction.transaction_type,
      'createdAt', v_transaction.created_at,
      'updatedAt', v_transaction.updated_at,
      'expiresAt', v_transaction.expires_at,
      'claimedByBuyer', v_transaction.buyer_name is not null
        or v_transaction.buyer_email is not null
        or v_transaction.buyer_phone is not null
    ),
    'buyer', jsonb_build_object(
      'displayName', v_transaction.buyer_name,
      'email', v_transaction.buyer_email,
      'phone', v_transaction.buyer_phone
    )
  );
end;
$$;

create or replace function public.trova_get_public_transaction(p_transaction_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_transaction jsonb;
begin
  select jsonb_build_object(
    'id', t.id,
    'sellerName', s.business_name,
    'buyerId', t.buyer_id,
    'buyerName', t.buyer_name,
    'buyerEmail', t.buyer_email,
    'buyerPhone', t.buyer_phone,
    'productName', t.product_name,
    'amount', t.amount,
    'shippingFee', t.shipping_fee,
    'currencyCode', t.currency_code,
    'currencySymbol', t.currency_symbol,
    'status', t.status,
    'description', t.description,
    'transactionType', t.transaction_type,
    'createdAt', t.created_at,
    'updatedAt', t.updated_at,
    'expiresAt', t.expires_at,
    'claimedByBuyer', t.buyer_name is not null
      or t.buyer_email is not null
      or t.buyer_phone is not null
  )
  into v_transaction
  from trova_transactions t
  left join trova_sellers s on s.id = t.seller_id
  where t.id = p_transaction_id;

  if v_transaction is null then
    raise exception 'Transaction not found' using errcode = 'P0002';
  end if;

  return v_transaction;
end;
$$;

revoke all on function public.trova_claim_buyer_transaction(text, text, text, text) from public;
revoke all on function public.trova_get_public_transaction(text) from public;

grant execute on function public.trova_claim_buyer_transaction(text, text, text, text) to public;
grant execute on function public.trova_get_public_transaction(text) to public;

notify pgrst, 'reload schema';

-- 012_add_missing_rpc_functions.sql
-- Adds all missing RPC functions that frontend is calling
create or replace function public.trova_get_or_create_buyer_profile()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_display_name text;
  v_profile trova_profiles;
  v_buyer trova_buyers;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = 'P0001';
  end if;

  v_email := lower(nullif(trim(auth.jwt()-&gt;&gt;'email'), ''));
  v_display_name := nullif(trim(auth.jwt()-&gt;&gt;'full_name'), '');

  select p.* into v_profile
  from trova_profiles p
  where p.id = v_user_id;

  if v_profile.id is null then
    insert into trova_profiles (id, email, role, display_name, kyc_status)
    values (v_user_id, v_email, 'buyer', coalesce(v_display_name, split_part(v_email, '@', 1)), 'unverified')
    on conflict (id) do update
    set role = case when role = 'seller' then 'seller' else 'buyer' end,
        email = coalesce(excluded.email, trova_profiles.email),
        display_name = coalesce(excluded.display_name, trova_profiles.display_name),
        updated_at = now()
    returning * into v_profile;
  else
    update trova_profiles
    set role = case when role = 'seller' then 'seller' else 'buyer' end,
        email = coalesce(v_email, email),
        display_name = coalesce(v_display_name, display_name),
        updated_at = now()
    where id = v_user_id
    returning * into v_profile;
  end if;

  select b.* into v_buyer
  from trova_buyers b
  where b.profile_id = v_user_id;

  if v_buyer.id is null then
    select b.* into v_buyer
    from trova_buyers b
    where (v_email &lt;&gt; '' and lower(b.email) = v_email)
       or (b.phone is not null and b.phone &lt;&gt; '' and lower(b.phone) = lower(v_email))
    limit 1;

    if v_buyer.id is not null and v_buyer.profile_id &lt;&gt; v_user_id then
      delete from trova_profiles where id = v_buyer.profile_id and id &lt;&gt; v_user_id;
    end if;

    insert into trova_buyers (id, profile_id, display_name, email, phone, metadata)
    values (coalesce(v_buyer.id, gen_random_uuid()), v_user_id, coalesce(v_display_name, v_profile.display_name), coalesce(v_email, v_profile.email), v_profile.phone, coalesce(v_buyer.metadata, '{}'::jsonb))
    on conflict (id) do update
    set profile_id = excluded.profile_id,
        display_name = coalesce(excluded.display_name, trova_buyers.display_name),
        email = coalesce(excluded.email, trova_buyers.email),
        phone = coalesce(excluded.phone, trova_buyers.phone),
        metadata = coalesce(excluded.metadata, trova_buyers.metadata),
        updated_at = now()
    returning * into v_buyer;
  else
    update trova_buyers
    set display_name = coalesce(v_display_name, display_name),
        email = coalesce(v_email, email),
        phone = coalesce(v_profile.phone, phone),
        metadata = coalesce(metadata, '{}'::jsonb),
        updated_at = now()
    where id = v_buyer.id
    returning * into v_buyer;
  end if;

  return jsonb_build_object(
    'profile', jsonb_build_object(
      'id', v_profile.id,
      'email', v_profile.email,
      'role', v_profile.role,
      'displayName', v_profile.display_name,
      'phone', v_profile.phone,
      'kycStatus', v_profile.kyc_status
    ),
    'buyer', jsonb_build_object(
      'id', v_buyer.id,
      'profileId', v_buyer.profile_id,
      'displayName', v_buyer.display_name,
      'email', v_buyer.email,
      'phone', v_buyer.phone,
      'metadata', v_buyer.metadata
    )
  );
end;
$$;

create or replace function public.trova_create_transaction(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid := auth.uid();
  v_profile_role text;
  v_kyc_status text;
  v_seller_id uuid;
  v_seller_status text;
  v_amount numeric;
  v_shipping_fee numeric;
  v_currency_code text;
  v_currency_symbol text;
  v_transaction_type text;
  v_description text;
  v_buyer_phone text;
  v_buyer_email text;
  v_product_name text;
  v_amount_naira numeric;
  v_exchange_rate numeric;
  v_single_cap numeric;
  v_unverified_single_limit numeric;
  v_unverified_compliance_limit numeric;
  v_generated_id text;
  v_attempts int := 0;
  v_transaction trova_transactions;
begin
  if v_profile_id is null then
    raise exception 'Authentication required' using errcode = 'P0001';
  end if;

  select p.role, p.kyc_status
  into v_profile_role, v_kyc_status
  from trova_profiles p
  where p.id = v_profile_id;

  if v_profile_role is null then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  if v_profile_role &lt;&gt; 'seller' then
    raise exception 'Only seller accounts can create escrow links' using errcode = 'P0003';
  end if;

  select s.id, s.status
  into v_seller_id, v_seller_status
  from trova_sellers s
  where s.profile_id = v_profile_id;

  if v_seller_id is null then
    raise exception 'Seller profile not found' using errcode = 'P0004';
  end if;

  if v_seller_status = 'suspended' then
    raise exception 'Seller account is suspended' using errcode = 'P0005';
  end if;

  v_product_name := nullif(trim(coalesce(payload-&gt;&gt;'productName', payload-&gt;&gt;'product_name')), '');
  v_buyer_phone := nullif(trim(coalesce(payload-&gt;&gt;'buyerPhone', payload-&gt;&gt;'buyer_phone')), '');
  v_buyer_email := nullif(trim(coalesce(payload-&gt;&gt;'buyerEmail', payload-&gt;&gt;'buyer_email')), '');
  v_description := trim(coalesce(payload-&gt;&gt;'description', ''));
  v_amount := coalesce(nullif(regexp_replace(payload-&gt;&gt;'amount', '[^0-9.\-]', '', 'g'), '')::numeric, 0);
  v_shipping_fee := coalesce(nullif(regexp_replace(payload-&gt;&gt;'shippingFee', '[^0-9.\-]', '', 'g'), '')::numeric, 0);
  v_currency_code := upper(coalesce(payload-&gt;&gt;'currencyCode', payload-&gt;&gt;'currency_code', 'NGN'));
  v_transaction_type := lower(coalesce(payload-&gt;&gt;'transactionType', payload-&gt;&gt;'transaction_type', 'physical'));
  v_currency_symbol := case when v_currency_code = 'USD' then '$' else '₦' end;
  v_exchange_rate := coalesce(((select value-&gt;&gt;'USD_NGN' from trova_system_settings where key = 'currency_exchange_rates')::numeric), 1500);
  v_amount_naira := case when v_currency_code = 'USD' then v_amount * v_exchange_rate else v_amount end;

  select
    coalesce((value-&gt;&gt;'singleTransactionCapNgn')::numeric, 5000000),
    coalesce((value-&gt;&gt;'unverifiedSingleTransactionLimitNgn')::numeric, 50000),
    coalesce((value-&gt;&gt;'unverifiedComplianceDeclineLimitNgn')::numeric, 1000000)
  into v_single_cap, v_unverified_single_limit, v_unverified_compliance_limit
  from trova_system_settings
  where key = 'transaction_limits';

  if v_product_name is null then
    raise exception 'Product name is required' using errcode = 'P0006';
  end if;

  if length(v_product_name) &gt; 160 then
    raise exception 'Product name is too long' using errcode = 'P0007';
  end if;

  if v_buyer_phone is null then
    raise exception 'Buyer phone number is required' using errcode = 'P0008';
  end if;

  if v_amount &lt;= 0 then
    raise exception 'Amount must be greater than zero' using errcode = 'P0009';
  end if;

  if v_shipping_fee &lt; 0 then
    raise exception 'Shipping fee cannot be negative' using errcode = 'P0010';
  end if;

  if v_currency_code not in ('NGN', 'USD') then
    raise exception 'Unsupported currency' using errcode = 'P0011';
  end if;

  if v_transaction_type not in ('physical', 'service') then
    raise exception 'Unsupported transaction type' using errcode = 'P0012';
  end if;

  if v_amount_naira &gt; v_single_cap then
    raise exception 'Transaction amount exceeds platform cap' using errcode = 'P0013';
  end if;

  if coalesce(v_kyc_status, 'unverified') &lt;&gt; 'verified' then
    if v_amount_naira &gt; v_unverified_single_limit then
      raise exception 'Unverified sellers can only create escrow links up to the active limit' using errcode = 'P0014';
    end if;

    if v_amount_naira &gt; v_unverified_compliance_limit then
      raise exception 'Transaction requires verified KYC status' using errcode = 'P0015';
    end if;
  end if;

  loop
    v_attempts := v_attempts + 1;
    v_generated_id := 'TL-' || floor(1000 + random() * 9000)::int::text;

    if not exists (select 1 from trova_transactions where id = v_generated_id) then
      exit;
    end if;

    if v_attempts &gt;= 10 then
      raise exception 'Unable to generate unique transaction reference' using errcode = 'P0016';
    end if;
  end loop;

  insert into trova_transactions (
    id,
    seller_id,
    buyer_email,
    buyer_phone,
    product_name,
    amount,
    shipping_fee,
    currency_code,
    currency_symbol,
    status,
    description,
    transaction_type,
    expires_at,
    metadata
  ) values (
    v_generated_id,
    v_seller_id,
    v_buyer_email,
    v_buyer_phone,
    v_product_name,
    v_amount,
    v_shipping_fee,
    v_currency_code,
    v_currency_symbol,
    'pending_deposit',
    v_description,
    v_transaction_type,
    now() + interval '72 hours',
    jsonb_build_object(
      'createdByProfileId', v_profile_id,
      'kycStatusAtCreation', coalesce(v_kyc_status, 'unverified'),
      'amountInNgn', v_amount_naira
    )
  )
  returning * into v_transaction;

  insert into trova_notifications (profile_id, text_payload, read)
  values (
    v_profile_id,
    format('New escrow link created: %s (%s).', v_product_name, v_generated_id),
    false
  );

  return jsonb_build_object(
    'transaction', jsonb_build_object(
      'id', v_transaction.id,
      'sellerId', v_transaction.seller_id,
      'buyerEmail', v_transaction.buyer_email,
      'buyerPhone', v_transaction.buyer_phone,
      'productName', v_transaction.product_name,
      'amount', v_transaction.amount,
      'shippingFee', v_transaction.shipping_fee,
      'currencyCode', v_transaction.currency_code,
      'currencySymbol', v_transaction.currency_symbol,
      'status', v_transaction.status,
      'description', v_transaction.description,
      'transactionType', v_transaction.transaction_type,
      'createdAt', v_transaction.created_at,
      'updatedAt', v_transaction.updated_at,
      'expiresAt', v_transaction.expires_at,
      'claimedByBuyer', v_transaction.buyer_id is not null
    ),
    'paymentUrl', format('/pay/%s', v_generated_id),
    'trackingUrl', format('/track/%s', v_generated_id)
  );
exception
  when others then
    raise exception '%', sqlerrm;
end;
$$;

create or replace function public.trova_get_public_transaction(p_transaction_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_transaction jsonb;
begin
  select jsonb_build_object(
    'id', t.id,
    'sellerName', s.business_name,
    'buyerId', t.buyer_id,
    'buyerName', t.buyer_name,
    'buyerEmail', t.buyer_email,
    'buyerPhone', t.buyer_phone,
    'productName', t.product_name,
    'amount', t.amount,
    'shippingFee', t.shipping_fee,
    'currencyCode', t.currency_code,
    'currencySymbol', t.currency_symbol,
    'status', t.status,
    'description', t.description,
    'transactionType', t.transaction_type,
    'createdAt', t.created_at,
    'updatedAt', t.updated_at,
    'expiresAt', t.expires_at,
    'claimedByBuyer', t.buyer_id is not null
      or t.buyer_name is not null
      or t.buyer_email is not null
      or t.buyer_phone is not null
  )
  into v_transaction
  from trova_transactions t
  left join trova_sellers s on s.id = t.seller_id
  where t.id = p_transaction_id;

  if v_transaction is null then
    raise exception 'Transaction not found' using errcode = 'P0002';
  end if;

  return v_transaction;
end;
$$;

revoke all on function public.trova_get_or_create_buyer_profile() from public;
revoke all on function public.trova_create_transaction(jsonb) from public;
revoke all on function public.trova_get_public_transaction(text) from public;

grant execute on function public.trova_get_or_create_buyer_profile() to authenticated;
grant execute on function public.trova_create_transaction(jsonb) to authenticated;
grant execute on function public.trova_get_public_transaction(text) to public;

-- 019_add_kyc_data_columns.sql
-- Add missing KYC data columns to trova_kyc_applications table to store actual submitted data

alter table trova_kyc_applications
  add column if not exists full_name text,
  add column if not exists phone text,
  add column if not exists id_type text,
  add column if not exists id_number text,
  add column if not exists date_of_birth date,
  add column if not exists business_name text,
  add column if not exists city text,
  add column if not exists state_region text,
  add column if not exists country text,
  add column if not exists street_address text,
  add column if not exists uploaded_id_file_name text,
  add column if not exists uploaded_id_file_url text;

-- 020_add_admin_kyc_review_function.sql
-- Add database function for admins to review and update KYC status

create or replace function public.trova_review_kyc_application(
  p_application_id uuid,
  p_new_status text,
  p_review_comments text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
  v_seller_id uuid;
begin
  -- Check if user is admin
  if not exists (
    select 1 from trova_profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ) then
    raise exception 'Only admins can review KYC applications' using errcode = 'P0001';
  end if;

  -- Get seller and profile IDs from the application
  select k.seller_id, s.profile_id
  into v_seller_id, v_profile_id
  from trova_kyc_applications k
  join trova_sellers s on s.id = k.seller_id
  where k.id = p_application_id;

  if v_seller_id is null then
    raise exception 'KYC application not found' using errcode = 'P0002';
  end if;

  -- Update KYC application
  update trova_kyc_applications
  set
    status = p_new_status,
    reviewed_at = now(),
    review_comments = p_review_comments
  where id = p_application_id;

  -- Update profile KYC status
  update trova_profiles
  set
    kyc_status = p_new_status,
    kyc_approved_at = case when p_new_status = 'verified' then now() else null end,
    kyc_rejection_reason = case when p_new_status = 'rejected' then p_review_comments else null end
  where id = v_profile_id;

  -- Add notification for the seller
  insert into trova_notifications (profile_id, text_payload, read)
  values (
    v_profile_id,
    case
      when p_new_status = 'verified' then 'Your KYC application has been approved!'
      when p_new_status = 'rejected' then format('Your KYC application has been rejected: %s', coalesce(p_review_comments, 'No reason provided'))
      when p_new_status = 'reviewing' then 'Your KYC application is now being reviewed'
      else format('Your KYC application status has been updated to: %s', p_new_status)
    end,
    false
  );

  return jsonb_build_object(
    'success', true,
    'message', 'KYC application updated successfully'
  );
exception
  when others then
    raise exception '%', sqlerrm using errcode = coalesce(sqlstate, 'P0099');
end;
$$;

revoke all on function public.trova_review_kyc_application(uuid, text, text) from public;
grant execute on function public.trova_review_kyc_application(uuid, text, text) to authenticated;

-- 021_add_admin_get_kyc_applications_function.sql
-- Add database function for admins to get all KYC applications

create or replace function public.trova_get_kyc_applications()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_applications jsonb;
begin
  -- Check if user is admin
  if not exists (
    select 1 from trova_profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ) then
    raise exception 'Only admins can view KYC applications' using errcode = 'P0001';
  end if;

  -- Get all KYC applications with seller and profile details
  select jsonb_agg(jsonb_build_object(
    'id', k.id,
    'seller_id', k.seller_id,
    'full_name', k.full_name,
    'phone', k.phone,
    'id_type', k.id_type,
    'id_number', k.id_number,
    'date_of_birth', k.date_of_birth,
    'business_name', k.business_name,
    'city', k.city,
    'state_region', k.state_region,
    'country', k.country,
    'street_address', k.street_address,
    'uploaded_id_file_name', k.uploaded_id_file_name,
    'uploaded_id_file_url', k.uploaded_id_file_url,
    'status', k.status,
    'submitted_at', k.submitted_at,
    'reviewed_at', k.reviewed_at,
    'review_comments', k.review_comments,
    'seller', jsonb_build_object(
      'business_name', s.business_name,
      'profile_id', s.profile_id
    ),
    'profile', jsonb_build_object(
      'email', p.email,
      'display_name', p.display_name
    )
  ))
  into v_applications
  from trova_kyc_applications k
  join trova_sellers s on s.id = k.seller_id
  join trova_profiles p on p.id = s.profile_id
  order by k.submitted_at desc;

  return jsonb_build_object(
    'success', true,
    'applications', coalesce(v_applications, '[]'::jsonb)
  );
exception
  when others then
    raise exception '%', sqlerrm using errcode = coalesce(sqlstate, 'P0099');
end;
$$;

revoke all on function public.trova_get_kyc_applications() from public;
grant execute on function public.trova_get_kyc_applications() to authenticated;

-- 022_add_kyc_tracking_to_profiles.sql
-- Add KYC tracking columns to trova_profiles

alter table trova_profiles
  add column if not exists kyc_submitted_at timestamptz,
  add column if not exists kyc_approved_at timestamptz,
  add column if not exists kyc_rejection_reason text;

alter database postgres set app.site_url to 'https://trova.co';

-- 042_auto_expire_pending_links.sql
-- Automatically expire pending_deposit links after 72 hours
-- Uses pg_cron for scheduled execution (every 5 minutes)

create or replace function public.expire_pending_deposit_links()
returns void
language plpgsql
security definer
as $$
begin
  update public.trova_transactions
  set 
    status = 'expired',
    updated_at = now()
  where 
    status = 'pending_deposit'
    and expires_at < now();
end;
$$;

-- Schedule the cron job if pg_cron is available
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    select cron.schedule(
      'expire-pending-deposit-links',
      '*/5 * * * *',
      'select public.expire_pending_deposit_links();'
    );
  end if;
end;
$$;

revoke all on function public.expire_pending_deposit_links() from public;
grant execute on function public.expire_pending_deposit_links() to service_role;

-- 043_buyer_access_control.sql
-- Adds buyer verification for public tracking/checkout pages
-- Only allows access to pending_deposit links if buyer phone matches

-- Minimal RPC: returns just enough info to decide if verification is needed
create or replace function public.trova_get_transaction_access_info(p_transaction_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'status', t.status,
    'has_buyer_phone', (t.buyer_phone is not null and trim(t.buyer_phone) <> ''),
    'buyer_phone_last4',
      case 
        when t.buyer_phone is not null and length(regexp_replace(t.buyer_phone, '\D', '', 'g')) >= 4
        then right(regexp_replace(t.buyer_phone, '\D', '', 'g'), 4)
        else null
      end,
    'product_name', t.product_name,
    'currency_symbol', t.currency_symbol,
    'vendor_name', t.vendor_name
  ) into v_result
  from public.trova_transactions t
  where t.id = p_transaction_id;

  if v_result is null then
    return jsonb_build_object('status', 'not_found');
  end if;

  return v_result;
end;
$$;

-- Verification RPC: checks if entered phone matches buyer_phone
create or replace function public.trova_verify_buyer_access(p_transaction_id text, p_phone text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_stored_phone text;
  v_status text;
  v_normalized_stored text;
  v_normalized_entered text;
begin
  -- Get stored phone and status
  select buyer_phone, status into v_stored_phone, v_status
  from public.trova_transactions
  where id = p_transaction_id;

  if v_stored_phone is null or trim(v_stored_phone) = '' then
    return jsonb_build_object('match', true, 'reason', 'no_buyer_phone_set');
  end if;

  -- Normalize both phones: remove all non-digit characters
  v_normalized_stored := regexp_replace(v_stored_phone, '\D', '', 'g');
  v_normalized_entered := regexp_replace(p_phone, '\D', '', 'g');

  -- Compare last 10 digits (handles country code differences)
  if length(v_normalized_stored) >= 10 and length(v_normalized_entered) >= 10 then
    if right(v_normalized_stored, 10) = right(v_normalized_entered, 10) then
      return jsonb_build_object('match', true, 'reason', 'phone_matched');
    end if;
  end if;

  -- Fallback: exact normalized match
  if v_normalized_stored = v_normalized_entered then
    return jsonb_build_object('match', true, 'reason', 'phone_matched');
  end if;

  return jsonb_build_object('match', false, 'reason', 'phone_mismatch');
end;
$$;

revoke all on function public.trova_get_transaction_access_info(text) from public;
grant execute on function public.trova_get_transaction_access_info(text) to public;

revoke all on function public.trova_verify_buyer_access(text, text) from public;
grant execute on function public.trova_verify_buyer_access(text, text) to public;


