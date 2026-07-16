-- 017_update_get_public_transaction_rpc.sql
-- Update trova_get_public_transaction to include all transaction fields

create or replace function public.trova_get_public_transaction(p_transaction_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_transaction jsonb;
begin
  select jsonb_build_object(
    'id', t.id,
    'seller_id', t.seller_id,
    'buyer_id', t.buyer_id,
    'buyer_email', t.buyer_email,
    'buyer_phone', t.buyer_phone,
    'buyer_name', t.buyer_name,
    'product_name', t.product_name,
    'description', t.description,
    'amount', t.amount,
    'shipping_fee', t.shipping_fee,
    'currency_code', t.currency_code,
    'currency_symbol', t.currency_symbol,
    'transaction_type', t.transaction_type,
    'status', t.status,
    'created_at', t.created_at,
    'updated_at', t.updated_at,
    'expires_at', t.expires_at,
    'payment_reference', t.payment_reference,
    'payment_method', t.payment_method,
    'payment_gateway', t.payment_gateway,
    'payment_status', t.payment_status,
    'vendor_name', t.vendor_name,
    'escrow_hold_reference', t.escrow_hold_reference,
    'seller_business_name', s.business_name,
    'seller_display_name', p.display_name,
    'seller_kyc_status', p.kyc_status,
    'seller_avatar_url', p.avatar_url,
    'rating_average', COALESCE(r.avg_score, 0),
    'rating_count', COALESCE(r.cnt, 0),
    'active_referral_count', COALESCE(ref.active_count, 0)
  ) into v_transaction
  from public.trova_transactions t
  left join trova_sellers s on s.id = t.seller_id
  left join trova_profiles p on p.id = s.profile_id
  left join (
    select seller_id, avg(score) as avg_score, count(*) as cnt
    from trova_ratings
    group by seller_id
  ) r on r.seller_id = t.seller_id
  left join (
    select referrer_seller_id, count(*) as active_count
    from trova_referrals
    where status = 'Active'
    group by referrer_seller_id
  ) ref on ref.referrer_seller_id = t.seller_id
  where t.id = p_transaction_id;

  return v_transaction;
end;
$$;
