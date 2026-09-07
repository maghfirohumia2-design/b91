-- ====================================================================
-- SQL Migration: Menambahkan kolom icon pada tabel accounts
-- Jalankan query ini di Supabase SQL Editor jika belum ada
-- ====================================================================

ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '/icons/umum.jpg';
