-- ==============================================================================
-- DATABASE SCHEMA: VIETQR LEAD HUNTER (Scrap.io Clean-Room Clone for Vietnam)
-- Stack: PostgreSQL 15+ (Supabase / Neon)
-- ==============================================================================

-- 1. Bảng Người dùng (Tài khoản & Hạn mức Credits)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  full_name TEXT,
  plan_tier TEXT NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'starter', 'pro', 'business')),
  credits_balance INT NOT NULL DEFAULT 50 CHECK (credits_balance >= 0),
  credits_reset_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Bảng Cơ sở kinh doanh (Pre-indexed Google Maps Lead Cache)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id TEXT UNIQUE NOT NULL, -- Google Place ID duy nhất chống trùng lặp
  name TEXT NOT NULL,
  category TEXT NOT NULL,         -- 'spa', 'dental', 'salon', 'clinic', 'restaurant'...
  category_label TEXT,           -- Tên tiếng Việt hiển thị
  phone TEXT,                    -- Số hotline hiển thị
  phone_standard TEXT,           -- Chuẩn E.164: +84908401994
  phone_type TEXT DEFAULT 'none' CHECK (phone_type IN ('mobile', 'landline', 'none')),
  address TEXT NOT NULL,
  street TEXT,
  ward TEXT,
  district TEXT,
  city TEXT NOT NULL,            -- Hà Nội, TP. Hồ Chí Minh, Đà Nẵng...
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  plus_code TEXT,
  google_rating NUMERIC(2, 1) DEFAULT 5.0,
  reviews_count INT DEFAULT 0,
  google_maps_url TEXT NOT NULL,
  website TEXT,
  has_website BOOLEAN DEFAULT FALSE,
  is_https BOOLEAN DEFAULT FALSE,
  website_status INT DEFAULT 0,  -- 200 (OK), 404, 0 (None), -1 (Timeout)
  facebook_url TEXT,
  instagram_url TEXT,
  opening_hours JSONB DEFAULT '{}'::jsonb,
  operational_status TEXT DEFAULT 'OPERATIONAL',
  raw_data JSONB DEFAULT '{}'::jsonb,
  last_crawled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_city ON leads(city);
CREATE INDEX IF NOT EXISTS idx_leads_category ON leads(category);
CREATE INDEX IF NOT EXISTS idx_leads_phone_type ON leads(phone_type);
CREATE INDEX IF NOT EXISTS idx_leads_has_website ON leads(has_website);
CREATE INDEX IF NOT EXISTS idx_leads_rating ON leads(google_rating);
CREATE INDEX IF NOT EXISTS idx_leads_lat_lng ON leads(latitude, longitude);

-- 3. Bảng Lịch sử Tìm kiếm (Search Caching & Analytics)
CREATE TABLE IF NOT EXISTS search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  keyword TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  radius_km INT DEFAULT 10,
  total_results_found INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Bảng Lịch sử Xuất Dữ liệu & Trừ Credits (30-day Deduplication Protection)
CREATE TABLE IF NOT EXISTS user_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  export_name TEXT NOT NULL,
  leads_count INT NOT NULL,
  credits_spent INT NOT NULL,
  file_format TEXT NOT NULL DEFAULT 'xlsx' CHECK (file_format IN ('xlsx', 'csv')),
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_exported_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  export_id UUID REFERENCES user_exports(id) ON DELETE SET NULL,
  exported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lead_id) -- Chống trừ tiền trùng: Mỗi tiệm chỉ trừ credit 1 lần / user
);

CREATE INDEX IF NOT EXISTS idx_exported_leads_user_lead ON user_exported_leads(user_id, lead_id);

-- 5. Bảng Mini-CRM Lead Pipeline (Kanban Board)
CREATE TABLE IF NOT EXISTS lead_pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  stage TEXT NOT NULL DEFAULT 'new' CHECK (stage IN ('new', 'contacted', 'interested', 'won', 'lost')),
  notes TEXT,
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lead_id)
);

CREATE INDEX IF NOT EXISTS idx_pipeline_user_stage ON lead_pipeline(user_id, stage);

-- 6. Bảng Giao dịch Thanh toán Tự động VietQR (SePAY / PayOS)
CREATE TABLE IF NOT EXISTS billing_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_tier TEXT NOT NULL,
  amount INT NOT NULL,           -- 199000, 499000, 999000 VND
  credits_awarded INT NOT NULL,  -- 1000, 5000, 999999
  payment_code TEXT UNIQUE NOT NULL, -- Nội dung chuyển khoản định danh (vd: VQLH1079)
  gateway TEXT NOT NULL DEFAULT 'sepay' CHECK (gateway IN ('sepay', 'payos')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired')),
  transaction_ref TEXT,          -- Mã tham chiếu ngân hàng
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_payment_code ON billing_transactions(payment_code);
