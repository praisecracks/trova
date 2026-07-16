-- 040_add_seller_id_to_ratings.sql
-- Add seller_id to trova_ratings so we can efficiently track and update
-- seller rating averages without joining through transactions every time.

alter table public.trova_ratings
  add column if not exists seller_id uuid references public.trova_sellers(id) on delete cascade;

create index if not exists idx_trova_ratings_seller_id
  on public.trova_ratings(seller_id);

notify pgrst, 'reload schema';
