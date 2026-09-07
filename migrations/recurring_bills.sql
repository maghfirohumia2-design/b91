-- ====================================================================
-- SQL Migration: Tabel Tagihan Rutin & Pengingat Bulanan
-- Salin SELURUH isi script ini dan klik RUN di Supabase SQL Editor
-- ====================================================================

-- 1. Buat Tabel recurring_bills
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

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE public.recurring_bills ENABLE ROW LEVEL SECURITY;

-- 3. Hapus Policy Lama (jika ada) agar tidak duplikat
DROP POLICY IF EXISTS "Allow authenticated users to read recurring bills" ON public.recurring_bills;
DROP POLICY IF EXISTS "Allow authenticated users to insert recurring bills" ON public.recurring_bills;
DROP POLICY IF EXISTS "Allow authenticated users to update recurring bills" ON public.recurring_bills;
DROP POLICY IF EXISTS "Allow authenticated users to delete recurring bills" ON public.recurring_bills;

-- 4. Buat Policy Baru
CREATE POLICY "Allow authenticated users to read recurring bills"
  ON public.recurring_bills FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert recurring bills"
  ON public.recurring_bills FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update recurring bills"
  ON public.recurring_bills FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete recurring bills"
  ON public.recurring_bills FOR DELETE
  TO authenticated
  USING (true);
