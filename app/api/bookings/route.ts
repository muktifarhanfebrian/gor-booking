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

    const generatedBookings: Booking[] = [];
    const memberGroupId = bookingType === "member" ? `group_${Date.now()}` : undefined;

    if (bookingType === "member") {
      // Calculate dynamic weekly slots within 30 days from today (max 5 slots, min 4 slots)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const limitDate = new Date(today);
      limitDate.setDate(today.getDate() + 30); // 30-day window from booking creation date

      const startDate = new Date(date);
      const slotDates: string[] = [];

      let currentSlotDate = new Date(startDate);

      // Generate weekly slots as long as they fit in the 30-day window
      while (currentSlotDate <= limitDate && slotDates.length < 5) {
        const yyyy = currentSlotDate.getFullYear();
        const mm = String(currentSlotDate.getMonth() + 1).padStart(2, "0");
        const dd = String(currentSlotDate.getDate()).padStart(2, "0");
        slotDates.push(`${yyyy}-${mm}-${dd}`);

        currentSlotDate.setDate(currentSlotDate.getDate() + 7); // Go to next week
      }

      // Fallback: If less than 4 slots fall into the 30-day window (e.g. starting late),
      // we generate exactly 4 slots starting from the selected date to guarantee value.
      if (slotDates.length < 4) {
        slotDates.length = 0; // Clear array
        for (let i = 0; i < 4; i++) {
          const nextDate = new Date(startDate);
          nextDate.setDate(startDate.getDate() + i * 7);
          const yyyy = nextDate.getFullYear();
          const mm = String(nextDate.getMonth() + 1).padStart(2, "0");
          const dd = String(nextDate.getDate()).padStart(2, "0");
          slotDates.push(`${yyyy}-${mm}-${dd}`);
        }
      }

      const totalSlots = slotDates.length; // Dynamically 4 or 5 slots
      const baseMembershipFee = 400000;
      const feePerSlot = baseMembershipFee / totalSlots;

      for (let i = 0; i < totalSlots; i++) {
        // Service fee is only added once (on the first slot of the group)
        const slotServiceFee = i === 0 ? serviceFee : 0;

        generatedBookings.push({
          id: `book_mem_${Date.now()}_${i}`,
          customerName,
          phoneNumber,
          date: slotDates[i],
          startTime,
          endTime,
          courtId,
          bookingType: "member",
          paymentMethod,
          paymentStatus: "pending",
          amount: feePerSlot,
          serviceFee: slotServiceFee,
          totalAmount: feePerSlot + slotServiceFee,
          memberGroupId,
          paymentVerificationStatus: "unsubmitted",
          createdAt: new Date().toISOString(),
        });
      }
    } else {
      // Regular booking: Rp100,000 / 2 hours
      const regularAmount = 100000;
      generatedBookings.push({
        id: `book_reg_${Date.now()}`,
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
        paymentVerificationStatus: "unsubmitted",
        createdAt: new Date().toISOString(),
      });
    }

    // Insert into Supabase table
    const rowsToInsert = generatedBookings.map(mapBookingToRow);
    const { error } = await supabase.from("bookings").insert(rowsToInsert);
    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: generatedBookings,
      summary: {
        bookingType,
        count: generatedBookings.length,
        baseAmount: generatedBookings.reduce((sum, b) => sum + b.amount, 0),
        serviceFee: generatedBookings.reduce((sum, b) => sum + b.serviceFee, 0),
        totalAmount: generatedBookings.reduce((sum, b) => sum + b.totalAmount, 0),
      },
    });
  } catch (error: any) {
    console.error("POST /api/bookings error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal membuat booking." },
      { status: 500 }
    );
  }
}
