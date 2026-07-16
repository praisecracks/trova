-- Permanent delete of an escrow transaction by its seller.
-- Mirrors trova_create_transaction's security model (security definer + auth
-- checks) so a seller can only delete their own transactions. Admin may delete
-- any. This makes deletion authoritative on the server so re-syncs cannot
-- resurrect a deleted link.

create or replace function public.trova_delete_transaction(p_transaction_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid := auth.uid();
  v_profile_role text;
  v_seller_id uuid;
  v_owner_seller_id uuid;
begin
  if v_profile_id is null then
    return jsonb_build_object('success', false, 'error', 'Authentication required');
  end if;

  select p.role
  into v_profile_role
  from trova_profiles p
  where p.id = v_profile_id;

  if v_profile_role is null then
    return jsonb_build_object('success', false, 'error', 'Profile not found');
  end if;

  select t.seller_id
  into v_owner_seller_id
  from trova_transactions t
  where t.id = p_transaction_id;

  if v_owner_seller_id is null then
    return jsonb_build_object('success', false, 'error', 'Transaction not found');
  end if;

  if v_profile_role = 'admin' then
    -- Admins may delete any transaction.
    null;
  else
    select s.id
    into v_seller_id
    from trova_sellers s
    where s.profile_id = v_profile_id;

    if v_seller_id is null or v_seller_id <> v_owner_seller_id then
      return jsonb_build_object('success', false, 'error', 'Not authorized to delete this transaction');
    end if;
  end if;

  delete from trova_transactions
  where id = p_transaction_id;

  return jsonb_build_object('success', true);
end;
$$;

revoke all on function public.trova_delete_transaction(text) from public;
grant execute on function public.trova_delete_transaction(text) to authenticated;

-- Allow the transaction owner (or admin) to delete their own rows directly.
drop policy if exists transactions_delete_owner on trova_transactions;
create policy transactions_delete_owner on trova_transactions for delete using (
  seller_id = (select id from trova_sellers where profile_id = auth.uid())
  or exists (select 1 from trova_profiles p where p.id = auth.uid() and p.role = 'admin')
);
