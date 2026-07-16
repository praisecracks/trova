-- 011_v1_buyer_contact_fields.sql
-- V1 buyer flow stores buyer contact details directly on the transaction record.
-- No buyer account, login, or registration is required to complete checkout or tracking.

alter table trova_transactions
  add column if not exists buyer_name text;

create index if not exists idx_trova_transactions_buyer_contact
  on trova_transactions (buyer_name, buyer_email, buyer_phone);

create or replace function public.trova_claim_buyer_transaction(
  p_transaction_id text,
  p_email text,
  p_phone text,
  p_full_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_transaction_id text;
  v_buyer_name text;
  v_buyer_email text;
  v_buyer_phone text;
  v_transaction trova_transactions;
begin
  v_transaction_id := nullif(trim(p_transaction_id), '');
  v_buyer_name := nullif(trim(p_full_name), '');
  v_buyer_email := lower(nullif(trim(p_email), ''));
  v_buyer_phone := nullif(trim(p_phone), '');

  if v_transaction_id is null then
    raise exception 'Transaction reference is required' using errcode = 'P0001';
  end if;

  if v_buyer_name is null then
    raise exception 'Buyer full name is required' using errcode = 'P0002';
  end if;

  if v_buyer_email is null then
    raise exception 'Buyer email address is required' using errcode = 'P0003';
  end if;

  if v_buyer_phone is null then
    raise exception 'Buyer phone number is required' using errcode = 'P0004';
  end if;

  update trova_transactions
  set buyer_name = v_buyer_name,
      buyer_email = v_buyer_email,
      buyer_phone = v_buyer_phone,
      metadata = jsonb_set(
        coalesce(metadata, '{}'::jsonb),
        '{buyerClaimedAt}',
        to_jsonb(now()),
        true
      ),
      updated_at = now()
  where id = v_transaction_id
  returning * into v_transaction;

  if v_transaction.id is null then
    raise exception 'Transaction not found' using errcode = 'P0005';
  end if;

  return jsonb_build_object(
    'transaction', jsonb_build_object(
      'id', v_transaction.id,
      'sellerId', v_transaction.seller_id,
      'buyerId', v_transaction.buyer_id,
      'buyerName', v_transaction.buyer_name,
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
      'expiresAt', v_transaction.expires_at,
      'claimedByBuyer', v_transaction.buyer_name is not null
        or v_transaction.buyer_email is not null
        or v_transaction.buyer_phone is not null
    ),
    'buyer', jsonb_build_object(
      'displayName', v_transaction.buyer_name,
      'email', v_transaction.buyer_email,
      'phone', v_transaction.buyer_phone
    )
  );
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
    'buyerId', t.buyer_id,
    'buyerName', t.buyer_name,
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
    'expiresAt', t.expires_at,
    'claimedByBuyer', t.buyer_name is not null
      or t.buyer_email is not null
      or t.buyer_phone is not null
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

revoke all on function public.trova_claim_buyer_transaction(text, text, text, text) from public;
revoke all on function public.trova_get_public_transaction(text) from public;

grant execute on function public.trova_claim_buyer_transaction(text, text, text, text) to public;
grant execute on function public.trova_get_public_transaction(text) to public;

notify pgrst, 'reload schema';
