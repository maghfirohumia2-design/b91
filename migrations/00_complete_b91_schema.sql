-- ====================================================================
-- SKEMA LENGKAP DATABASE B91 (SUPABASE)
-- Salin SELURUH isi file ini, buka Supabase Dashboard -> SQL Editor,
-- tempelkan (paste) dan klik tombol hijau "RUN".
-- ====================================================================

-- 1. TABEL PROFILES (Pengguna & Role)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('super_admin', 'member')),
  points INTEGER DEFAULT 0,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABEL ACCOUNTS (Pos / Rekening Kas)
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  initial_balance NUMERIC NOT NULL DEFAULT 0,
  budget_limit NUMERIC NOT NULL DEFAULT 0,
  icon TEXT DEFAULT '/icons/umum.jpg',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABEL CATEGORIES (Kategori Pemasukan & Pengeluaran)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  bg_class TEXT,
  text_class TEXT,
  budget_limit NUMERIC DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABEL TRANSACTIONS (Mutasi Transaksi)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  receipt_url TEXT,
  user_name TEXT,
  is_transfer BOOLEAN DEFAULT false,
  linked_tx_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABEL FAMILY_GOALS (Target Impian / Tabungan)
CREATE TABLE IF NOT EXISTS public.family_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🎯',
  target_amount NUMERIC NOT NULL DEFAULT 0,
  current_amount NUMERIC NOT NULL DEFAULT 0,
  target_date DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABEL REWARDS (Hadiah Poin)
CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🎁',
  points_cost INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TABEL REWARD_CLAIMS (Klaim Hadiah)
CREATE TABLE IF NOT EXISTS public.reward_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reward_id UUID REFERENCES public.rewards(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. TABEL RECURRING_BILLS (Tagihan Rutin Bulanan)
CREATE TABLE IF NOT EXISTS public.recurring_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'Tagihan & Utilitas',
  due_day INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  icon TEXT NOT NULL DEFAULT '⚡',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. TABEL DEBTS_LOANS (Hutang & Piutang)
CREATE TABLE IF NOT EXISTS public.debts_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('debt', 'loan')),
  person_name TEXT NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  due_date DATE,
  description TEXT,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. TABEL DEBT_PAYMENTS (Cicilan Hutang / Piutang)
CREATE TABLE IF NOT EXISTS public.debt_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id UUID REFERENCES public.debts_loans(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- AKTIFKAN ROW LEVEL SECURITY (RLS) & POLICIES
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  -- Profiles
  DROP POLICY IF EXISTS "Auth users can manage profiles" ON public.profiles;
  CREATE POLICY "Auth users can manage profiles" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- Accounts
  DROP POLICY IF EXISTS "Auth users can manage accounts" ON public.accounts;
  CREATE POLICY "Auth users can manage accounts" ON public.accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- Categories
  DROP POLICY IF EXISTS "Auth users can manage categories" ON public.categories;
  CREATE POLICY "Auth users can manage categories" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- Transactions
  DROP POLICY IF EXISTS "Auth users can manage transactions" ON public.transactions;
  CREATE POLICY "Auth users can manage transactions" ON public.transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- Family Goals
  DROP POLICY IF EXISTS "Auth users can manage family_goals" ON public.family_goals;
  CREATE POLICY "Auth users can manage family_goals" ON public.family_goals FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- Rewards
  DROP POLICY IF EXISTS "Auth users can manage rewards" ON public.rewards;
  CREATE POLICY "Auth users can manage rewards" ON public.rewards FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- Reward Claims
  DROP POLICY IF EXISTS "Auth users can manage reward_claims" ON public.reward_claims;
  CREATE POLICY "Auth users can manage reward_claims" ON public.reward_claims FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- Recurring Bills
  DROP POLICY IF EXISTS "Auth users can manage recurring_bills" ON public.recurring_bills;
  CREATE POLICY "Auth users can manage recurring_bills" ON public.recurring_bills FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- Debts Loans
  DROP POLICY IF EXISTS "Auth users can manage debts_loans" ON public.debts_loans;
  CREATE POLICY "Auth users can manage debts_loans" ON public.debts_loans FOR ALL TO authenticated USING (true) WITH CHECK (true);

  -- Debt Payments
  DROP POLICY IF EXISTS "Auth users can manage debt_payments" ON public.debt_payments;
  CREATE POLICY "Auth users can manage debt_payments" ON public.debt_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
END $$;

-- ====================================================================
-- STORAGE BUCKET: receipts (Untuk bukti nota / struk)
-- ====================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Public read receipts" ON storage.objects;
  CREATE POLICY "Public read receipts" ON storage.objects FOR SELECT USING (bucket_id = 'receipts');

  DROP POLICY IF EXISTS "Authenticated upload receipts" ON storage.objects;
  CREATE POLICY "Authenticated upload receipts" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'receipts');

  DROP POLICY IF EXISTS "Authenticated delete receipts" ON storage.objects;
  CREATE POLICY "Authenticated delete receipts" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'receipts');
END $$;

-- ====================================================================
-- SEED DATA DEFAULT (Kategori & Akun Awal B91)
-- ====================================================================
INSERT INTO public.categories (name, icon, type, bg_class, text_class) VALUES
  ('💵 Gaji & Honor', '💵', 'income', 'bg-emerald-50 border-emerald-200', 'text-emerald-700'),
  ('💼 Hasil Usaha', '💼', 'income', 'bg-teal-50 border-teal-200', 'text-teal-700'),
  ('🎁 Bonus & Hadiah', '🎁', 'income', 'bg-amber-50 border-amber-200', 'text-amber-700'),
  ('🔄 Setoran / Transfer', '🔄', 'income', 'bg-blue-50 border-blue-200', 'text-blue-700'),
  ('📦 Pemasukan Lain', '📦', 'income', 'bg-slate-100 border-slate-200', 'text-slate-700'),
  ('🛒 Makanan & Sembako', '🛒', 'expense', 'bg-emerald-50 border-emerald-200', 'text-emerald-700'),
  ('⚡ Tagihan & Utility', '⚡', 'expense', 'bg-amber-50 border-amber-200', 'text-amber-700'),
  ('🚗 Bensin & Transport', '🚗', 'expense', 'bg-blue-50 border-blue-200', 'text-blue-700'),
  ('🎓 Pendidikan & SPP', '🎓', 'expense', 'bg-purple-50 border-purple-200', 'text-purple-700'),
  ('🛍️ Belanja Kebutuhan', '🛍️', 'expense', 'bg-pink-50 border-pink-200', 'text-pink-700'),
  ('🍿 Jajan & Hiburan', '🍿', 'expense', 'bg-orange-50 border-orange-200', 'text-orange-700'),
  ('🏥 Kesehatan & Obat', '🏥', 'expense', 'bg-rose-50 border-rose-200', 'text-rose-700'),
  ('⚡ Listrik & Air', '⚡', 'expense', 'bg-amber-50 border-amber-200', 'text-amber-700'),
  ('📦 Pengeluaran Lain', '📦', 'expense', 'bg-slate-100 border-slate-200', 'text-slate-700')
ON CONFLICT DO NOTHING;

INSERT INTO public.accounts (name, description, initial_balance, budget_limit, icon) VALUES
  ('Kas Utama', 'Kas operasional utama', 0, 0, '/icons/umum.jpg'),
  ('Tabungan', 'Tabungan masa depan', 0, 0, '/icons/umum.jpg'),
  ('Belanja', 'Kebutuhan harian & belanja', 0, 0, '/icons/belanja.jpg')
ON CONFLICT DO NOTHING;
