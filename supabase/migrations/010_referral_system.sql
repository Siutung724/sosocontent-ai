-- Migration 010: Referral System
-- Run in Supabase SQL Editor

-- 0. Ensure user_plans table exists (from migration 004)
CREATE TABLE IF NOT EXISTS user_plans (
  user_id              UUID        PRIMARY KEY,
  plan                 TEXT        NOT NULL DEFAULT 'free',
  stripe_customer_id   TEXT,
  current_period_end   TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_plans' AND policyname = 'Users can view own plan'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view own plan" ON user_plans FOR SELECT USING (auth.uid() = user_id)';
  END IF;
END $$;

-- 1. Add bonus_credits + referral_code to user_plans
ALTER TABLE user_plans
  ADD COLUMN IF NOT EXISTS bonus_credits  INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_code  CHAR(8);

-- Fill referral codes for existing rows (first 8 chars of user_id, uppercase)
UPDATE user_plans
SET referral_code = UPPER(SUBSTRING(user_id::text, 1, 8))
WHERE referral_code IS NULL;

-- Make referral_code unique (needed for lookup)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_plans_referral_code_key'
  ) THEN
    ALTER TABLE user_plans ADD CONSTRAINT user_plans_referral_code_key UNIQUE (referral_code);
  END IF;
END $$;

-- 2. Referrals tracking table
CREATE TABLE IF NOT EXISTS referrals (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id  UUID        NOT NULL,
  referee_id   UUID        NOT NULL,
  bonus_amount INT         NOT NULL DEFAULT 500,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(referee_id)   -- each person can only be referred once
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'referrals' AND policyname = 'Users can view their own referrals'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view their own referrals" ON referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id)';
  END IF;
END $$;

-- 3. Function: ensure user_plans row exists on first login
CREATE OR REPLACE FUNCTION ensure_user_plan(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_plans (user_id, plan, referral_code, bonus_credits)
  VALUES (
    p_user_id,
    'free',
    UPPER(SUBSTRING(p_user_id::text, 1, 8)),
    0
  )
  ON CONFLICT (user_id) DO UPDATE
    SET referral_code = COALESCE(
      user_plans.referral_code,
      UPPER(SUBSTRING(p_user_id::text, 1, 8))
    );
END;
$$;

-- 4. Function: apply referral code (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION apply_referral(p_code TEXT, p_referee_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_bonus       INT := 500;
  v_inserted    BOOL := FALSE;
BEGIN
  -- Find referrer by code
  SELECT user_id INTO v_referrer_id
  FROM user_plans
  WHERE UPPER(referral_code) = UPPER(p_code)
  LIMIT 1;

  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('error', 'invalid_code');
  END IF;

  -- Prevent self-referral
  IF v_referrer_id = p_referee_id THEN
    RETURN jsonb_build_object('error', 'self_referral');
  END IF;

  -- Insert referral record (UNIQUE on referee_id prevents double-claiming)
  BEGIN
    INSERT INTO referrals (referrer_id, referee_id, bonus_amount)
    VALUES (v_referrer_id, p_referee_id, v_bonus);
    v_inserted := TRUE;
  EXCEPTION WHEN unique_violation THEN
    v_inserted := FALSE;
  END;

  IF NOT v_inserted THEN
    RETURN jsonb_build_object('error', 'already_referred');
  END IF;

  -- Ensure referee has a user_plans row, then add bonus
  INSERT INTO user_plans (user_id, plan, referral_code, bonus_credits)
  VALUES (p_referee_id, 'free', UPPER(SUBSTRING(p_referee_id::text, 1, 8)), v_bonus)
  ON CONFLICT (user_id) DO UPDATE
    SET bonus_credits = user_plans.bonus_credits + v_bonus;

  -- Add bonus to referrer
  UPDATE user_plans
  SET bonus_credits = bonus_credits + v_bonus
  WHERE user_id = v_referrer_id;

  RETURN jsonb_build_object('success', true, 'bonus', v_bonus);
END;
$$;
