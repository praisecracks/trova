-- 043_buyer_access_control.sql
-- Adds buyer verification for public tracking/checkout pages
-- Only allows access to pending_deposit links if buyer phone matches

-- Minimal RPC: returns just enough info to decide if verification is needed
create or replace function public.trova_get_transaction_access_info(p_transaction_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'status', t.status,
    'has_buyer_phone', (t.buyer_phone is not null and trim(t.buyer_phone) <> ''),
    'buyer_phone_last4',
      case 
        when t.buyer_phone is not null and length(regexp_replace(t.buyer_phone, '\D', '', 'g')) >= 4
        then right(regexp_replace(t.buyer_phone, '\D', '', 'g'), 4)
        else null
      end,
    'product_name', t.product_name,
    'currency_symbol', t.currency_symbol,
    'vendor_name', t.vendor_name
  ) into v_result
  from public.trova_transactions t
  where t.id = p_transaction_id;

  if v_result is null then
    return jsonb_build_object('status', 'not_found');
  end if;

  return v_result;
end;
$$;

-- Verification RPC: checks if entered phone matches buyer_phone
-- If match, generates and stores a buyer token for subsequent authenticated actions
create or replace function public.trova_verify_buyer_access(p_transaction_id text, p_phone text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_stored_phone text;
  v_status text;
  v_normalized_stored text;
  v_normalized_entered text;
  v_buyer_token text;
begin
  -- Get stored phone and status
  select buyer_phone, status into v_stored_phone, v_status
  from public.trova_transactions
  where id = p_transaction_id;

  if v_stored_phone is null or trim(v_stored_phone) = '' then
    return jsonb_build_object('match', true, 'reason', 'no_buyer_phone_set');
  end if;

  -- Normalize both phones: remove all non-digit characters
  v_normalized_stored := regexp_replace(v_stored_phone, '\D', '', 'g');
  v_normalized_entered := regexp_replace(p_phone, '\D', '', 'g');

  -- Compare last 10 digits (handles country code differences)
  if length(v_normalized_stored) >= 10 and length(v_normalized_entered) >= 10 then
    if right(v_normalized_stored, 10) = right(v_normalized_entered, 10) then
      -- Generate buyer token for subsequent authenticated actions
      v_buyer_token := encode(gen_random_bytes(16), 'hex');
      
      update public.trova_transactions
      set 
        buyer_token = v_buyer_token,
        buyer_token_expires_at = (now() + interval '7 days')::timestamptz
      where id = p_transaction_id;
      
      return jsonb_build_object('match', true, 'reason', 'phone_matched', 'buyer_token', v_buyer_token);
    end if;
  end if;

  -- Fallback: exact normalized match
  if v_normalized_stored = v_normalized_entered then
    v_buyer_token := encode(gen_random_bytes(16), 'hex');
    
    update public.trova_transactions
    set 
      buyer_token = v_buyer_token,
      buyer_token_expires_at = (now() + interval '7 days')::timestamptz
    where id = p_transaction_id;
    
    return jsonb_build_object('match', true, 'reason', 'phone_matched', 'buyer_token', v_buyer_token);
  end if;

  return jsonb_build_object('match', false, 'reason', 'phone_mismatch');
end;
$$;

revoke all on function public.trova_get_transaction_access_info(text) from public;
grant execute on function public.trova_get_transaction_access_info(text) to public;

revoke all on function public.trova_verify_buyer_access(text, text) from public;
grant execute on function public.trova_verify_buyer_access(text, text) to public;
