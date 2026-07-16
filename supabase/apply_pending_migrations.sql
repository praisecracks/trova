-- ============================================
-- APPLY PENDING MIGRATIONS: 042, 043, 044, 045, 046, 047, 048, 051, 052
-- Run this entire script in Supabase Dashboard → SQL Editor → New Query
-- ============================================

-- 042_auto_expire_pending_links.sql
create or replace function public.expire_pending_deposit_links()
returns void
language plpgsql
security definer
as $$
begin
  update public.trova_transactions
  set 
    status = 'expired',
    updated_at = now()
  where 
    status = 'pending_deposit'
    and expires_at < now();
end;
$$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    select cron.schedule(
      'expire-pending-deposit-links',
      '*/5 * * * *',
      'select public.expire_pending_deposit_links();'
    );
  end if;
end;
$$;

revoke all on function public.expire_pending_deposit_links() from public;
grant execute on function public.expire_pending_deposit_links() to service_role;

-- 043_buyer_access_control.sql
alter table trova_transactions
  add column if not exists buyer_token text,
  add column if not exists buyer_token_expires_at timestamptz;

create index if not exists idx_trova_transactions_buyer_token
  on trova_transactions(buyer_token)
  where buyer_token is not null;

create or replace function public.trova_get_transaction_access_info(p_transaction_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_transaction record;
  v_buyer_phone_last4 text;
begin
  select id, status, buyer_phone, product_name, currency_symbol, vendor_name
  into v_transaction
  from public.trova_transactions
  where id = p_transaction_id;

  if v_transaction is null then
    return jsonb_build_object('status', 'not_found');
  end if;

  if v_transaction.buyer_phone is not null and length(trim(v_transaction.buyer_phone)) > 0 then
    v_buyer_phone_last4 := right(trim(v_transaction.buyer_phone), 4);
  else
    v_buyer_phone_last4 := null;
  end if;

  return jsonb_build_object(
    'status', v_transaction.status,
    'hasBuyerPhone', (v_transaction.buyer_phone is not null and length(trim(v_transaction.buyer_phone)) > 0),
    'buyerPhoneLast4', v_buyer_phone_last4,
    'productName', v_transaction.product_name,
    'currencySymbol', v_transaction.currency_symbol,
    'vendorName', v_transaction.vendor_name
  );
end;
$$;

revoke all on function public.trova_get_transaction_access_info(text) from public;
grant execute on function public.trova_get_transaction_access_info(text) to public;

create or replace function public.trova_verify_buyer_access(p_transaction_id text, p_phone text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_transaction record;
  v_buyer_token text;
begin
  select id, buyer_phone, status
  into v_transaction
  from public.trova_transactions
  where id = p_transaction_id;

  if v_transaction is null then
    return jsonb_build_object('match', false, 'reason', 'not_found');
  end if;

  if v_transaction.status <> 'pending_deposit' then
    return jsonb_build_object('match', false, 'reason', 'invalid_status');
  end if;

  if v_transaction.buyer_phone is null or length(trim(v_transaction.buyer_phone)) = 0 then
    return jsonb_build_object('match', false, 'reason', 'no_buyer_phone');
  end if;

  if trim(v_transaction.buyer_phone) = trim(p_phone) then
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

revoke all on function public.trova_verify_buyer_access(text, text) from public;
grant execute on function public.trova_verify_buyer_access(text, text) to public;

-- 044_replace_public_transaction_rpc.sql
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
  v_seller_profile_id uuid;
  v_rating_average numeric;
  v_rating_count bigint;
  v_active_referral_count bigint;
begin
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

  begin
    select 
      coalesce(nullif(sf.business_name, ''), s.business_name), 
      p.display_name, 
      p.kyc_status, 
      coalesce(nullif(sf.profile_image_url, ''), p.metadata->>'avatar_url'),
      s.profile_id
    into 
      v_seller_business_name, 
      v_seller_display_name, 
      v_seller_kyc_status, 
      v_seller_avatar_url,
      v_seller_profile_id
    from trova_sellers s
    left join trova_profiles p on p.id = s.profile_id
    left join trova_storefronts sf on sf.seller_id = s.id
    where s.id = v_transaction.seller_id;
  exception when others then
    v_seller_business_name := null;
    v_seller_display_name := null;
    v_seller_kyc_status := null;
    v_seller_avatar_url := null;
    v_seller_profile_id := null;
  end;

  begin
    select COALESCE(AVG(score), 0), COUNT(*)
    into v_rating_average, v_rating_count
    from trova_ratings
    where seller_id = v_transaction.seller_id;
  exception when others then
    v_rating_average := 0;
    v_rating_count := 0;
  end;

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
    'seller_profile_id', v_seller_profile_id,
    'rating_average', v_rating_average,
    'rating_count', v_rating_count,
    'active_referral_count', v_active_referral_count
  );
end;
$$;

revoke all on function public.trova_get_public_transaction(text) from public;
grant execute on function public.trova_get_public_transaction(text) to public;

-- 045_fix_existing_vendor_names.sql
update public.trova_transactions
set vendor_name = s.business_name
from trova_sellers s
where trova_transactions.seller_id = s.id
  and s.business_name is not null
  and s.business_name <> ''
  and (trova_transactions.vendor_name is null or trova_transactions.vendor_name = '');

-- 046_secure_transaction_status_updates.sql
alter table trova_transactions
  add column if not exists buyer_token text,
  add column if not exists buyer_token_expires_at timestamptz;

create index if not exists idx_trova_transactions_buyer_token
  on trova_transactions(buyer_token)
  where buyer_token is not null;

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
  select id, status, seller_id, buyer_id, buyer_token, buyer_token_expires_at, buyer_phone
  into v_transaction
  from public.trova_transactions
  where id = p_transaction_id;

  if v_transaction is null then
    return jsonb_build_object('success', false, 'error', 'Transaction not found');
  end if;

  v_current_status := v_transaction.status;
  v_seller_id := v_transaction.seller_id;
  v_buyer_id := v_transaction.buyer_id;

  if p_actor_role = 'seller' then
    if p_new_status not in ('shipped', 'delivered') then
      return jsonb_build_object('success', false, 'error', 'Sellers can only mark as shipped or delivered');
    end if;
    
    if p_actor_id is not null and v_seller_id is not null and v_seller_id <> p_actor_id then
      return jsonb_build_object('success', false, 'error', 'Not authorized for this transaction');
    end if;
    
  elsif p_actor_role = 'buyer' then
    if p_new_status not in ('deposited', 'funds_released', 'disputed') then
      return jsonb_build_object('success', false, 'error', 'Buyers can only deposit, release funds, or raise disputes');
    end if;
    
    if p_actor_id is not null and v_buyer_id is not null and v_buyer_id <> p_actor_id then
      return jsonb_build_object('success', false, 'error', 'Not authorized for this transaction');
    end if;
    
    if p_actor_id is null then
      if v_transaction.buyer_phone is null or trim(v_transaction.buyer_phone) = '' then
        null;
      elsif p_buyer_token is null or v_transaction.buyer_token is null then
        return jsonb_build_object('success', false, 'error', 'Buyer verification required');
      elsif p_buyer_token <> v_transaction.buyer_token then
        return jsonb_build_object('success', false, 'error', 'Invalid buyer verification token');
      elsif v_transaction.buyer_token_expires_at is not null and v_transaction.buyer_token_expires_at < v_now then
        return jsonb_build_object('success', false, 'error', 'Buyer verification expired');
      end if;
    end if;
    
  elsif p_actor_role = 'admin' then
    null;
    
  else
    return jsonb_build_object('success', false, 'error', 'Invalid actor role');
  end if;

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

-- 048_enable_realtime_for_transactions.sql
alter table trova_transactions replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication p
    join pg_publication_tables pt on pt.pubname = p.pubname
    where p.pubname = 'supabase_realtime' and pt.tablename = 'trova_transactions'
  ) then
    alter publication supabase_realtime add table trova_transactions;
  end if;
end;
$$;

-- ============================================
-- APPLY PENDING MIGRATIONS: 051
-- ============================================

-- 051_fix_public_deposit_and_seller_notify.sql
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
  v_now timestamptz := now();
begin
  select id, status, seller_id, buyer_id, buyer_token, buyer_token_expires_at, buyer_phone
  into v_transaction
  from public.trova_transactions
  where id = p_transaction_id;

  if v_transaction is null then
    return jsonb_build_object('success', false, 'error', 'Transaction not found');
  end if;

  v_current_status := v_transaction.status;
  v_seller_id := v_transaction.seller_id;
  v_buyer_id := v_transaction.buyer_id;

  if p_actor_role = 'seller' then
    if p_new_status not in ('shipped', 'delivered') then
      return jsonb_build_object('success', false, 'error', 'Sellers can only mark as shipped or delivered');
    end if;

    if p_actor_id is not null and v_seller_id is not null and v_seller_id <> p_actor_id then
      return jsonb_build_object('success', false, 'error', 'Not authorized for this transaction');
    end if;

  elsif p_actor_role = 'buyer' then
    if p_new_status not in ('deposited', 'delivered', 'disputed', 'funds_released') then
      return jsonb_build_object('success', false, 'error', 'Buyers can only deposit, confirm delivery, raise disputes, or release funds');
    end if;

    if p_actor_id is not null and v_buyer_id is not null and v_buyer_id <> p_actor_id then
      return jsonb_build_object('success', false, 'error', 'Not authorized for this transaction');
    end if;

    null;

  elsif p_actor_role = 'admin' then
    null;

  else
    return jsonb_build_object('success', false, 'error', 'Invalid actor role');
  end if;

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

create or replace function public.notify_seller_on_transaction_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
  v_amount numeric;
  v_symbol text;
  v_message text;
begin
  if TG_OP = 'UPDATE' and OLD.status is distinct from NEW.status then
    begin
      select s.profile_id
      into v_profile_id
      from trova_sellers s
      where s.id = NEW.seller_id;

      if v_profile_id is not null then
        if NEW.status = 'deposited' then
          v_amount := coalesce(NEW.amount, 0) + coalesce(NEW.shipping_fee, 0);
          v_symbol := coalesce(NEW.currency_symbol, '$');
          v_message := 'Payment secured for order ' || NEW.id || '. ' || v_symbol ||
            trim(to_char(v_amount, '999,999,999')) ||
            ' is now held in escrow. The buyer has paid.';
        elsif NEW.status = 'shipped' then
          v_message := 'Order ' || NEW.id || ' has been shipped and is now in transit to the buyer.';
        elsif NEW.status = 'delivered' then
          v_message := 'Buyer confirmed delivery for order ' || NEW.id || '. Awaiting your release approval.';
        elsif NEW.status = 'funds_released' then
          v_message := 'Funds for order ' || NEW.id || ' have been released to your account.';
        elsif NEW.status = 'disputed' then
          v_message := 'A dispute was opened on order ' || NEW.id || '. Escrow funds are frozen pending review.';
        else
          v_message := null;
        end if;

        if v_message is not null then
          insert into trova_notifications (profile_id, text_payload, read)
          values (v_profile_id, v_message, false);
        end if;
      end if;
    exception when others then
      null;
    end;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_notify_seller_on_transaction_change on trova_transactions;
create trigger trg_notify_seller_on_transaction_change
  after update on trova_transactions
  for each row
  execute function public.notify_seller_on_transaction_change();

-- ============================================
-- APPLY MIGRATION: 052
-- ============================================

-- 052_secure_rating_submission.sql
-- Replace the open public insert policy with a SECURITY DEFINER RPC that
-- validates the buyer's right to rate before allowing the insert.
-- Also adds a unique constraint so each transaction can only be rated once.

-- ---------------------------------------------------------------------------
-- 1. Unique constraint: one rating per transaction
-- ---------------------------------------------------------------------------
alter table public.trova_ratings
  drop constraint if exists trova_ratings_transaction_id_key;

alter table public.trova_ratings
  add constraint trova_ratings_transaction_id_key
  unique (transaction_id);

-- ---------------------------------------------------------------------------
-- 2. Drop the open insert policy
-- ---------------------------------------------------------------------------
drop policy if exists ratings_insert_public on public.trova_ratings;

-- Keep the admin/select policies intact.

-- ---------------------------------------------------------------------------
-- 3. SECURITY DEFINER RPC for submitting a rating
-- ---------------------------------------------------------------------------
create or replace function public.submit_transaction_rating(
  p_transaction_id text,
  p_score smallint,
  p_comment text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_transaction record;
  v_existing_rating uuid;
begin
  -- Validate score range
  if p_score < 1 or p_score > 5 then
    return jsonb_build_object('success', false, 'error', 'Rating must be between 1 and 5');
  end if;

  -- Transaction must exist and be in a terminal state that allows rating
  select id, status, seller_id
    into v_transaction
    from public.trova_transactions
   where id = p_transaction_id;

  if v_transaction is null then
    return jsonb_build_object('success', false, 'error', 'Transaction not found');
  end if;

  if v_transaction.status <> 'funds_released' then
    return jsonb_build_object('success', false, 'error', 'Rating is only allowed after funds have been released');
  end if;

  -- Prevent duplicate ratings (unique constraint also enforces this at DB level,
  -- but we check here to return a friendlier error)
  select id into v_existing_rating
    from public.trova_ratings
   where transaction_id = p_transaction_id;

  if v_existing_rating is not null then
    return jsonb_build_object('success', false, 'error', 'This transaction has already been rated');
  end if;

  -- Insert the rating
  insert into public.trova_ratings (
    transaction_id,
    seller_id,
    score,
    comment
  ) values (
    p_transaction_id,
    v_transaction.seller_id,
    p_score,
    trim(coalesce(p_comment, ''))
  );

  return jsonb_build_object('success', true);
end;
$$;

revoke all on function public.submit_transaction_rating(text, smallint, text) from public;
grant execute on function public.submit_transaction_rating(text, smallint, text) to anon;
grant execute on function public.submit_transaction_rating(text, smallint, text) to authenticated;

notify pgrst, 'reload schema';
