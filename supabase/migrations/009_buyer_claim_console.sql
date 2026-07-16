-- 009_buyer_claim_console.sql
-- Adds buyer claim/linking RPCs and buyer console support.

alter table trova_buyers
  add column if not exists display_name text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz default now();

create index if not exists idx_trova_buyers_profile_id on trova_buyers (profile_id);
create index if not exists idx_trova_buyers_email_lower on trova_buyers ((lower(email)));
create index if not exists idx_trova_buyers_phone_digits on trova_buyers ((regexp_replace(phone, '\D', '', 'g')));
create unique index if not exists idx_trova_buyers_email_unique on trova_buyers ((lower(email))) where email is not null;
create unique index if not exists idx_trova_buyers_phone_unique on trova_buyers ((regexp_replace(phone, '\D', '', 'g'))) where phone is not null and regexp_replace(phone, '\D', '', 'g') <> '';

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
  v_buyer_email := nullif(trim(coalesce(payload ->> 'buyerEmail', payload ->> 'buyer_email')), '');
  v_description := trim(coalesce(payload ->> 'description', ''));
  v_amount := coalesce(nullif(regexp_replace(payload ->> 'amount', '[^0-9.\-]', '', 'g'), '')::numeric, 0);
  v_shipping_fee := coalesce(nullif(regexp_replace(payload ->> 'shippingFee', '[^0-9.\-]', '', 'g'), '')::numeric, 0);
  v_currency_code := upper(coalesce(payload ->> 'currencyCode', payload ->> 'currency_code', 'NGN'));
  v_transaction_type := lower(coalesce(payload ->> 'transactionType', payload ->> 'transaction_type', 'physical'));
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

  if coalesce(v_kyc_status, 'unverified') <> 'verified' then
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
      'kycStatusAtCreation', coalesce(v_kyc_status, 'unverified'),
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
      'buyerId', v_transaction.buyer_id,
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
    raise exception '%', sqlerrm;
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
    'buyerName', coalesce(bp.display_name, b.display_name),
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
    'claimedByBuyer', t.buyer_id is not null
  )
  into v_transaction
  from trova_transactions t
  left join trova_sellers s on s.id = t.seller_id
  left join trova_buyers b on b.id = t.buyer_id
  left join trova_profiles bp on bp.id = b.profile_id
  where t.id = p_transaction_id;

  if v_transaction is null then
    raise exception 'Transaction not found' using errcode = 'P0002';
  end if;

  return v_transaction;
end;
$$;

create or replace function public.trova_get_or_create_buyer_profile()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_display_name text;
  v_profile trova_profiles;
  v_buyer trova_buyers;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = 'P0001';
  end if;

  v_email := lower(nullif(trim(auth.jwt() ->> 'email'), ''));
  v_display_name := nullif(trim(auth.jwt() ->> 'full_name'), '');

  select p.* into v_profile
  from trova_profiles p
  where p.id = v_user_id;

  if v_profile.id is null then
    insert into trova_profiles (id, email, role, display_name, kyc_status)
    values (v_user_id, v_email, 'buyer', coalesce(v_display_name, split_part(v_email, '@', 1)), 'unverified')
    on conflict (id) do update
    set role = 'buyer',
        email = coalesce(excluded.email, trova_profiles.email),
        display_name = coalesce(excluded.display_name, trova_profiles.display_name),
        updated_at = now()
    returning * into v_profile;
  else
    update trova_profiles
    set role = case when role = 'seller' then 'seller' else 'buyer' end,
        email = coalesce(v_email, email),
        display_name = coalesce(v_display_name, display_name),
        updated_at = now()
    where id = v_user_id
    returning * into v_profile;
  end if;

  select b.* into v_buyer
  from trova_buyers b
  where b.profile_id = v_user_id;

  if v_buyer.id is null then
    select b.* into v_buyer
    from trova_buyers b
    where (v_email <> '' and lower(b.email) = v_email)
       or (b.phone is not null and b.phone <> '' and lower(b.phone) = lower(v_email))
    limit 1;

    if v_buyer.id is not null and v_buyer.profile_id <> v_user_id then
      delete from trova_profiles where id = v_buyer.profile_id and id <> v_user_id;
    end if;

    insert into trova_buyers (id, profile_id, display_name, email, phone, metadata)
    values (coalesce(v_buyer.id, gen_random_uuid()), v_user_id, coalesce(v_display_name, v_profile.display_name), coalesce(v_email, v_profile.email), v_profile.phone, coalesce(v_buyer.metadata, '{}'::jsonb))
    on conflict (id) do update
    set profile_id = excluded.profile_id,
        display_name = coalesce(excluded.display_name, trova_buyers.display_name),
        email = coalesce(excluded.email, trova_buyers.email),
        phone = coalesce(excluded.phone, trova_buyers.phone),
        metadata = coalesce(excluded.metadata, trova_buyers.metadata),
        updated_at = now()
    returning * into v_buyer;
  else
    update trova_buyers
    set display_name = coalesce(v_display_name, display_name),
        email = coalesce(v_email, email),
        phone = coalesce(v_profile.phone, phone),
        metadata = coalesce(metadata, '{}'::jsonb),
        updated_at = now()
    where id = v_buyer.id
    returning * into v_buyer;
  end if;

  return jsonb_build_object(
    'profile', jsonb_build_object(
      'id', v_profile.id,
      'email', v_profile.email,
      'role', v_profile.role,
      'displayName', v_profile.display_name,
      'phone', v_profile.phone,
      'kycStatus', v_profile.kyc_status
    ),
    'buyer', jsonb_build_object(
      'id', v_buyer.id,
      'profileId', v_buyer.profile_id,
      'displayName', v_buyer.display_name,
      'email', v_buyer.email,
      'phone', v_buyer.phone,
      'metadata', v_buyer.metadata
    )
  );
end;
$$;

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
  v_user_id uuid := auth.uid();
  v_profile_id uuid;
  v_buyer_id uuid;
  v_email text;
  v_phone text;
  v_display_name text;
  v_existing_profile uuid;
  v_existing_buyer uuid;
  v_transaction trova_transactions;
begin
  v_email := lower(nullif(trim(p_email), ''));
  v_phone := nullif(trim(p_phone), '');
  v_display_name := nullif(trim(coalesce(p_full_name, '')), '');

  if v_email is null and v_phone is null then
    raise exception 'Buyer email or phone number is required' using errcode = 'P0001';
  end if;

  if v_user_id is not null then
    v_profile_id := v_user_id;

    select p.id into v_existing_profile
    from trova_profiles p
    where p.id = v_user_id;

    if v_existing_profile is null then
      insert into trova_profiles (id, email, role, display_name, kyc_status)
      values (v_user_id, v_email, 'buyer', coalesce(v_display_name, split_part(coalesce(v_email, v_user_id::text), '@', 1)), 'unverified')
      returning id into v_profile_id;
    else
      update trova_profiles
      set email = coalesce(v_email, email),
          display_name = coalesce(v_display_name, display_name),
          updated_at = now()
      where id = v_user_id;
    end if;

    select b.id into v_existing_buyer
    from trova_buyers b
    where b.profile_id = v_user_id;

    if v_existing_buyer is null then
      insert into trova_buyers (id, profile_id, display_name, email, phone, metadata)
      values (gen_random_uuid(), v_user_id, v_display_name, v_email, v_phone, '{}'::jsonb)
      returning id into v_existing_buyer;
    else
      update trova_buyers
      set display_name = coalesce(v_display_name, display_name),
          email = coalesce(v_email, email),
          phone = coalesce(v_phone, phone),
          metadata = coalesce(metadata, '{}'::jsonb),
          updated_at = now()
      where id = v_existing_buyer;
    end if;

    v_buyer_id := v_existing_buyer;
  else
    select b.id, b.profile_id
    into v_existing_buyer, v_existing_profile
    from trova_buyers b
    where (v_email is not null and b.email is not null and lower(b.email) = v_email)
       or (v_phone is not null and b.phone is not null and regexp_replace(b.phone, '\D', '', 'g') = regexp_replace(v_phone, '\D', '', 'g'))
    order by b.created_at desc
    limit 1;

    if v_existing_buyer is null and v_email is not null then
      select p.id into v_existing_profile
      from trova_profiles p
      where lower(p.email) = v_email
      limit 1;
    end if;

    if v_existing_profile is null then
      v_existing_profile := gen_random_uuid();
      insert into trova_profiles (id, email, role, display_name, phone, kyc_status)
      values (v_existing_profile, v_email, 'buyer', v_display_name, v_phone, 'unverified');
    else
      update trova_profiles
      set display_name = coalesce(v_display_name, display_name),
          email = coalesce(v_email, email),
          phone = coalesce(v_phone, phone),
          updated_at = now()
      where id = v_existing_profile;
    end if;

    if v_existing_buyer is null then
      insert into trova_buyers (id, profile_id, display_name, email, phone, metadata)
      values (gen_random_uuid(), v_existing_profile, v_display_name, v_email, v_phone, '{}'::jsonb)
      returning id into v_existing_buyer;
    else
      update trova_buyers
      set profile_id = v_existing_profile,
          display_name = coalesce(v_display_name, display_name),
          email = coalesce(v_email, email),
          phone = coalesce(v_phone, phone),
          metadata = coalesce(metadata, '{}'::jsonb),
          updated_at = now()
      where id = v_existing_buyer;
    end if;

    v_profile_id := v_existing_profile;
    v_buyer_id := v_existing_buyer;
  end if;

  update trova_transactions
  set buyer_id = v_buyer_id,
      buyer_email = coalesce(v_email, buyer_email),
      buyer_phone = coalesce(v_phone, buyer_phone),
      metadata = jsonb_set(
        coalesce(metadata, '{}'::jsonb),
        '{buyerClaimedAt}',
        to_jsonb(now()),
        true
      ),
      updated_at = now()
  where id = p_transaction_id
  returning * into v_transaction;

  if v_transaction.id is null then
    raise exception 'Transaction not found' using errcode = 'P0002';
  end if;

  insert into trova_notifications (profile_id, text_payload, read)
  values (
    v_profile_id,
    format('You claimed escrow order %s for "%s".', v_transaction.id, v_transaction.product_name),
    false
  )
  on conflict do nothing;

  return jsonb_build_object(
    'transaction', jsonb_build_object(
      'id', v_transaction.id,
      'sellerId', v_transaction.seller_id,
      'buyerId', v_transaction.buyer_id,
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
      'claimedByBuyer', v_transaction.buyer_id is not null
    ),
    'buyer', jsonb_build_object(
      'id', v_buyer_id,
      'profileId', v_profile_id,
      'displayName', v_display_name,
      'email', v_email,
      'phone', v_phone
    )
  );
end;
$$;

create or replace function public.trova_get_buyer_transactions()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_buyer_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = 'P0001';
  end if;

  select b.id into v_buyer_id
  from trova_buyers b
  where b.profile_id = v_user_id;

  if v_buyer_id is null then
    select b.id into v_buyer_id
    from trova_buyers b
    left join trova_profiles p on p.id = b.profile_id
    where lower(p.email) = lower(auth.jwt() ->> 'email')
       or (b.email is not null and lower(b.email) = lower(auth.jwt() ->> 'email'))
    order by b.created_at desc
    limit 1;
  end if;

  if v_buyer_id is null then
    return '[]'::jsonb;
  end if;

  return coalesce(jsonb_agg(
    jsonb_build_object(
      'id', t.id,
      'sellerName', s.business_name,
      'buyerId', t.buyer_id,
      'buyerName', coalesce(bp.display_name, b.display_name),
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
      'claimedByBuyer', t.buyer_id is not null
    )
    order by t.created_at desc
  ), '[]'::jsonb)
  from trova_transactions t
  left join trova_sellers s on s.id = t.seller_id
  left join trova_buyers b on b.id = t.buyer_id
  left join trova_profiles bp on bp.id = b.profile_id
  where t.buyer_id = v_buyer_id
     or (t.buyer_email is not null and lower(t.buyer_email) = lower(auth.jwt() ->> 'email'))
     or (t.buyer_phone is not null and regexp_replace(t.buyer_phone, '\D', '', 'g') = regexp_replace(coalesce(b.phone, ''), '\D', '', 'g'));
end;
$$;

revoke all on function public.trova_create_transaction(jsonb) from public;
revoke all on function public.trova_get_public_transaction(text) from public;
revoke all on function public.trova_get_or_create_buyer_profile() from public;
revoke all on function public.trova_claim_buyer_transaction(text, text, text, text) from public;
revoke all on function public.trova_get_buyer_transactions() from public;

grant execute on function public.trova_create_transaction(jsonb) to authenticated;
grant execute on function public.trova_get_public_transaction(text) to public;
grant execute on function public.trova_get_or_create_buyer_profile() to authenticated;
grant execute on function public.trova_claim_buyer_transaction(text, text, text, text) to public;
grant execute on function public.trova_get_buyer_transactions() to authenticated;

notify pgrst, 'reload schema';


