-- 039_allow_public_rating_inserts.sql
-- Allow anonymous buyers to submit ratings without authentication.
-- The buyer flow is designed to be low-friction: the TL- code IS the auth.
-- Buyers are not required to create an account, so rater_profile_id can be null.

drop policy if exists ratings_insert_public on public.trova_ratings;
create policy ratings_insert_public
  on public.trova_ratings
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists ratings_select_public on public.trova_ratings;
create policy ratings_select_public
  on public.trova_ratings
  for select
  to anon, authenticated
  using (true);

notify pgrst, 'reload schema';
