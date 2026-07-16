-- 020_add_admin_kyc_review_function.sql
-- Add database function for admins to review and update KYC status

create or replace function public.trova_review_kyc_application(
  p_application_id uuid,
  p_new_status text,
  p_review_comments text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
  v_seller_id uuid;
begin
  -- Check if user is admin
  if not exists (
    select 1 from trova_profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ) then
    raise exception 'Only admins can review KYC applications' using errcode = 'P0001';
  end if;

  -- Get seller and profile IDs from the application
  select k.seller_id, s.profile_id
  into v_seller_id, v_profile_id
  from trova_kyc_applications k
  join trova_sellers s on s.id = k.seller_id
  where k.id = p_application_id;

  if v_seller_id is null then
    raise exception 'KYC application not found' using errcode = 'P0002';
  end if;

  -- Update KYC application
  update trova_kyc_applications
  set
    status = p_new_status,
    reviewed_at = now(),
    review_comments = p_review_comments
  where id = p_application_id;

  -- Update profile KYC status
  update trova_profiles
  set
    kyc_status = p_new_status,
    kyc_approved_at = case when p_new_status = 'verified' then now() else null end,
    kyc_rejection_reason = case when p_new_status = 'rejected' then p_review_comments else null end
  where id = v_profile_id;

  -- Add notification for the seller
  insert into trova_notifications (profile_id, text_payload, read)
  values (
    v_profile_id,
    case
      when p_new_status = 'verified' then 'Your KYC application has been approved!'
      when p_new_status = 'rejected' then format('Your KYC application has been rejected: %s', coalesce(p_review_comments, 'No reason provided'))
      when p_new_status = 'reviewing' then 'Your KYC application is now being reviewed'
      else format('Your KYC application status has been updated to: %s', p_new_status)
    end,
    false
  );

  return jsonb_build_object(
    'success', true,
    'message', 'KYC application updated successfully'
  );
exception
  when others then
    raise exception '%', sqlerrm using errcode = coalesce(sqlstate, 'P0099');
end;
$$;

revoke all on function public.trova_review_kyc_application(uuid, text, text) from public;
grant execute on function public.trova_review_kyc_application(uuid, text, text) to authenticated;
