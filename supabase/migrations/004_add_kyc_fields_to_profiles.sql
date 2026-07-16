alter table trova_profiles 
  add column if not exists kyc_status text default 'unverified' 
    check (kyc_status in ('unverified', 'pending', 'verified', 'rejected')),
  add column if not exists kyc_rejection_reason text,
  add column if not exists kyc_submitted_at timestamptz,
  add column if not exists kyc_approved_at timestamptz;
