import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Global Supabase client for the frontend.
 * Used specifically for video creation storage and metadata.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
