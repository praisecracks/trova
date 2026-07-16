-- 046_secure_transaction_status_updates.sql
-- Adds buyer token system and secure RPC for status updates
-- Enforces role-based access at the database level

-- Add buyer token columns
alter table trova_transactions
  add column if not exists buyer_token text,
  add column if not exists buyer_token_expires_at timestamptz;

-- Create index for buyer token lookups
create index if not exists idx_trova_transactions_buyer_token
  on trova_transactions(buyer_token)
  where buyer_token is not null;

-- Secure RPC for updating transaction status
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
  v_stored_buyer_token text;
  v_now timestamptz := now();
begin
  -- Get current transaction state
  select id, status, seller_id, buyer_id, buyer_token, buyer_token_expires_at
  into v_transaction
  from public.trova_transactions
  where id = p_transaction_id;

  if v_transaction is null then
    return jsonb_build_object('success', false, 'error', 'Transaction not found');
  end if;

  v_current_status := v_transaction.status;
  v_seller_id := v_transaction.seller_id;
  v_buyer_id := v_transaction.buyer_id;

  -- Determine if caller is authorized based on role
  if p_actor_role = 'seller' then
    -- Seller can only set shipped or delivered
    if p_new_status not in ('shipped', 'delivered') then
      return jsonb_build_object('success', false, 'error', 'Sellers can only mark as shipped or delivered');
    end if;
    
    -- Verify caller is the actual seller
    if p_actor_id is not null and v_seller_id is not null and v_seller_id <> p_actor_id then
      return jsonb_build_object('success', false, 'error', 'Not authorized for this transaction');
    end if;
    
  elsif p_actor_role = 'buyer' then
    -- Buyer can only set deposited, funds_released, or disputed
    if p_new_status not in ('deposited', 'funds_released', 'disputed') then
      return jsonb_build_object('success', false, 'error', 'Buyers can only deposit, release funds, or raise disputes');
    end if;
    
    -- If buyer is authenticated, verify they are the actual buyer
    if p_actor_id is not null and v_buyer_id is not null and v_buyer_id <> p_actor_id then
      return jsonb_build_object('success', false, 'error', 'Not authorized for this transaction');
    end if;
    
    -- If buyer is not authenticated (public page), require valid buyer token
    if p_actor_id is null then
      if p_buyer_token is null or v_transaction.buyer_token is null then
        return jsonb_build_object('success', false, 'error', 'Buyer verification required');
      end if;
      
      if p_buyer_token <> v_transaction.buyer_token then
        return jsonb_build_object('success', false, 'error', 'Invalid buyer verification token');
      end if;
      
      if v_transaction.buyer_token_expires_at is not null and v_transaction.buyer_token_expires_at < v_now then
        return jsonb_build_object('success', false, 'error', 'Buyer verification expired');
      end if;
    end if;
    
  elsif p_actor_role = 'admin' then
    -- Admins can do anything (no restriction)
    null;
    
  else
    return jsonb_build_object('success', false, 'error', 'Invalid actor role');
  end if;

  -- All checks passed, update the status
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
