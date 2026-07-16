-- 032_add_referral_rating_indexes.sql
-- Add indexes to speed up public storefront referral/rating aggregation queries.
-- These indexes support the correlated subqueries in get_public_storefront_by_handle().

-- Referrals: lookups by referrer seller ID + status
create index if not exists idx_trova_referrals_referrer_seller_id
  on trova_referrals(referrer_seller_id);

create index if not exists idx_trova_referrals_referrer_seller_id_status
  on trova_referrals(referrer_seller_id, status);

-- Ratings: lookups via joined transactions
create index if not exists idx_trova_ratings_transaction_id
  on trova_ratings(transaction_id);

-- Transactions: seller lookups for rating aggregation
create index if not exists idx_trova_transactions_seller_id
  on trova_transactions(seller_id);
