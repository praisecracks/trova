-- 038_create_dispute_messages.sql
-- Create dispute_messages table for real-time tri-party arbitration chat
-- during active disputes on escrow transactions.

create table if not exists public.dispute_messages (
  id uuid primary key default gen_random_uuid(),
  transaction_id text not null references public.trova_transactions(id) on delete cascade,
  sender_role text not null check (sender_role in ('buyer', 'seller', 'admin')),
  message_text text not null,
  attachment_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_dispute_messages_transaction_id
  on public.dispute_messages(transaction_id);

create index if not exists idx_dispute_messages_created_at
  on public.dispute_messages(created_at desc);

alter table public.dispute_messages enable row level security;

drop policy if exists "Allow public dispute message insert" on public.dispute_messages;
create policy "Allow public dispute message insert"
  on public.dispute_messages for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Allow public dispute message read" on public.dispute_messages;
create policy "Allow public dispute message read"
  on public.dispute_messages for select
  to anon, authenticated
  using (true);

notify pgrst, 'reload schema';
