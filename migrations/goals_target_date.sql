-- ====================================================================
-- SQL Migration: Menambahkan kolom target_date & description pada tabel family_goals
-- Jalankan query ini di Supabase SQL Editor
-- ====================================================================

ALTER TABLE public.family_goals 
ADD COLUMN IF NOT EXISTS target_date DATE,
ADD COLUMN IF NOT EXISTS description TEXT;
