import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_GOR_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_GOR_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== "undefined") {
    console.warn(
      "Supabase client initialized with mock credentials. Please define NEXT_PUBLIC_GOR_SUPABASE_URL and NEXT_PUBLIC_GOR_SUPABASE_ANON_KEY in your .env file."
    );
  }
}

// Fallback handles build-time compilation safely without throwing errors
export const supabase = createClient(
  supabaseUrl || "https://your-gor-supabase-url.supabase.co",
  supabaseAnonKey || "your-gor-supabase-anon-key-placeholder"
);
