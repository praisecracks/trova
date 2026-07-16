-- 044_replace_public_transaction_rpc.sql
-- Replaces trova_get_public_transaction with a robust version
-- that handles missing tables/columns gracefully and returns null on error
-- instead of throwing 400 Bad Request

create or replace function public.trova_get_public_transaction(p_transaction_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_transaction record;
  v_seller_business_name text;
  v_seller_display_name text;
  v_seller_kyc_status text;
  v_seller_avatar_url text;
  v_rating_average numeric;
  v_rating_count bigint;
  v_active_referral_count bigint;
begin
  -- Get core transaction data
  select 
    t.id, t.seller_id, t.buyer_phone, t.buyer_email, t.buyer_name,
    t.product_name, t.description, t.amount, t.shipping_fee,
    t.currency_code, t.currency_symbol, t.transaction_type, t.status,
    t.created_at, t.updated_at, t.expires_at,
    t.payment_reference, t.payment_method, t.payment_gateway, t.payment_status,
    t.vendor_name, t.escrow_hold_reference
  into 
    v_transaction
  from public.trova_transactions t
  where t.id = p_transaction_id;

  if v_transaction is null then
    return null;
  end if;

  -- Try to get seller data (may fail if tables don't exist)
  begin
    select 
      s.business_name, 
      p.display_name, 
      p.kyc_status, 
      coalesce(p.metadata->>'avatar_url', sf.profile_image_url),
      s.profile_id
    into 
      v_seller_business_name, 
      v_seller_display_name, 
      v_seller_kyc_status, 
      v_seller_avatar_url,
      v_transaction.seller_profile_id
    from trova_sellers s
    left join trova_profiles p on p.id = s.profile_id
    left join trova_storefronts sf on sf.seller_id = s.id
    where s.id = v_transaction.seller_id;
  exception when others then
    v_seller_business_name := null;
    v_seller_display_name := null;
    v_seller_kyc_status := null;
    v_seller_avatar_url := null;
    v_transaction.seller_profile_id := null;
  end;

  -- Try to get ratings (may fail if table doesn't exist)
  begin
    select COALESCE(AVG(score), 0), COUNT(*)
    into v_rating_average, v_rating_count
    from trova_ratings
    where seller_id = v_transaction.seller_id;
  exception when others then
    v_rating_average := 0;
    v_rating_count := 0;
  end;

  -- Try to get active referrals (may fail if table doesn't exist)
  begin
    select COUNT(*)
    into v_active_referral_count
    from trova_referrals
    where referrer_seller_id = v_transaction.seller_id
      and status = 'Active';
  exception when others then
    v_active_referral_count := 0;
  end;

  return jsonb_build_object(
    'id', v_transaction.id,
    'seller_id', v_transaction.seller_id,
    'buyer_phone', v_transaction.buyer_phone,
    'buyer_email', v_transaction.buyer_email,
    'buyer_name', v_transaction.buyer_name,
    'product_name', v_transaction.product_name,
    'description', v_transaction.description,
    'amount', v_transaction.amount,
    'shipping_fee', v_transaction.shipping_fee,
    'currency_code', v_transaction.currency_code,
    'currency_symbol', v_transaction.currency_symbol,
    'transaction_type', v_transaction.transaction_type,
    'status', v_transaction.status,
    'created_at', v_transaction.created_at,
    'updated_at', v_transaction.updated_at,
    'expires_at', v_transaction.expires_at,
    'payment_reference', v_transaction.payment_reference,
    'payment_method', v_transaction.payment_method,
    'payment_gateway', v_transaction.payment_gateway,
    'payment_status', v_transaction.payment_status,
    'vendor_name', v_transaction.vendor_name,
    'escrow_hold_reference', v_transaction.escrow_hold_reference,
    'seller_business_name', v_seller_business_name,
    'seller_display_name', v_seller_display_name,
    'seller_kyc_status', v_seller_kyc_status,
    'seller_avatar_url', v_seller_avatar_url,
    'seller_profile_id', v_transaction.seller_profile_id,
    'rating_average', v_rating_average,
    'rating_count', v_rating_count,
    'active_referral_count', v_active_referral_count
  );
end;
$$;

revoke all on function public.trova_get_public_transaction(text) from public;
grant execute on function public.trova_get_public_transaction(text) to public;
