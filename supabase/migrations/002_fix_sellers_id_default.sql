-- 002_fix_sellers_id_default.sql
-- Ensure trova_sellers.id has a default UUID generator

create extension if not exists "pgcrypto";

alter table trova_sellers alter column id set default gen_random_uuid();
