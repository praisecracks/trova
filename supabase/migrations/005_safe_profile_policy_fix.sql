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
