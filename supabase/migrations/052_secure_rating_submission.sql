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
