-- Relational database setup migrations for TrustLink.ng PostgreSQL Schema
-- Authorized by FinTech Escrow Systems Architect

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Vendors table
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name VARCHAR(255) NOT NULL,
    bank_routing_code VARCHAR(50) NOT NULL,
    target_account_number VARCHAR(20) NOT NULL,
    store_username VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    secure_hash VARCHAR(255) UNIQUE NOT NULL,
    merchant_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    valuation_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    shipping_fee NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    current_state VARCHAR(50) NOT NULL DEFAULT 'pending_deposit', -- 'pending_deposit', 'secured_vault', 'dispatched', 'disputed', 'settled'
    lock_expiration TIMESTAMP WITH TIME ZONE NULL,
    entry_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Chat logs table
CREATE TABLE IF NOT EXISTS chat_logs (
    id SERIAL PRIMARY KEY,
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    text_payload TEXT NOT NULL,
    author_role VARCHAR(50) NOT NULL, -- 'buyer', 'merchant', 'support'
    logging_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert demo seeds for merchant evaluation
INSERT INTO vendors (id, business_name, bank_routing_code, target_account_number, store_username)
VALUES (
    'd8a39cbd-46af-4384-82ee-6745582f3ef7', 
    'VoltKicks Nigeria', 
    '058', -- GTBank Routing Code
    '0123456789', 
    'voltkicks'
) ON CONFLICT (store_username) DO NOTHING;
