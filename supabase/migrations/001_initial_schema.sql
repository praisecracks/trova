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
  score smallint check (score >= 1 and score <= 5),
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

-- Disputes & messages policies
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
