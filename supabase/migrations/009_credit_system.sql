-- ============================================================
-- Migration 009: Credit System
-- Adds credit_cost to workflows + credits_used to executions
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Add credit_cost column to workflows
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS credit_cost INT NOT NULL DEFAULT 1;

-- 2. Set costs: complex multi-output workflows = 2, simple single-output = 1
UPDATE workflows SET credit_cost = 2 WHERE key IN ('weekly_social', 'brand_strategy', 'competitor_ad');
-- product_launch, brand_trust, kol_script, flash_sale remain at default 1

-- 3. Add credits_used snapshot to executions (records cost at time of run)
ALTER TABLE executions ADD COLUMN IF NOT EXISTS credits_used INT NOT NULL DEFAULT 1;
