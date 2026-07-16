-- 036_add_vendor_name_to_transactions.sql
-- The trova_create_transaction RPC references vendor_name, but the column
-- was never added to trova_transactions. Add it now so public storefront
-- purchases and dashboard link creation can insert successfully.

alter table trova_transactions
  add column if not exists vendor_name text;

notify pgrst, 'reload schema';
