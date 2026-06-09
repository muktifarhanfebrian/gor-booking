import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/payments/qris - Manages different payment states (User Proof Upload, Admin Verification, and Direct Simulation) in Supabase
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, bookingIds, paymentProofUrl, adminDecision } = body;

    // ACTION: Reset Database (for developer testing convenience)
    if (action === "reset_db") {
      // Clear bookings table
      const { error } = await supabase.from("bookings").delete().neq("id", "dummy_bypass_prevent_blank_delete");
      if (error) throw error;
      
      return NextResponse.json({
        success: true,
        message: "Database bookings di Supabase berhasil dikosongkan.",
      });
    }

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "ID Booking tidak valid." },
        { status: 400 }
      );
    }

    // ACTION 1: User uploads payment proof screenshot
    if (action === "upload_proof") {
      if (!paymentProofUrl) {
        return NextResponse.json(
          { success: false, error: "Bukti transfer berupa gambar/file wajib disertakan." },
          { status: 400 }
        );
      }

      const { error, data } = await supabase
        .from("bookings")
        .update({
          payment_proof_url: paymentProofUrl,
          payment_verification_status: "pending_verification"
        })
        .in("id", bookingIds)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        return NextResponse.json(
          { success: false, error: "Booking tidak ditemukan untuk diunggah bukti." },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Bukti transfer berhasil diunggah ke Supabase. Menunggu konfirmasi admin.",
        updatedCount: data.length,
      });
    }

    // ACTION 2: Admin verifies payment proof
    if (action === "admin_verify") {
      if (!adminDecision || !["approve", "reject"].includes(adminDecision)) {
        return NextResponse.json(
          { success: false, error: "Keputusan admin (approve/reject) tidak valid." },
          { status: 400 }
        );
      }

      const isApprove = adminDecision === "approve";
      const { error, data } = await supabase
        .from("bookings")
        .update({
          payment_verification_status: isApprove ? "verified" : "rejected",
          payment_status: isApprove ? "success" : "pending"
        })
        .in("id", bookingIds)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        return NextResponse.json(
          { success: false, error: "Booking tidak ditemukan untuk verifikasi." },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Pembayaran sewa lapangan berhasil di-${adminDecision === "approve" ? "setujui" : "tolak"} di Supabase.`,
        updatedCount: data.length,
      });
    }

    // ACTION 3: Direct simulated payment success (e.g. from checkout simulation)
    const { error, data } = await supabase
      .from("bookings")
      .update({
        payment_status: "success",
        payment_verification_status: "verified"
      })
      .in("id", bookingIds)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: "Booking tidak ditemukan untuk diproses sewa." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Pembayaran QRIS berhasil diselesaikan di Supabase.",
      transactionId: `tx_qris_${Date.now()}`,
      status: "success",
      updatedCount: data.length,
    });
  } catch (error: any) {
    console.error("QRIS POST API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Terjadi kesalahan saat memproses pembayaran." },
      { status: 500 }
    );
  }
}

// GET /api/payments/qris - Generate QRIS invoice details
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const amountParam = searchParams.get("amount");
  
  if (!amountParam) {
    return NextResponse.json(
      { success: false, error: "Parameter amount wajib diisi." },
      { status: 400 }
    );
  }

  const baseAmount = parseInt(amountParam);
  const serviceFee = 1000;
  const totalAmount = baseAmount + serviceFee;

  return NextResponse.json({
    success: true,
    merchant: "GOR PANDU MEULABOH",
    qrisString: `00020101021226590014ID1020078901234011893600000000000000052045999530336054${totalAmount}5802ID5916GOR PANDU UJONG6009MEULABOH6304A1B2`,
    baseAmount,
    serviceFee,
    totalAmount,
    expiryMinutes: 15,
    qrisPlaceholderImg: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encodeURIComponent(`QRIS-MOCK-GOR-PANDU-PAY-${totalAmount}`)
  });
}
