-- 033_fix_transaction_id_format.sql
-- Restore clean human-readable TrustLink IDs: TL-XXXX (4-digit random)
-- instead of the long hex string TL-a1b2c3d4e5f6g7h8.

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
  v_attempts int := 0;
begin
  select id into v_seller_id
  from trova_sellers
  where profile_id = auth.uid()
  limit 1;

  if v_seller_id is null then
    raise exception 'Not authenticated as seller';
  end if;

  loop
    v_transaction_id := 'TL-' || floor(1000 + random() * 9000)::int::text;
    exit when not exists (select 1 from trova_transactions where id = v_transaction_id);
    v_attempts := v_attempts + 1;
    exit when v_attempts >= 10;
  end loop;

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

  select to_jsonb(t) into v_transaction from public.trova_transactions t where t.id = v_transaction_id;

  v_payment_url := current_setting('app.site_url', true) || '/pay/' || v_transaction_id;
  v_tracking_url := current_setting('app.site_url', true) || '/track/' || v_transaction_id;

  return jsonb_build_object(
    'transaction', v_transaction,
    'paymentUrl', v_payment_url,
    'trackingUrl', v_tracking_url
  );
end;
$$;

revoke all on function public.trova_create_transaction(jsonb) from public;
grant execute on function public.trova_create_transaction(jsonb) to authenticated;
