-- 027_add_account_bank_columns.sql
-- Add flat bank columns to trova_profiles for account-level payout routing
-- These mirror the flat columns already on trova_storefronts (migration 023)

alter table if exists trova_profiles
  add column if not exists bank_name text,
  add column if not exists account_number text,
  add column if not exists account_name text,
  add column if not exists account_type text,
  add column if not exists currency text default 'USD';
