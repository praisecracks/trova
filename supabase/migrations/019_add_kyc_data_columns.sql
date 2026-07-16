-- 019_add_kyc_data_columns.sql
-- Add missing KYC data columns to trova_kyc_applications table to store actual submitted data

alter table trova_kyc_applications
  add column if not exists full_name text,
  add column if not exists phone text,
  add column if not exists id_type text,
  add column if not exists id_number text,
  add column if not exists date_of_birth date,
  add column if not exists business_name text,
  add column if not exists city text,
  add column if not exists state_region text,
  add column if not exists country text,
  add column if not exists street_address text,
  add column if not exists uploaded_id_file_name text,
  add column if not exists uploaded_id_file_url text;
