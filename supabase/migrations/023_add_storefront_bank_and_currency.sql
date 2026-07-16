-- 023_add_storefront_bank_and_currency.sql
-- Add bank details and currency columns to storefronts

alter table if exists trova_storefronts
  add column if not exists bank_name text,
  add column if not exists account_number text,
  add column if not exists account_name text,
  add column if not exists account_type text,
  add column if not exists currency text default 'USD';
