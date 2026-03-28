-- ============================================================
-- WattZup — Full Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. PROFILES
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  location TEXT DEFAULT 'Metro Manila',
  monthly_budget NUMERIC DEFAULT 4000,
  alert_threshold INTEGER DEFAULT 80,
  household_size INTEGER DEFAULT 4,
  notify_energy_alerts BOOLEAN DEFAULT true,
  notify_weekly_reports BOOLEAN DEFAULT true,
  notify_community BOOLEAN DEFAULT false,
  notify_badges BOOLEAN DEFAULT true,
  voice_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. APPLIANCES
CREATE TABLE appliances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  appliance_type TEXT NOT NULL CHECK (appliance_type IN (
    'ac', 'refrigerator', 'electric_fan', 'washing_machine', 'rice_cooker',
    'microwave', 'tv', 'computer', 'water_heater', 'lighting',
    'flat_iron', 'water_dispenser', 'router', 'other'
  )),
  custom_name TEXT,
  wattage NUMERIC NOT NULL,
  quantity INTEGER DEFAULT 1,
  is_always_on BOOLEAN DEFAULT false,
  default_daily_hours NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USAGE LOGS
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  appliance_id UUID NOT NULL REFERENCES appliances(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  hours_used NUMERIC NOT NULL CHECK (hours_used >= 0 AND hours_used <= 24),
  estimated_kwh NUMERIC GENERATED ALWAYS AS (0) STORED,  -- placeholder, computed via trigger
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'voice', 'auto')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(appliance_id, date)
);

-- Trigger to compute estimated_kwh on insert/update
CREATE OR REPLACE FUNCTION compute_estimated_kwh()
RETURNS TRIGGER AS $$
DECLARE
  v_wattage NUMERIC;
  v_quantity INTEGER;
BEGIN
  SELECT wattage, quantity INTO v_wattage, v_quantity
  FROM appliances WHERE id = NEW.appliance_id;
  
  -- We can't use GENERATED ALWAYS with a cross-table ref, so we update via trigger
  NEW.estimated_kwh := (v_wattage * v_quantity * NEW.hours_used) / 1000.0;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the generated column and recreate as regular
ALTER TABLE usage_logs DROP COLUMN estimated_kwh;
ALTER TABLE usage_logs ADD COLUMN estimated_kwh NUMERIC DEFAULT 0;

CREATE TRIGGER trg_compute_kwh
BEFORE INSERT OR UPDATE ON usage_logs
FOR EACH ROW EXECUTE FUNCTION compute_estimated_kwh();

-- 4. ENERGY RATES
CREATE TABLE energy_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT DEFAULT 'Meralco',
  rate_per_kwh NUMERIC NOT NULL,
  effective_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AI INSIGHTS
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('optimization', 'alert', 'achievement', 'forecast')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  potential_savings NUMERIC,
  is_read BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ACHIEVEMENTS
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL CHECK (badge_type IN (
    'first_week_under_budget', 'seven_day_streak', 'thirty_day_streak',
    'off_peak_hero', 'carbon_neutral', 'master_saver', '500kwh_saved', 'community_champion'
  )),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

-- 7. COMMUNITY TEAMS
CREATE TABLE community_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  region TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TEAM MEMBERS
CREATE TABLE team_members (
  team_id UUID NOT NULL REFERENCES community_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

-- 9. CHALLENGES
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  team_a_id UUID NOT NULL REFERENCES community_teams(id),
  team_b_id UUID NOT NULL REFERENCES community_teams(id),
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appliances ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- Profiles: users manage their own
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Appliances: users manage their own
CREATE POLICY "Users can view own appliances" ON appliances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own appliances" ON appliances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own appliances" ON appliances FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own appliances" ON appliances FOR DELETE USING (auth.uid() = user_id);

-- Usage logs: users manage their own
CREATE POLICY "Users can view own usage logs" ON usage_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage logs" ON usage_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own usage logs" ON usage_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own usage logs" ON usage_logs FOR DELETE USING (auth.uid() = user_id);

-- Energy rates: read-only for authenticated users
CREATE POLICY "Authenticated can view rates" ON energy_rates FOR SELECT TO authenticated USING (true);

-- AI Insights: users manage their own
CREATE POLICY "Users can view own insights" ON ai_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own insights" ON ai_insights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own insights" ON ai_insights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own insights" ON ai_insights FOR DELETE USING (auth.uid() = user_id);

-- Achievements: users can view own
CREATE POLICY "Users can view own achievements" ON achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Community teams: all authenticated can read
CREATE POLICY "Anyone can view teams" ON community_teams FOR SELECT TO authenticated USING (true);

-- Team members: all authenticated can read, users can manage own membership
CREATE POLICY "Anyone can view team members" ON team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join teams" ON team_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave teams" ON team_members FOR DELETE USING (auth.uid() = user_id);

-- Challenges: all authenticated can read
CREATE POLICY "Anyone can view challenges" ON challenges FOR SELECT TO authenticated USING (true);

-- ============================================================
-- DEFAULT WATTAGE FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION get_default_wattage(p_type TEXT)
RETURNS TABLE(wattage NUMERIC, default_hours NUMERIC, is_always_on BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT w, h, ao FROM (VALUES
    ('ac',              1119::NUMERIC, 8::NUMERIC,    false),
    ('refrigerator',    150::NUMERIC,  24::NUMERIC,   true),
    ('electric_fan',    75::NUMERIC,   10::NUMERIC,   false),
    ('washing_machine', 500::NUMERIC,  1::NUMERIC,    false),
    ('rice_cooker',     800::NUMERIC,  1::NUMERIC,    false),
    ('microwave',       1000::NUMERIC, 0.5::NUMERIC,  false),
    ('tv',              100::NUMERIC,  5::NUMERIC,    false),
    ('computer',        200::NUMERIC,  6::NUMERIC,    false),
    ('water_heater',    1500::NUMERIC, 0.5::NUMERIC,  false),
    ('lighting',        10::NUMERIC,   8::NUMERIC,    false),
    ('flat_iron',       1000::NUMERIC, 0.5::NUMERIC,  false),
    ('water_dispenser', 100::NUMERIC,  24::NUMERIC,   true),
    ('router',          12::NUMERIC,   24::NUMERIC,   true),
    ('other',           100::NUMERIC,  1::NUMERIC,    false)
  ) AS t(type_name, w, h, ao)
  WHERE type_name = p_type;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- HANDLE NEW USER TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_appliance JSONB;
  v_type TEXT;
  v_wattage NUMERIC;
  v_hours NUMERIC;
  v_always_on BOOLEAN;
  v_type_map JSONB := '{
    "fridge": "refrigerator",
    "ac": "ac",
    "washer": "washing_machine",
    "tv": "tv",
    "microwave": "microwave",
    "computer": "computer",
    "lights": "lighting",
    "lighting": "lighting",
    "electric_fan": "electric_fan",
    "rice_cooker": "rice_cooker",
    "water_heater": "water_heater",
    "flat_iron": "flat_iron",
    "water_dispenser": "water_dispenser",
    "router": "router"
  }'::JSONB;
BEGIN
  -- Create profile
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  );

  -- Migrate appliances from user_metadata
  IF NEW.raw_user_meta_data->'appliances' IS NOT NULL THEN
    FOR v_appliance IN SELECT * FROM jsonb_array_elements(NEW.raw_user_meta_data->'appliances')
    LOOP
      -- Map the signup ID to our appliance_type enum
      v_type := COALESCE(
        v_type_map->>( v_appliance->>'id' ),
        'other'
      );

      SELECT dw.wattage, dw.default_hours, dw.is_always_on
      INTO v_wattage, v_hours, v_always_on
      FROM get_default_wattage(v_type) dw;

      INSERT INTO appliances (user_id, appliance_type, custom_name, wattage, quantity, is_always_on, default_daily_hours)
      VALUES (
        NEW.id,
        v_type,
        COALESCE(v_appliance->>'name', v_type),
        COALESCE(v_wattage, 100),
        COALESCE((v_appliance->>'quantity')::INTEGER, 1),
        COALESCE(v_always_on, false),
        COALESCE(v_hours, 1)
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- DATABASE FUNCTIONS
-- ============================================================

-- Monthly summary for a user
CREATE OR REPLACE FUNCTION get_user_monthly_summary(p_user_id UUID, p_month DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
  total_kwh NUMERIC,
  total_cost NUMERIC,
  projected_bill NUMERIC,
  budget_remaining NUMERIC,
  daily_avg_cost NUMERIC
) AS $$
DECLARE
  v_rate NUMERIC;
  v_budget NUMERIC;
  v_month_start DATE;
  v_month_end DATE;
  v_days_elapsed INTEGER;
  v_days_in_month INTEGER;
  v_total_kwh NUMERIC;
  v_total_cost NUMERIC;
  v_daily_avg NUMERIC;
  v_projected NUMERIC;
BEGIN
  v_month_start := date_trunc('month', p_month)::DATE;
  v_month_end := (date_trunc('month', p_month) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  v_days_in_month := EXTRACT(DAY FROM v_month_end);
  v_days_elapsed := GREATEST(EXTRACT(DAY FROM LEAST(CURRENT_DATE, v_month_end)) - EXTRACT(DAY FROM v_month_start) + 1, 1);

  SELECT COALESCE(er.rate_per_kwh, 11.8569) INTO v_rate
  FROM energy_rates er ORDER BY er.effective_date DESC LIMIT 1;

  SELECT COALESCE(p.monthly_budget, 4000) INTO v_budget
  FROM profiles p WHERE p.id = p_user_id;

  SELECT COALESCE(SUM(ul.estimated_kwh), 0) INTO v_total_kwh
  FROM usage_logs ul
  WHERE ul.user_id = p_user_id
    AND ul.date >= v_month_start
    AND ul.date <= v_month_end;

  v_total_cost := v_total_kwh * v_rate;
  v_daily_avg := v_total_cost / v_days_elapsed;
  v_projected := v_daily_avg * v_days_in_month;

  RETURN QUERY SELECT
    ROUND(v_total_kwh, 2),
    ROUND(v_total_cost, 2),
    ROUND(v_projected, 2),
    ROUND(v_budget - v_total_cost, 2),
    ROUND(v_daily_avg, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Leaderboard: top savers by estimated savings percentage
CREATE OR REPLACE FUNCTION get_leaderboard(p_limit INTEGER DEFAULT 10)
RETURNS TABLE(
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  savings_percent NUMERIC,
  total_kwh NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH monthly AS (
    SELECT
      ul.user_id,
      SUM(ul.estimated_kwh) AS total_kwh
    FROM usage_logs ul
    WHERE ul.date >= date_trunc('month', CURRENT_DATE)::DATE
    GROUP BY ul.user_id
  ),
  with_budget AS (
    SELECT
      m.user_id,
      m.total_kwh,
      p.monthly_budget,
      p.full_name,
      p.avatar_url,
      CASE
        WHEN p.monthly_budget > 0 THEN
          ROUND(GREATEST(0, (1 - (m.total_kwh * (SELECT COALESCE(er.rate_per_kwh, 11.8569) FROM energy_rates er ORDER BY er.effective_date DESC LIMIT 1)) / p.monthly_budget)) * 100, 1)
        ELSE 0
      END AS savings_pct
    FROM monthly m
    JOIN profiles p ON p.id = m.user_id
  )
  SELECT wb.user_id, wb.full_name, wb.avatar_url, wb.savings_pct, wb.total_kwh
  FROM with_budget wb
  ORDER BY wb.savings_pct DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Team challenge stats
CREATE OR REPLACE FUNCTION get_team_challenge_stats(p_challenge_id UUID)
RETURNS TABLE(
  team_id UUID,
  team_name TEXT,
  total_kwh_reduced NUMERIC,
  member_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH challenge_teams AS (
    SELECT c.team_a_id AS tid FROM challenges c WHERE c.id = p_challenge_id
    UNION ALL
    SELECT c.team_b_id AS tid FROM challenges c WHERE c.id = p_challenge_id
  ),
  team_usage AS (
    SELECT
      ct.tid,
      COALESCE(SUM(ul.estimated_kwh), 0) AS total_kwh
    FROM challenge_teams ct
    JOIN team_members tm ON tm.team_id = ct.tid
    LEFT JOIN usage_logs ul ON ul.user_id = tm.user_id
      AND ul.date >= (SELECT c.start_date FROM challenges c WHERE c.id = p_challenge_id)
      AND ul.date <= (SELECT c.end_date FROM challenges c WHERE c.id = p_challenge_id)
    GROUP BY ct.tid
  )
  SELECT
    tu.tid,
    cteam.name,
    tu.total_kwh,
    (SELECT COUNT(*) FROM team_members tmm WHERE tmm.team_id = tu.tid)
  FROM team_usage tu
  JOIN community_teams cteam ON cteam.id = tu.tid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_appliances_updated_at BEFORE UPDATE ON appliances FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SEED DATA
-- ============================================================

-- Current Meralco rate
INSERT INTO energy_rates (provider, rate_per_kwh, effective_date)
VALUES ('Meralco', 11.8569, '2025-01-01');

-- Community teams
INSERT INTO community_teams (name, region) VALUES
  ('Team Quezon City', 'NCR'),
  ('Team Makati', 'NCR'),
  ('Team Cavite', 'Region IV-A'),
  ('Team Taguig', 'NCR'),
  ('Team Pasig', 'NCR'),
  ('Team Mandaluyong', 'NCR'),
  ('Team Marikina', 'NCR');

-- Sample challenge
INSERT INTO challenges (title, team_a_id, team_b_id, start_date, end_date, is_active)
SELECT
  'Regional Power Duel',
  (SELECT id FROM community_teams WHERE name = 'Team Cavite'),
  (SELECT id FROM community_teams WHERE name = 'Team Quezon City'),
  CURRENT_DATE - INTERVAL '15 days',
  CURRENT_DATE + INTERVAL '15 days',
  true;
