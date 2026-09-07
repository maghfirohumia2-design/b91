-- ====================================================================
-- SQL Migration: Tabel Hutang & Piutang Keluarga (debts_loans & debt_payments)
-- Salin SELURUH isi script ini dan jalankan di Supabase SQL Editor
-- ====================================================================

-- 1. Buat Tabel debts_loans
CREATE TABLE IF NOT EXISTS public.debts_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('debt', 'loan')), -- 'debt': Hutang, 'loan': Piutang
  person_name TEXT NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  due_date DATE,
  description TEXT,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Buat Tabel debt_payments (Riwayat Pembayaran Cicilan)
CREATE TABLE IF NOT EXISTS public.debt_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id UUID REFERENCES public.debts_loans(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Aktifkan Row Level Security (RLS)
ALTER TABLE public.debts_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;

-- 4. Hapus Policy Lama (jika ada)
DROP POLICY IF EXISTS "Allow authenticated users to read debts_loans" ON public.debts_loans;
DROP POLICY IF EXISTS "Allow authenticated users to insert debts_loans" ON public.debts_loans;
DROP POLICY IF EXISTS "Allow authenticated users to update debts_loans" ON public.debts_loans;
DROP POLICY IF EXISTS "Allow authenticated users to delete debts_loans" ON public.debts_loans;

DROP POLICY IF EXISTS "Allow authenticated users to read debt_payments" ON public.debt_payments;
DROP POLICY IF EXISTS "Allow authenticated users to insert debt_payments" ON public.debt_payments;
DROP POLICY IF EXISTS "Allow authenticated users to delete debt_payments" ON public.debt_payments;

-- 5. Buat Policy Akses untuk debts_loans
CREATE POLICY "Allow authenticated users to read debts_loans"
  ON public.debts_loans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert debts_loans"
  ON public.debts_loans FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update debts_loans"
  ON public.debts_loans FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete debts_loans"
  ON public.debts_loans FOR DELETE
  TO authenticated
  USING (true);

-- 6. Buat Policy Akses untuk debt_payments
CREATE POLICY "Allow authenticated users to read debt_payments"
  ON public.debt_payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert debt_payments"
  ON public.debt_payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete debt_payments"
  ON public.debt_payments FOR DELETE
  TO authenticated
  USING (true);
