import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Service Role client to bypass RLS for admin checks
export function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_GOR_SUPABASE_URL || "";
  // Ensure you define GOR_SUPABASE_SERVICE_ROLE_KEY in your .env.local
  const supabaseServiceKey = process.env.GOR_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_GOR_SUPABASE_ANON_KEY || "";
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Validates if the request comes from a verified Admin.
 * It expects an 'x-admin-email' header sent from the frontend.
 * For true production security, this should validate a JWT token,
 * but for this MVP architecture where auth is handled via custom frontend logic,
 * we verify the email against the users table.
 */
export async function verifyAdminRequest(request: NextRequest): Promise<boolean> {
  const adminEmail = request.headers.get("x-admin-email");
  
  if (!adminEmail) {
    console.warn("verifyAdminRequest: Missing x-admin-email header.");
    return false;
  }

  const supabaseAdmin = getAdminSupabase();

  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("email", adminEmail)
      .single();

    if (error || !data) {
      return false;
    }

    return data.role === "admin";
  } catch (error) {
    console.error("verifyAdminRequest error:", error);
    return false;
  }
}
