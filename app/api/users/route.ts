import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/users - Fetch administrative data (users, members, courts) directly from Supabase
export async function GET(request: NextRequest) {
  try {
    const [resUsers, resMembers, resCourts] = await Promise.all([
      supabase.from("users").select("*"),
      supabase.from("memberships").select("*"),
      supabase.from("courts").select("*")
    ]);

    if (resUsers.error) throw resUsers.error;
    if (resMembers.error) throw resMembers.error;
    if (resCourts.error) throw resCourts.error;

    // Map snake_case columns from PostgreSQL back to camelCase properties for TypeScript
    const users = (resUsers.data || []).map((u: any) => ({
      email: u.email,
      name: u.name,
      phone: u.phone,
      role: u.role,
      createdAt: u.created_at
    }));

    const members = (resMembers.data || []).map((m: any) => ({
      id: m.id,
      email: m.email,
      name: m.name,
      phone: m.phone,
      startDate: m.start_date,
      endDate: m.end_date
    }));

    const courts = (resCourts.data || []).map((c: any) => ({
      id: c.id,
      status: c.status
    }));

    return NextResponse.json({
      success: true,
      users,
      members,
      courts
    });
  } catch (error: any) {
    console.error("GET /api/users error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memuat data administrasi." },
      { status: 500 }
    );
  }
}

// POST /api/users - Register new user or add member to Supabase
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, name, phone, durationDays } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: "Aksi tidak ditentukan." },
        { status: 400 }
      );
    }

    if (action === "register_user") {
      if (!email || !name || !phone) {
        return NextResponse.json(
          { success: false, error: "Nama, email, dan WhatsApp wajib diisi." },
          { status: 400 }
        );
      }

      const { error } = await supabase.from("users").upsert({
        email,
        name,
        phone,
        role: "user",
        created_at: new Date().toISOString()
      }, { onConflict: "email" });

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: "User berhasil terdaftar di Supabase."
      });
    }

    if (action === "add_member") {
      if (!email || !name || !phone) {
        return NextResponse.json(
          { success: false, error: "Nama, email, dan WhatsApp wajib diisi." },
          { status: 400 }
        );
      }

      const days = durationDays ? parseInt(durationDays) : 30;
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + days * 86400000);

      // 1. Ensure user account profile exists in users table (prevent Foreign Key violation)
      const { error: userError } = await supabase.from("users").upsert({
        email,
        name,
        phone,
        role: "user",
        created_at: new Date().toISOString()
      }, { onConflict: "email" });

      if (userError) throw userError;

      // 2. Insert or update member record in memberships table
      const { error: memberError } = await supabase.from("memberships").upsert({
        id: `mem_${Date.now()}`,
        email,
        name,
        phone,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      }, { onConflict: "email" });

      if (memberError) throw memberError;

      return NextResponse.json({
        success: true,
        message: `Member manual berhasil didaftarkan selama ${days} hari di Supabase.`
      });
    }

    return NextResponse.json(
      { success: false, error: "Aksi tidak dikenali." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("POST /api/users error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}

// PUT /api/users - Update user roles or court statuses in Supabase
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, role, courtId, status } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: "Aksi tidak ditentukan." },
        { status: 400 }
      );
    }

    if (action === "update_role") {
      if (!email || !role || !["user", "admin"].includes(role)) {
        return NextResponse.json(
          { success: false, error: "Email dan role baru (user/admin) wajib diisi." },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from("users")
        .update({ role })
        .eq("email", email);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: `Akses role untuk ${email} berhasil diubah menjadi ${role} di Supabase.`
      });
    }

    if (action === "update_court") {
      if (!courtId || !status || !["active", "maintenance"].includes(status)) {
        return NextResponse.json(
          { success: false, error: "ID Court dan status baru (active/maintenance) wajib diisi." },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from("courts")
        .update({ status })
        .eq("id", courtId);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: `Status Court ${courtId} berhasil diubah menjadi ${status} di Supabase.`
      });
    }

    return NextResponse.json(
      { success: false, error: "Aksi tidak dikenali." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("PUT /api/users error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
