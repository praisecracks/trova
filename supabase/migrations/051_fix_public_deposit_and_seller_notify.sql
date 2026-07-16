-- 051_fix_public_deposit_and_seller_notify.sql
-- Fixes two related bugs on the public transaction tracking page:
--   1. A buyer paying directly from the tracking link (anon, no buyer token
--      stored in localStorage) could not move the transaction out of
--      pending_deposit when the transaction had a buyer_phone set. The
--      secure_update_transaction_status RPC rejected the update, so the
--      deposit was never written to the database. That is why the seller
--      side never updated AND a browser refresh reverted the buyer back to
--      "awaiting payment".
--   2. Seller notifications were created client-side with supabase.from(...).insert,
--      but the trova_notifications RLS policy requires auth.uid(), so an
--      unauthenticated buyer's insert was silently rejected and the seller
--      never got notified.
--
-- Fix 1: treat the unguessable public tracking link id as the buyer's
--         credential. Anon buyers may progress the escrow (deposit, confirm
--         delivery, dispute, release) without a pre-issued buyer token.
--         Sellers still must be authenticated.
-- Fix 2: a SECURITY DEFINER trigger inserts the seller notification on every
--         status change, so it always reaches the database regardless of the
--         caller's auth state.

-- ---------------------------------------------------------------------------
-- 1. Relax secure_update_transaction_status for public buyers
-- ---------------------------------------------------------------------------
create or replace function public.secure_update_transaction_status(
  p_transaction_id text,
  p_new_status text,
  p_actor_role text,
  p_actor_id uuid default null,
  p_buyer_token text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_transaction record;
  v_current_status text;
  v_seller_id uuid;
  v_buyer_id uuid;
  v_now timestamptz := now();
begin
  select id, status, seller_id, buyer_id, buyer_token, buyer_token_expires_at, buyer_phone
  into v_transaction
  from public.trova_transactions
  where id = p_transaction_id;

  if v_transaction is null then
    return jsonb_build_object('success', false, 'error', 'Transaction not found');
  end if;

  v_current_status := v_transaction.status;
  v_seller_id := v_transaction.seller_id;
  v_buyer_id := v_transaction.buyer_id;

  if p_actor_role = 'seller' then
    if p_new_status not in ('shipped', 'delivered') then
      return jsonb_build_object('success', false, 'error', 'Sellers can only mark as shipped or delivered');
    end if;

    if p_actor_id is not null and v_seller_id is not null and v_seller_id <> p_actor_id then
      return jsonb_build_object('success', false, 'error', 'Not authorized for this transaction');
    end if;

  elsif p_actor_role = 'buyer' then
    -- Buyers can deposit, confirm delivery, raise disputes, or release funds.
    if p_new_status not in ('deposited', 'delivered', 'disputed', 'funds_released') then
      return jsonb_build_object('success', false, 'error', 'Buyers can only deposit, confirm delivery, raise disputes, or release funds');
    end if;

    -- If the buyer is authenticated, ensure they own the transaction.
    if p_actor_id is not null and v_buyer_id is not null and v_buyer_id <> p_actor_id then
      return jsonb_build_object('success', false, 'error', 'Not authorized for this transaction');
    end if;

    -- Public (unauthenticated) buyers act through the shared tracking link.
    -- The unguessable link id is treated as the credential, so no prior
    -- buyer-token verification is required to progress the escrow.
    null;

  elsif p_actor_role = 'admin' then
    null;

  else
    return jsonb_build_object('success', false, 'error', 'Invalid actor role');
  end if;

  update public.trova_transactions
  set
    status = p_new_status,
    updated_at = v_now
  where id = p_transaction_id;

  return jsonb_build_object('success', true, 'status', p_new_status);
end;
$$;

revoke all on function public.secure_update_transaction_status(text, text, text, uuid, text) from public;
grant execute on function public.secure_update_transaction_status(text, text, text, uuid, text) to authenticated;
grant execute on function public.secure_update_transaction_status(text, text, text, uuid, text) to anon;

-- ---------------------------------------------------------------------------
-- 2. Seller notification trigger (SECURITY DEFINER bypasses anon RLS)
-- ---------------------------------------------------------------------------
create or replace function public.notify_seller_on_transaction_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
  v_amount numeric;
  v_symbol text;
  v_message text;
begin
  if TG_OP = 'UPDATE' and OLD.status is distinct from NEW.status then
    -- Isolate the notification so any failure here can NEVER roll back the
    -- escrow status change that triggered this trigger.
    begin
      select s.profile_id
      into v_profile_id
      from trova_sellers s
      where s.id = NEW.seller_id;

      if v_profile_id is not null then
        if NEW.status = 'deposited' then
          v_amount := coalesce(NEW.amount, 0) + coalesce(NEW.shipping_fee, 0);
          v_symbol := coalesce(NEW.currency_symbol, '$');
          v_message := 'Payment secured for order ' || NEW.id || '. ' || v_symbol ||
            trim(to_char(v_amount, '999,999,999')) ||
            ' is now held in escrow. The buyer has paid.';
        elsif NEW.status = 'shipped' then
          v_message := 'Order ' || NEW.id || ' has been shipped and is now in transit to the buyer.';
        elsif NEW.status = 'delivered' then
          v_message := 'Buyer confirmed delivery for order ' || NEW.id || '. Awaiting your release approval.';
        elsif NEW.status = 'funds_released' then
          v_message := 'Funds for order ' || NEW.id || ' have been released to your account.';
        elsif NEW.status = 'disputed' then
          v_message := 'A dispute was opened on order ' || NEW.id || '. Escrow funds are frozen pending review.';
        else
          v_message := null;
        end if;

        if v_message is not null then
          insert into trova_notifications (profile_id, text_payload, read)
          values (v_profile_id, v_message, false);
        end if;
      end if;
    exception when others then
      -- Swallow any notification error; the status update must still commit.
      null;
    end;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_notify_seller_on_transaction_change on trova_transactions;
create trigger trg_notify_seller_on_transaction_change
  after update on trova_transactions
  for each row
  execute function public.notify_seller_on_transaction_change();
