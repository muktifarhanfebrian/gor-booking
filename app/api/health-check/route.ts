import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/health-check
 * Verifies Supabase client initialization and live DB connectivity.
 * Returns JSON with environment status and DB ping result.
 */
export async function GET() {
  const url  = process.env.NEXT_PUBLIC_GOR_SUPABASE_URL;
  const key  = process.env.NEXT_PUBLIC_GOR_SUPABASE_ANON_KEY;

  const envStatus = {
    NEXT_PUBLIC_GOR_SUPABASE_URL:      url  ? "✓ loaded" : "✗ MISSING",
    NEXT_PUBLIC_GOR_SUPABASE_ANON_KEY: key  ? "✓ loaded" : "✗ MISSING",
  };

  if (!url || !key) {
    return NextResponse.json(
      {
        ok: false,
        message: "One or more required environment variables are missing.",
        env: envStatus,
        db: null,
      },
      { status: 500 }
    );
  }

  // Ping the database with a lightweight query
  const { data, error } = await supabase
    .from("courts")
    .select("id, status")
    .limit(1);

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: `Supabase query failed: ${error.message}`,
        env: envStatus,
        db: { connected: false, error: error.message },
      },
      { status: 502 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      message: "Supabase connection is healthy ✓",
      env: envStatus,
      db: {
        connected: true,
        sampleRows: data?.length ?? 0,
      },
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
