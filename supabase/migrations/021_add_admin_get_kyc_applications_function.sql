-- 021_add_admin_get_kyc_applications_function.sql
-- Add database function for admins to get all KYC applications

create or replace function public.trova_get_kyc_applications()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_applications jsonb;
begin
  -- Check if user is admin
  if not exists (
    select 1 from trova_profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ) then
    raise exception 'Only admins can view KYC applications' using errcode = 'P0001';
  end if;

  -- Get all KYC applications with seller and profile details
  select jsonb_agg(jsonb_build_object(
    'id', k.id,
    'seller_id', k.seller_id,
    'full_name', k.full_name,
    'phone', k.phone,
    'id_type', k.id_type,
    'id_number', k.id_number,
    'date_of_birth', k.date_of_birth,
    'business_name', k.business_name,
    'city', k.city,
    'state_region', k.state_region,
    'country', k.country,
    'street_address', k.street_address,
    'uploaded_id_file_name', k.uploaded_id_file_name,
    'uploaded_id_file_url', k.uploaded_id_file_url,
    'status', k.status,
    'submitted_at', k.submitted_at,
    'reviewed_at', k.reviewed_at,
    'review_comments', k.review_comments,
    'seller', jsonb_build_object(
      'business_name', s.business_name,
      'profile_id', s.profile_id
    ),
    'profile', jsonb_build_object(
      'email', p.email,
      'display_name', p.display_name
    )
  ))
  into v_applications
  from trova_kyc_applications k
  join trova_sellers s on s.id = k.seller_id
  join trova_profiles p on p.id = s.profile_id
  order by k.submitted_at desc;

  return jsonb_build_object(
    'success', true,
    'applications', coalesce(v_applications, '[]'::jsonb)
  );
exception
  when others then
    raise exception '%', sqlerrm using errcode = coalesce(sqlstate, 'P0099');
end;
$$;

revoke all on function public.trova_get_kyc_applications() from public;
grant execute on function public.trova_get_kyc_applications() to authenticated;
