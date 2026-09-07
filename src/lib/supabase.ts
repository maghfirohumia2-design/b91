import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zjtxnmzkjxvvfkmzycnq.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ndURF7y2luHkn-pTwMMLLw_PF1WqYsp';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
