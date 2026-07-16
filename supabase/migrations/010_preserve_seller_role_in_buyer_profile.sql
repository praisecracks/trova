-- 010_preserve_seller_role_in_buyer_profile.sql
-- Prevents buyer console profile creation from converting seller accounts into buyer-only accounts.

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
    set role = case when role = 'seller' then 'seller' else 'buyer' end,
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

revoke all on function public.trova_get_or_create_buyer_profile() from public;
grant execute on function public.trova_get_or_create_buyer_profile() to authenticated;

notify pgrst, 'reload schema';
