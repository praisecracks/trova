-- 048_enable_realtime_for_transactions.sql
-- Enables PostgreSQL logical replication and adds trova_transactions
-- to the Supabase realtime publication so that postgres_changes
-- subscriptions fire for INSERT, UPDATE, DELETE events.

alter table trova_transactions replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication p
    join pg_publication_tables pt on pt.pubname = p.pubname
    where p.pubname = 'supabase_realtime' and pt.tablename = 'trova_transactions'
  ) then
    alter publication supabase_realtime add table trova_transactions;
  end if;
end;
$$;
