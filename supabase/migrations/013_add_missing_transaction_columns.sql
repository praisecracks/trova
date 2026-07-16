-- 013_add_missing_transaction_columns.sql
-- Adds missing columns to trova_transactions table

alter table trova_transactions
  add column if not exists description text,
  add column if not exists transaction_type text default 'physical'
    check (transaction_type in ('physical', 'service')),
  add column if not exists payment_gateway text,
  add column if not exists escrow_hold_reference text,
  add column if not exists payment_reference text,
  add column if not exists payment_method text,
  add column if not exists payment_status text;

-- Add RLS policy for inserting transactions
drop policy if exists transactions_insert_own on trova_transactions;
create policy transactions_insert_own
on trova_transactions for insert
with check (
  seller_id = (
    select id from trova_sellers where profile_id = auth.uid()
  )
);

notify pgrst, 'reload schema';
