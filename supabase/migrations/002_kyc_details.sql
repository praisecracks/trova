-- 002_kyc_details.sql
-- Add KYC details column to trova_kyc_applications

ALTER TABLE trova_kyc_applications
ADD COLUMN IF NOT EXISTS kyc_data JSONB;

-- Add support for storing ID files or other attachments if needed
