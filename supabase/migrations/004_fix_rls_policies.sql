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
