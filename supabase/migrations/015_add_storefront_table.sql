-- 015_add_storefront_table.sql
-- Add storefronts table to Trova schema

-- Storefronts table
create table if not exists trova_storefronts (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references trova_sellers(id) on delete cascade,
  handle text unique,
  business_name text,
  tagline text,
  profile_image_url text,
  links jsonb default '[]'::jsonb,
  items jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Idempotent cleanup for policies
drop policy if exists storefronts_select_owner on trova_storefronts;
drop policy if exists storefronts_insert_owner on trova_storefronts;
drop policy if exists storefronts_update_owner on trova_storefronts;
drop policy if exists storefronts_select_public on trova_storefronts;

-- Enable RLS
alter table trova_storefronts enable row level security;

-- Create policies
create policy storefronts_select_owner on trova_storefronts for select using (
  seller_id = (select id from trova_sellers where profile_id = auth.uid())
);

create policy storefronts_insert_owner on trova_storefronts for insert with check (
  seller_id = (select id from trova_sellers where profile_id = auth.uid())
);

create policy storefronts_update_owner on trova_storefronts for update using (
  seller_id = (select id from trova_sellers where profile_id = auth.uid())
) with check (
  seller_id = (select id from trova_sellers where profile_id = auth.uid())
);

create policy storefronts_select_public on trova_storefronts for select using (true);
