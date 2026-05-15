-- ============================================================
--  Smart Money — Supabase PostgreSQL Schema
--  Dùng cho frontend React + Netlify / backend Supabase
-- ============================================================

-- Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Organizations (nhóm / đơn vị) ───────────────────────────────────────────
CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Profiles (người dùng) ───────────────────────────────────────────────────
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  full_name       TEXT,
  avatar_url      TEXT,
  role            TEXT DEFAULT 'member'
                    CHECK (role IN ('admin', 'treasurer', 'member', 'viewer')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── Categories (danh mục thu / chi) ────────────────────────────────────────
CREATE TABLE categories (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code            TEXT NOT NULL,
  name            TEXT NOT NULL,
  name_en         TEXT,
  type            TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color           TEXT DEFAULT '#64748B',
  icon            TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, code)
);

-- ── Members (thành viên đóng quỹ) ──────────────────────────────────────────
CREATE TABLE members (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code            TEXT NOT NULL,
  name            TEXT NOT NULL,
  monthly_due     NUMERIC(15,2) DEFAULT 0,
  profile_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, code)
);

-- ── Fund Accounts (tài khoản quỹ) ──────────────────────────────────────────
CREATE TABLE fund_accounts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  initial_balance NUMERIC(15,2) DEFAULT 0,
  currency        TEXT DEFAULT 'VND',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Transactions (giao dịch) ────────────────────────────────────────────────
CREATE TABLE transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount          NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
  member_id       UUID REFERENCES members(id) ON DELETE SET NULL,
  fund_account_id UUID REFERENCES fund_accounts(id) ON DELETE SET NULL,
  recipient_name  TEXT,
  note            TEXT,
  attachment_url  TEXT,           -- Supabase Storage URL
  created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes cho hiệu năng
CREATE INDEX idx_tx_org      ON transactions(organization_id);
CREATE INDEX idx_tx_date     ON transactions(date DESC);
CREATE INDEX idx_tx_type     ON transactions(type);
CREATE INDEX idx_tx_category ON transactions(category_id);
CREATE INDEX idx_tx_member   ON transactions(member_id);
CREATE INDEX idx_tx_fund     ON transactions(fund_account_id);

-- ── Budgets (ngân sách theo danh mục / tháng) ───────────────────────────────
CREATE TABLE budgets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category_id     UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  month           SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year            SMALLINT NOT NULL,
  amount          NUMERIC(15,2) NOT NULL CHECK (amount >= 0),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, category_id, month, year)
);

-- ── Recurring Transactions (giao dịch định kỳ) ─────────────────────────────
CREATE TABLE recurring_transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  frequency       TEXT NOT NULL CHECK (frequency IN ('monthly','quarterly','yearly')),
  day_of_month    SMALLINT NOT NULL CHECK (day_of_month BETWEEN 1 AND 28),
  type            TEXT NOT NULL CHECK (type IN ('income','expense')),
  amount          NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
  member_id       UUID REFERENCES members(id) ON DELETE SET NULL,
  is_active       BOOLEAN DEFAULT TRUE,
  last_run_date   DATE,
  next_run_date   DATE NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Settings (cài đặt tổ chức) ──────────────────────────────────────────────
CREATE TABLE org_settings (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  default_currency TEXT DEFAULT 'VND',
  language         TEXT DEFAULT 'vi',
  fiscal_year_start SMALLINT DEFAULT 1,  -- tháng bắt đầu năm tài chính
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Audit Log (lịch sử thay đổi) ───────────────────────────────────────────
CREATE TABLE audit_log (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id       UUID REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  table_name   TEXT NOT NULL,
  record_id    UUID NOT NULL,
  action       TEXT NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  old_data     JSONB,
  new_data     JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
--  ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE organizations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories            ENABLE ROW LEVEL SECURITY;
ALTER TABLE members               ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_accounts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets                ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_settings          ENABLE ROW LEVEL SECURITY;

-- Helper: lấy organization_id của user đang đăng nhập
CREATE OR REPLACE FUNCTION auth.org_id()
RETURNS UUID LANGUAGE sql STABLE AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Helper: lấy role của user đang đăng nhập
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- Profiles: mỗi user chỉ thấy profile của mình + cùng tổ chức
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (id = auth.uid() OR organization_id = auth.org_id());

CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Tất cả bảng còn lại: chỉ thấy dữ liệu cùng tổ chức
CREATE POLICY "org_select" ON categories          FOR SELECT USING (organization_id = auth.org_id());
CREATE POLICY "org_select" ON members             FOR SELECT USING (organization_id = auth.org_id());
CREATE POLICY "org_select" ON fund_accounts       FOR SELECT USING (organization_id = auth.org_id());
CREATE POLICY "org_select" ON transactions        FOR SELECT USING (organization_id = auth.org_id());
CREATE POLICY "org_select" ON budgets             FOR SELECT USING (organization_id = auth.org_id());
CREATE POLICY "org_select" ON recurring_transactions FOR SELECT USING (organization_id = auth.org_id());
CREATE POLICY "org_select" ON org_settings        FOR SELECT USING (organization_id = auth.org_id());

-- Chỉ admin / treasurer được INSERT/UPDATE/DELETE
CREATE POLICY "write_policy" ON transactions FOR ALL
  USING (organization_id = auth.org_id())
  WITH CHECK (auth.user_role() IN ('admin','treasurer'));

CREATE POLICY "write_policy" ON categories FOR ALL
  USING (organization_id = auth.org_id())
  WITH CHECK (auth.user_role() IN ('admin','treasurer'));

CREATE POLICY "write_policy" ON members FOR ALL
  USING (organization_id = auth.org_id())
  WITH CHECK (auth.user_role() IN ('admin','treasurer'));

CREATE POLICY "write_policy" ON budgets FOR ALL
  USING (organization_id = auth.org_id())
  WITH CHECK (auth.user_role() IN ('admin','treasurer'));

CREATE POLICY "write_policy" ON recurring_transactions FOR ALL
  USING (organization_id = auth.org_id())
  WITH CHECK (auth.user_role() IN ('admin','treasurer'));

-- ============================================================
--  USEFUL VIEWS
-- ============================================================

-- Tổng hợp giao dịch theo tháng
CREATE VIEW v_monthly_summary AS
SELECT
  organization_id,
  DATE_TRUNC('month', date) AS month,
  SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) AS total_income,
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense,
  SUM(CASE WHEN type = 'income'  THEN amount
           WHEN type = 'expense' THEN -amount ELSE 0 END) AS net_balance,
  COUNT(*) AS tx_count
FROM transactions
GROUP BY organization_id, DATE_TRUNC('month', date);

-- Tình hình nộp quỹ thành viên (năm hiện tại)
CREATE VIEW v_member_payment_status AS
SELECT
  m.id,
  m.organization_id,
  m.code,
  m.name,
  m.monthly_due,
  COALESCE(SUM(t.amount), 0) AS total_paid,
  m.monthly_due * EXTRACT(MONTH FROM NOW()) AS total_due,
  m.monthly_due * EXTRACT(MONTH FROM NOW()) - COALESCE(SUM(t.amount), 0) AS balance
FROM members m
LEFT JOIN transactions t
  ON t.member_id = m.id
  AND t.type = 'income'
  AND EXTRACT(YEAR FROM t.date) = EXTRACT(YEAR FROM NOW())
GROUP BY m.id, m.organization_id, m.code, m.name, m.monthly_due;

-- Số dư các quỹ
CREATE VIEW v_fund_balances AS
SELECT
  f.id,
  f.organization_id,
  f.name,
  f.initial_balance,
  COALESCE(SUM(CASE WHEN t.type = 'income'  THEN t.amount ELSE 0 END), 0) AS total_income,
  COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS total_expense,
  f.initial_balance
    + COALESCE(SUM(CASE WHEN t.type = 'income'  THEN t.amount ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS balance
FROM fund_accounts f
LEFT JOIN transactions t ON t.fund_account_id = f.id
GROUP BY f.id, f.organization_id, f.name, f.initial_balance;

-- ============================================================
--  STORAGE (Supabase Storage buckets)
-- ============================================================
-- Tạo bucket 'attachments' trong Supabase Dashboard > Storage
-- INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', false);
-- Policy: authenticated users cùng tổ chức được upload/download

-- ============================================================
--  SAMPLE DATA (seed cho demo / development)
-- ============================================================
-- INSERT INTO organizations (id, name, slug) VALUES (uuid_generate_v4(), 'Công ty ABC', 'abc-corp');
-- (Thêm categories, members, fund_accounts, transactions...)

-- ============================================================
--  APPROVAL REQUESTS (Yêu cầu phê duyệt)
-- ============================================================
CREATE TABLE approval_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  req_by          UUID REFERENCES members(id) ON DELETE CASCADE,
  amount          NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
  description     TEXT NOT NULL,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  req_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  attach_url      TEXT,
  note            TEXT,
  approved_date   DATE,
  approver_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_select" ON approval_requests FOR SELECT USING (organization_id = auth.org_id());
CREATE POLICY "write_policy" ON approval_requests FOR ALL USING (organization_id = auth.org_id()) WITH CHECK (auth.user_role() IN ('admin','treasurer'));

-- ============================================================
--  PERSONAL FINANCE (Tài chính cá nhân)
-- ============================================================
CREATE TABLE personal_wallets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('cash', 'atm', 'credit')),
  balance         NUMERIC(15,2) DEFAULT 0,
  credit_limit    NUMERIC(15,2),
  color           TEXT DEFAULT '#059669',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE personal_categories (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_key       TEXT NOT NULL CHECK (group_key IN ('fixed', 'daily', 'lifestyle', 'others')),
  name            TEXT NOT NULL,
  color           TEXT DEFAULT '#7C3AED',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE personal_transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  amount          NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  category_id     UUID REFERENCES personal_categories(id) ON DELETE SET NULL,
  wallet_id       UUID REFERENCES personal_wallets(id) ON DELETE SET NULL,
  note            TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE personal_budgets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  monthly_total   NUMERIC(15,2) DEFAULT 0,
  fixed_limit     NUMERIC(15,2) DEFAULT 0,
  daily_limit     NUMERIC(15,2) DEFAULT 0,
  lifestyle_limit NUMERIC(15,2) DEFAULT 0,
  others_limit    NUMERIC(15,2) DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (profile_id)
);

CREATE TABLE personal_salary (
  profile_id      UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  monthly_salary  NUMERIC(15,2) DEFAULT 0,
  salary_day      SMALLINT DEFAULT 1 CHECK (salary_day BETWEEN 1 AND 31),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- RLS cho Personal Finance
ALTER TABLE personal_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_salary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "personal_select" ON personal_wallets FOR ALL USING (profile_id = auth.uid());
CREATE POLICY "personal_select" ON personal_categories FOR ALL USING (profile_id = auth.uid());
CREATE POLICY "personal_select" ON personal_transactions FOR ALL USING (profile_id = auth.uid());
CREATE POLICY "personal_select" ON personal_budgets FOR ALL USING (profile_id = auth.uid());
CREATE POLICY "personal_select" ON personal_salary FOR ALL USING (profile_id = auth.uid());

-- ── Savings Goals (Heo đất tiết kiệm) ──────────────────────────────────────
CREATE TABLE savings_goals (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  emoji      TEXT DEFAULT '🎯',
  color      TEXT DEFAULT '#7C3AED',
  target     NUMERIC(15,2) NOT NULL CHECK (target > 0),
  saved      NUMERIC(15,2) DEFAULT 0 CHECK (saved >= 0),
  deadline   DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "personal_select" ON savings_goals FOR ALL USING (profile_id = auth.uid());
