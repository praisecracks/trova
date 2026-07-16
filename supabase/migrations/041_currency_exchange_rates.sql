-- 041_currency_exchange_rates.sql
-- Currency exchange rate management table for multi-currency support.
-- Stores conversion rates between any two currencies.

create table if not exists public.currency_exchange_rates (
  id uuid primary key default gen_random_uuid(),
  base_currency text not null,
  target_currency text not null,
  rate numeric not null,
  updated_at timestamptz not null default now(),
  unique(base_currency, target_currency)
);

create index if not exists idx_currency_exchange_rates_base
  on public.currency_exchange_rates(base_currency);

create index if not exists idx_currency_exchange_rates_target
  on public.currency_exchange_rates(target_currency);

alter table public.currency_exchange_rates enable row level security;

drop policy if exists "Allow public currency rate read" on public.currency_exchange_rates;
create policy "Allow public currency rate read"
  on public.currency_exchange_rates for select
  to anon, authenticated
  using (true);

drop policy if exists "Allow admin currency rate write" on public.currency_exchange_rates;
create policy "Allow admin currency rate write"
  on public.currency_exchange_rates for all
  to authenticated
  using (
    exists (
      select 1 from public.trova_profiles p
      where p.id = auth.uid()
      and p.role = 'admin'
    )
  );

notify pgrst, 'reload schema';
