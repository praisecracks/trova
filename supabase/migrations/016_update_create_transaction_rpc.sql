-- 016_update_create_transaction_rpc.sql
-- Update trova_create_transaction to include new transaction fields

create or replace function public.trova_create_transaction(payload jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_seller_id uuid;
  v_transaction_id text;
  v_transaction jsonb;
  v_payment_url text;
  v_tracking_url text;
begin
  -- Get seller ID from auth.uid() by looking up trova_sellers
  select id into v_seller_id
  from trova_sellers
  where profile_id = auth.uid()
  limit 1;

  if v_seller_id is null then
    raise exception 'Not authenticated as seller';
  end if;

  -- Generate transaction ID
  v_transaction_id := 'TL-' || encode(gen_random_bytes(8), 'hex');

  -- Insert transaction with all new fields
  insert into public.trova_transactions (
    id,
    seller_id,
    buyer_email,
    buyer_phone,
    buyer_name,
    product_name,
    description,
    amount,
    shipping_fee,
    currency_code,
    currency_symbol,
    transaction_type,
    status,
    vendor_name,
    expires_at,
    created_at,
    updated_at
  ) values (
    v_transaction_id,
    v_seller_id,
    (payload->>'buyerEmail')::text,
    (payload->>'buyerPhone')::text,
    (payload->>'buyerName')::text,
    (payload->>'productName')::text,
    (payload->>'description')::text,
    (payload->>'amount')::numeric,
    coalesce((payload->>'shippingFee')::numeric, 0),
    coalesce((payload->>'currencyCode')::text, 'USD'),
    coalesce((payload->>'currencySymbol')::text, '$'),
    coalesce((payload->>'transactionType')::text, 'physical'),
    'pending_deposit',
    (payload->>'vendorName')::text,
    (now() + interval '72 hours')::timestamptz,
    now(),
    now()
  );

  -- Get created transaction
  select to_jsonb(t) into v_transaction from public.trova_transactions t where t.id = v_transaction_id;

  -- Generate URLs (replace with real payment provider URLs later!)
  v_payment_url := current_setting('app.site_url', true) || '/pay/' || v_transaction_id;
  v_tracking_url := current_setting('app.site_url', true) || '/track/' || v_transaction_id;

  return jsonb_build_object(
    'transaction', v_transaction,
    'paymentUrl', v_payment_url,
    'trackingUrl', v_tracking_url
  );
end;
$$;
