import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Booking } from "@/types";

// Helper: Map Supabase database row to TypeScript Booking interface
function mapRowToBooking(row: any): Booking {
  return {
    id: row.id,
    customerName: row.customer_name,
    phoneNumber: row.phone_number,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    courtId: row.court_id,
    bookingType: row.booking_type,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    amount: Number(row.amount),
    serviceFee: Number(row.service_fee),
    totalAmount: Number(row.total_amount),
    memberGroupId: row.member_group_id || undefined,
    paymentProofUrl: row.payment_proof_url || undefined,
    paymentVerificationStatus: row.payment_verification_status || "unsubmitted",
    createdAt: row.created_at,
  };
}

// Helper: Map Partial Booking object to Supabase database row format
function mapBookingToRow(b: Partial<Booking>) {
  return {
    id: b.id,
    customer_name: b.customerName,
    phone_number: b.phoneNumber,
    date: b.date,
    start_time: b.startTime,
    end_time: b.endTime,
    court_id: b.courtId,
    booking_type: b.bookingType,
    payment_method: b.paymentMethod,
    payment_status: b.paymentStatus,
    amount: b.amount,
    service_fee: b.serviceFee,
    total_amount: b.totalAmount,
    member_group_id: b.memberGroupId || null,
    payment_proof_url: b.paymentProofUrl || null,
    payment_verification_status: b.paymentVerificationStatus || "unsubmitted",
    created_at: b.createdAt,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const courtId = searchParams.get("courtId");
  const date = searchParams.get("date"); // YYYY-MM-DD
  const phoneNumber = searchParams.get("phoneNumber");

  try {
    let query = supabase.from("bookings").select("*");

    if (courtId) {
      query = query.eq("court_id", courtId);
    }
    if (date) {
      query = query.eq("date", date);
    }
    if (phoneNumber) {
      query = query.eq("phone_number", phoneNumber);
    }

    const { data, error } = await query;
    if (error) throw error;

    const bookings = (data || []).map(mapRowToBooking);
    return NextResponse.json({ success: true, data: bookings });
  } catch (error: any) {
    console.error("GET /api/bookings error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memuat jadwal." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerName,
      phoneNumber,
      date,
      startTime,
      courtId,
      bookingType,
      paymentMethod,
    } = body;

    // Validation
    if (
      !customerName ||
      !phoneNumber ||
      !date ||
      !startTime ||
      !courtId ||
      !bookingType ||
      !paymentMethod
    ) {
      return NextResponse.json(
        { success: false, error: "Semua kolom input wajib diisi." },
        { status: 400 }
      );
    }

    // Determine end time (each block is 2 hours)
    const startHour = parseInt(startTime.split(":")[0]);
    const endHour = startHour + 2;
    const endTime = `${String(endHour).padStart(2, "0")}:00`;

    // Service Fee: QRIS adds Rp1,000. COD/Manual is free (Rp0)
    const serviceFee = paymentMethod === "qris" ? 1000 : 0;

    if (bookingType === "member") {
      const { registerMonthlyMembership } = await import("@/services/membershipService");
      
      const result = await registerMonthlyMembership({
        customerName,
        phoneNumber,
        email: `${phoneNumber}@gor.com`, // Default mock email based on phone number for memberships if email is missing
        courtId,
        startDate: date,
        timeSlot: startTime,
        paymentMethod
      });

      return NextResponse.json({
        success: true,
        data: result.bookings,
        summary: {
          bookingType,
          count: result.totalSessions,
          baseAmount: result.totalSessions * result.pricePerSession,
          serviceFee: serviceFee,
          totalAmount: (result.totalSessions * result.pricePerSession) + serviceFee,
        },
      });

    } else {
      const { createRegularBooking } = await import("@/services/bookingService");
      
      const regularAmount = 100000;
      const bookingData: Partial<Booking> = {
        customerName,
        phoneNumber,
        date,
        startTime,
        endTime,
        courtId,
        bookingType: "regular",
        paymentMethod,
        paymentStatus: "pending",
        amount: regularAmount,
        serviceFee,
        totalAmount: regularAmount + serviceFee,
      };

      const newBooking = await createRegularBooking(bookingData);

      return NextResponse.json({
        success: true,
        data: [newBooking],
        summary: {
          bookingType,
          count: 1,
          baseAmount: newBooking.amount,
          serviceFee: newBooking.serviceFee,
          totalAmount: newBooking.totalAmount,
        },
      });
    }
  } catch (error: any) {
    console.error("POST /api/bookings error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal membuat booking." },
      { status: 500 }
    );
  }
}
