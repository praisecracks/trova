-- 012_add_missing_rpc_functions.sql
-- Adds all missing RPC functions that frontend is calling

create extension if not exists "pgcrypto";

-- 1. trova_get_or_create_buyer_profile
create or replace function public.trova_get_or_create_buyer_profile()
returns jsonb
language plpgsql
security definer
as $$
declare
  v_uid uuid;
  v_profile jsonb;
  v_buyer jsonb;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Get or create profile
  insert into public.trova_profiles (id, email, role, created_at)
  select
    v_uid,
    auth.email(),
    'buyer',
    now()
  on conflict (id) do nothing;

  -- Get or create buyer record
  insert into public.trova_buyers (id, profile_id, created_at)
  select
    v_uid,
    v_uid,
    now()
  on conflict (id) do nothing;

  -- Return combined data
  select to_jsonb(p) into v_profile from public.trova_profiles p where p.id = v_uid;
  select to_jsonb(b) into v_buyer from public.trova_buyers b where b.id = v_uid;

  return jsonb_build_object(
    'profile', v_profile,
    'buyer', v_buyer
  );
end;
$$;

-- 2. trova_create_transaction
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
  v_seller_id := auth.uid();

  if v_seller_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Generate transaction ID
  v_transaction_id := 'TL-' || encode(gen_random_bytes(8), 'hex');

  -- Insert transaction
  insert into public.trova_transactions (
    id,
    seller_id,
    buyer_email,
    product_name,
    amount,
    shipping_fee,
    currency_code,
    status,
    created_at,
    updated_at
  ) values (
    v_transaction_id,
    v_seller_id,
    (payload->>'buyerEmail')::text,
    (payload->>'productName')::text,
    (payload->>'amount')::numeric,
    coalesce((payload->>'shippingFee')::numeric, 0),
    coalesce((payload->>'currencyCode')::text, 'NGN'),
    'pending_deposit',
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

-- 3. trova_get_public_transaction
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
    'productName', t.product_name,
    'amount', t.amount,
    'shippingFee', t.shipping_fee,
    'currencyCode', t.currency_code,
    'status', t.status,
    'createdAt', t.created_at,
    'expiresAt', t.expires_at
  ) into v_transaction
  from public.trova_transactions t
  where t.id = p_transaction_id;

  return v_transaction;
end;
$$;

-- Set default site_url for URL generation
alter database postgres set app.site_url to 'https://trova.co';
