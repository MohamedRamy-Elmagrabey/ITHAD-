/* ============================================================
   Supabase Schema – اتحاد شباب الوطن – الإسكندرية
   1. اذهب إلى https://supabase.com
   2. أنشئ مشروع جديد
   3. افتح SQL Editor
   4. الصق هذا الكود واشغله
   ============================================================ */

-- 1. جدول اللجان
CREATE TABLE IF NOT EXISTS committees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'fas fa-circle',
  "shortDesc" TEXT DEFAULT '',
  "fullDesc" TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جدول الأخبار
CREATE TABLE IF NOT EXISTS news (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  "desc" TEXT DEFAULT '',
  date TEXT DEFAULT '',
  img TEXT DEFAULT '',
  "imgPos" TEXT DEFAULT 'center',
  "isNew" BOOLEAN DEFAULT FALSE,
  pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول القيادات
CREATE TABLE IF NOT EXISTS leaders (
  id BIGSERIAL PRIMARY KEY,
  committee_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('president', 'vp')),
  name TEXT DEFAULT '',
  role TEXT DEFAULT '',
  img TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(committee_id, type)
);

-- 4. جدول منسق المحافظة
CREATE TABLE IF NOT EXISTS coordinator (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('president', 'vp')),
  name TEXT DEFAULT '',
  role TEXT DEFAULT '',
  img TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(type)
);

-- 5. Enable Row Level Security (optional but recommended)
ALTER TABLE committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE coordinator ENABLE ROW LEVEL SECURITY;

-- 6. Public read access (anyone can read)
DROP POLICY IF EXISTS "Public read access" ON committees; CREATE POLICY "Public read access" ON committees FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read access" ON news; CREATE POLICY "Public read access" ON news FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read access" ON leaders; CREATE POLICY "Public read access" ON leaders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read access" ON coordinator; CREATE POLICY "Public read access" ON coordinator FOR SELECT USING (true);

-- 7. Insert/update/delete only for authenticated users (admin)
DROP POLICY IF EXISTS "Admin write access" ON committees; CREATE POLICY "Admin write access" ON committees FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Admin update access" ON committees; CREATE POLICY "Admin update access" ON committees FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Admin delete access" ON committees; CREATE POLICY "Admin delete access" ON committees FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin write access" ON news; CREATE POLICY "Admin write access" ON news FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Admin update access" ON news; CREATE POLICY "Admin update access" ON news FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Admin delete access" ON news; CREATE POLICY "Admin delete access" ON news FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin write access" ON leaders; CREATE POLICY "Admin write access" ON leaders FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Admin update access" ON leaders; CREATE POLICY "Admin update access" ON leaders FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Admin delete access" ON leaders; CREATE POLICY "Admin delete access" ON leaders FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin write access" ON coordinator; CREATE POLICY "Admin write access" ON coordinator FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Admin update access" ON coordinator; CREATE POLICY "Admin update access" ON coordinator FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Admin delete access" ON coordinator; CREATE POLICY "Admin delete access" ON coordinator FOR DELETE USING (auth.role() = 'authenticated');

-- 6. جدول طلبات الانضمام
CREATE TABLE IF NOT EXISTS applications (
  id BIGSERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  national_id TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  address TEXT DEFAULT '',
  qualification TEXT DEFAULT '',
  committee_id TEXT NOT NULL,
  experience TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert applications" ON applications;
CREATE POLICY "Public insert applications" ON applications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin read applications" ON applications;
CREATE POLICY "Admin read applications" ON applications FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin delete applications" ON applications;
CREATE POLICY "Admin delete applications" ON applications FOR DELETE USING (auth.role() = 'authenticated');

-- 9. جدول إعدادات التقديم
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY DEFAULT 'form',
  form_open BOOLEAN DEFAULT true,
  form_message TEXT DEFAULT '',
  schedule_enabled BOOLEAN DEFAULT false,
  form_open_at TIMESTAMPTZ,
  form_close_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin all app_settings" ON app_settings;
CREATE POLICY "Admin all app_settings" ON app_settings FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public read app_settings" ON app_settings;
CREATE POLICY "Public read app_settings" ON app_settings FOR SELECT USING (true);

-- Insert default row
INSERT INTO app_settings (id, form_open, form_message) VALUES ('form', true, '')
ON CONFLICT (id) DO NOTHING;
