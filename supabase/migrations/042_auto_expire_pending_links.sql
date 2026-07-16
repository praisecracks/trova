-- 042_auto_expire_pending_links.sql
-- Automatically expire pending_deposit links after 72 hours
-- Uses pg_cron for scheduled execution (every 5 minutes)

create or replace function public.expire_pending_deposit_links()
returns void
language plpgsql
security definer
as $$
begin
  update public.trova_transactions
  set 
    status = 'expired',
    updated_at = now()
  where 
    status = 'pending_deposit'
    and expires_at < now();
end;
$$;

-- Schedule the cron job if pg_cron is available
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    select cron.schedule(
      'expire-pending-deposit-links',
      '*/5 * * * *',
      'select public.expire_pending_deposit_links();'
    );
  end if;
end;
$$;

revoke all on function public.expire_pending_deposit_links() from public;
grant execute on function public.expire_pending_deposit_links() to service_role;
