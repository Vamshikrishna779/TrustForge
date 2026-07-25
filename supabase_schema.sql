-- ===============================================================
-- TRUSTFORGE SUPABASE MASTER DATABASE SETUP (FULL CRUD + REALTIME)
-- ===============================================================

-- 1. COMMUNITY REPORTS TABLE
CREATE TABLE IF NOT EXISTS community_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  evidence_url TEXT,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  author_name TEXT DEFAULT 'Anonymous Candidate',
  ai_verified BOOLEAN DEFAULT FALSE,
  ai_confidence INTEGER DEFAULT 90,
  ai_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for community_reports
ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON community_reports;
DROP POLICY IF EXISTS "Allow public insert access" ON community_reports;
DROP POLICY IF EXISTS "Allow public update access" ON community_reports;
DROP POLICY IF EXISTS "Allow public delete access" ON community_reports;
DROP POLICY IF EXISTS "Allow public full CRUD access" ON community_reports;

CREATE POLICY "Allow public full CRUD access" ON community_reports FOR ALL USING (true) WITH CHECK (true);


-- 2. USER PLANS TABLE
CREATE TABLE IF NOT EXISTS user_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free',
  email TEXT,
  display_name TEXT,
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  plan_activated_at TIMESTAMPTZ DEFAULT NOW(),
  plan_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure additional columns exist if table was previously created
ALTER TABLE user_plans
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;

-- Enable RLS for user_plans
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow service and user access to plans" ON user_plans;
DROP POLICY IF EXISTS "Allow public full CRUD access to plans" ON user_plans;

CREATE POLICY "Allow public full CRUD access to plans" ON user_plans FOR ALL USING (true) WITH CHECK (true);


-- 3. CLOUD SCAN REPORTS TABLE (Pro Cloud Backup)
CREATE TABLE IF NOT EXISTS cloud_scan_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  input_data TEXT,
  trust_score INTEGER NOT NULL,
  ai_summary TEXT,
  analysis_details JSONB,
  recommendations JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for cloud_scan_reports
ALTER TABLE cloud_scan_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow service and owner access to cloud reports" ON cloud_scan_reports;
DROP POLICY IF EXISTS "Allow public full CRUD access to cloud reports" ON cloud_scan_reports;

CREATE POLICY "Allow public full CRUD access to cloud reports" ON cloud_scan_reports FOR ALL USING (true) WITH CHECK (true);


-- 4. USER NOTIFICATIONS TABLE (Admin Notifications, Welcome & In-App Alerts)
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_email TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT DEFAULT 'admin_alert',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was previously created
ALTER TABLE user_notifications
  ALTER COLUMN user_id TYPE TEXT,
  ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Enable RLS for user_notifications
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public full CRUD access to notifications" ON user_notifications;
CREATE POLICY "Allow public full CRUD access to notifications" ON user_notifications FOR ALL USING (true) WITH CHECK (true);


-- 5. SAFE REALTIME ENABLING FOR ALL TABLES (No duplicate errors)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE community_reports;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_plans;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE cloud_scan_reports;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_notifications;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;
