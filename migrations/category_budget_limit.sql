-- ====================================================================
-- SQL Migration: Menambahkan kolom budget_limit pada tabel categories
-- Jalankan query ini di Supabase SQL Editor
-- ====================================================================

ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS budget_limit NUMERIC DEFAULT 0;
