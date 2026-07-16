-- 018_add_referrals_table.sql
-- Add referrals table to Trova schema

-- Referrals table
create table if not exists trova_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_seller_id uuid not null references trova_sellers(id) on delete cascade,
  referee_email text not null,
  store_name text,
  sign_up_date timestamptz,
  status text not null default 'Pending' check (status in ('Pending', 'Active', 'Cancelled')),
  created_at timestamptz default now()
);

-- Idempotent cleanup for policies
drop policy if exists referrals_select_owner on trova_referrals;
drop policy if exists referrals_insert_owner on trova_referrals;
drop policy if exists referrals_update_owner on trova_referrals;
drop policy if exists referrals_delete_owner on trova_referrals;

-- Enable RLS
alter table trova_referrals enable row level security;

-- Create policies
create policy referrals_select_owner on trova_referrals for select using (
  referrer_seller_id = (select id from trova_sellers where profile_id = auth.uid())
);

create policy referrals_insert_owner on trova_referrals for insert with check (
  referrer_seller_id = (select id from trova_sellers where profile_id = auth.uid())
);

create policy referrals_update_owner on trova_referrals for update using (
  referrer_seller_id = (select id from trova_sellers where profile_id = auth.uid())
) with check (
  referrer_seller_id = (select id from trova_sellers where profile_id = auth.uid())
);

create policy referrals_delete_owner on trova_referrals for delete using (
  referrer_seller_id = (select id from trova_sellers where profile_id = auth.uid())
);
