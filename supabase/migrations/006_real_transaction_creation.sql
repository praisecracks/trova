-- 006_real_transaction_creation.sql
-- Adds production fields and RPCs for real escrow transaction creation.

create extension if not exists "pgcrypto";

alter table trova_sellers
  add column if not exists status text not null default 'active' check (status in ('active', 'suspended'));

alter table trova_transactions
  add column if not exists buyer_phone text,
  add column if not exists description text not null default '',
  add column if not exists transaction_type text not null default 'physical' check (transaction_type in ('physical', 'service')),
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists payment_reference text unique,
  add column if not exists paystack_reference text unique,
  add column if not exists idempotency_key text unique;

create index if not exists idx_trova_transactions_seller_status
  on trova_transactions (seller_id, status);

create index if not exists idx_trova_transactions_expires_at
  on trova_transactions (expires_at);

create index if not exists idx_trova_transactions_payment_reference
  on trova_transactions (payment_reference);

insert into trova_system_settings (key, value)
values
  ('transaction_limits', '{
    "unverifiedDailyCreationLimit": 5,
    "unverifiedSingleTransactionLimitNgn": 50000,
    "unverifiedComplianceDeclineLimitNgn": 1000000,
    "singleTransactionCapNgn": 5000000
  }'::jsonb),
  ('currency_exchange_rates', '{
    "USD_NGN": 1500
  }'::jsonb)
on conflict (key) do update set value = excluded.value;

create or replace function public.trova_create_transaction(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid := auth.uid();
  v_profile_role text;
  v_kyc_status text;
  v_seller_id uuid;
  v_seller_status text;
  v_amount numeric;
  v_shipping_fee numeric;
  v_currency_code text;
  v_currency_symbol text;
  v_transaction_type text;
  v_description text;
  v_buyer_phone text;
  v_buyer_email text;
  v_product_name text;
  v_amount_naira numeric;
  v_exchange_rate numeric;
  v_single_cap numeric;
  v_unverified_single_limit numeric;
  v_unverified_compliance_limit numeric;
  v_generated_id text;
  v_attempts int := 0;
  v_transaction trova_transactions;
begin
  if v_profile_id is null then
    raise exception 'Authentication required' using errcode = 'P0001';
  end if;

  select p.role, p.kyc_status
  into v_profile_role, v_kyc_status
  from trova_profiles p
  where p.id = v_profile_id;

  if v_profile_role is null then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  if v_profile_role <> 'seller' then
    raise exception 'Only seller accounts can create escrow links' using errcode = 'P0003';
  end if;

  select s.id, s.status
  into v_seller_id, v_seller_status
  from trova_sellers s
  where s.profile_id = v_profile_id;

  if v_seller_id is null then
    raise exception 'Seller profile not found' using errcode = 'P0004';
  end if;

  if v_seller_status = 'suspended' then
    raise exception 'Seller account is suspended' using errcode = 'P0005';
  end if;

  v_product_name := nullif(trim(coalesce(payload ->> 'productName', payload ->> 'product_name')), '');
  v_buyer_phone := nullif(trim(coalesce(payload ->> 'buyerPhone', payload ->> 'buyer_phone')), '');
  v_buyer_email := nullif(trim(payload ->> 'buyerEmail'), '');
  v_description := trim(coalesce(payload ->> 'description', ''));
  v_amount := coalesce(nullif((payload ->> 'amount')::numeric, 0), 0);
  v_shipping_fee := coalesce(nullif((payload ->> 'shippingFee')::numeric, 0), 0);
  v_currency_code := upper(coalesce(payload ->> 'currencyCode', payload ->> 'currency_code', 'NGN'));
  v_transaction_type := coalesce(payload ->> 'transactionType', payload ->> 'transaction_type', 'physical');
  v_currency_symbol := case when v_currency_code = 'USD' then '$' else '₦' end;
  v_exchange_rate := coalesce(((select value ->> 'USD_NGN' from trova_system_settings where key = 'currency_exchange_rates')::numeric), 1500);
  v_amount_naira := case when v_currency_code = 'USD' then v_amount * v_exchange_rate else v_amount end;

  select
    coalesce((value ->> 'singleTransactionCapNgn')::numeric, 5000000),
    coalesce((value ->> 'unverifiedSingleTransactionLimitNgn')::numeric, 50000),
    coalesce((value ->> 'unverifiedComplianceDeclineLimitNgn')::numeric, 1000000)
  into v_single_cap, v_unverified_single_limit, v_unverified_compliance_limit
  from trova_system_settings
  where key = 'transaction_limits';

  if v_product_name is null then
    raise exception 'Product name is required' using errcode = 'P0006';
  end if;

  if length(v_product_name) > 160 then
    raise exception 'Product name is too long' using errcode = 'P0007';
  end if;

  if v_buyer_phone is null then
    raise exception 'Buyer phone number is required' using errcode = 'P0008';
  end if;

  if v_amount <= 0 then
    raise exception 'Amount must be greater than zero' using errcode = 'P0009';
  end if;

  if v_shipping_fee < 0 then
    raise exception 'Shipping fee cannot be negative' using errcode = 'P0010';
  end if;

  if v_currency_code not in ('NGN', 'USD') then
    raise exception 'Unsupported currency' using errcode = 'P0011';
  end if;

  if v_transaction_type not in ('physical', 'service') then
    raise exception 'Unsupported transaction type' using errcode = 'P0012';
  end if;

  if v_amount_naira > v_single_cap then
    raise exception 'Transaction amount exceeds platform cap' using errcode = 'P0013';
  end if;

  if v_kyc_status <> 'verified' then
    if v_amount_naira > v_unverified_single_limit then
      raise exception 'Unverified sellers can only create escrow links up to the active limit' using errcode = 'P0014';
    end if;

    if v_amount_naira > v_unverified_compliance_limit then
      raise exception 'Transaction requires verified KYC status' using errcode = 'P0015';
    end if;
  end if;

  loop
    v_attempts := v_attempts + 1;
    v_generated_id := 'TL-' || floor(1000 + random() * 9000)::int::text;

    if not exists (select 1 from trova_transactions where id = v_generated_id) then
      exit;
    end if;

    if v_attempts >= 10 then
      raise exception 'Unable to generate unique transaction reference' using errcode = 'P0016';
    end if;
  end loop;

  insert into trova_transactions (
    id,
    seller_id,
    buyer_email,
    buyer_phone,
    product_name,
    amount,
    shipping_fee,
    currency_code,
    currency_symbol,
    status,
    description,
    transaction_type,
    expires_at,
    metadata
  ) values (
    v_generated_id,
    v_seller_id,
    v_buyer_email,
    v_buyer_phone,
    v_product_name,
    v_amount,
    v_shipping_fee,
    v_currency_code,
    v_currency_symbol,
    'pending_deposit',
    v_description,
    v_transaction_type,
    now() + interval '72 hours',
    jsonb_build_object(
      'createdByProfileId', v_profile_id,
      'kycStatusAtCreation', v_kyc_status,
      'amountInNgn', v_amount_naira
    )
  )
  returning * into v_transaction;

  insert into trova_notifications (profile_id, text_payload, read)
  values (
    v_profile_id,
    format('New escrow link created: %s (%s).', v_product_name, v_generated_id),
    false
  );

  return jsonb_build_object(
    'transaction', jsonb_build_object(
      'id', v_transaction.id,
      'sellerId', v_transaction.seller_id,
      'buyerEmail', v_transaction.buyer_email,
      'buyerPhone', v_transaction.buyer_phone,
      'productName', v_transaction.product_name,
      'amount', v_transaction.amount,
      'shippingFee', v_transaction.shipping_fee,
      'currencyCode', v_transaction.currency_code,
      'currencySymbol', v_transaction.currency_symbol,
      'status', v_transaction.status,
      'description', v_transaction.description,
      'transactionType', v_transaction.transaction_type,
      'createdAt', v_transaction.created_at,
      'updatedAt', v_transaction.updated_at,
      'expiresAt', v_transaction.expires_at
    ),
    'paymentUrl', format('/pay/%s', v_generated_id),
    'trackingUrl', format('/track/%s', v_generated_id)
  );
exception
  when others then
    raise exception '%', sqlerrm using errcode = coalesce(sqlstate, 'P0099');
end;
$$;

create or replace function public.trova_get_public_transaction(p_transaction_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_transaction jsonb;
begin
  select jsonb_build_object(
    'id', t.id,
    'sellerName', s.business_name,
    'buyerEmail', t.buyer_email,
    'buyerPhone', t.buyer_phone,
    'productName', t.product_name,
    'amount', t.amount,
    'shippingFee', t.shipping_fee,
    'currencyCode', t.currency_code,
    'currencySymbol', t.currency_symbol,
    'status', t.status,
    'description', t.description,
    'transactionType', t.transaction_type,
    'createdAt', t.created_at,
    'updatedAt', t.updated_at,
    'expiresAt', t.expires_at
  )
  into v_transaction
  from trova_transactions t
  left join trova_sellers s on s.id = t.seller_id
  where t.id = p_transaction_id;

  if v_transaction is null then
    raise exception 'Transaction not found' using errcode = 'P0002';
  end if;

  return v_transaction;
end;
$$;

revoke all on function public.trova_create_transaction(jsonb) from public;
grant execute on function public.trova_create_transaction(jsonb) to authenticated;

grant execute on function public.trova_get_public_transaction(text) to public;
