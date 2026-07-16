-- 022_add_kyc_tracking_to_profiles.sql
-- Add KYC tracking columns to trova_profiles

alter table trova_profiles
  add column if not exists kyc_submitted_at timestamptz,
  add column if not exists kyc_approved_at timestamptz,
  add column if not exists kyc_rejection_reason text;
