import { supabase } from "@/lib/supabase";
import { getAdminSupabase } from "@/lib/adminAuth";
import { Booking } from "@/types";

/**
 * Checks if a slot is available logically before attempting insertion.
 * A slot is considered taken if there is an existing booking with payment_status = 'approved' or 'pending',
 * OR if the court has is_blocked = true.
 */
export async function checkSlotAvailability(courtId: string, bookingDate: string, timeSlot: string): Promise<boolean> {
  // 1. Check if court is blocked manually by admin
  const { data: court, error: courtError } = await supabase
    .from("courts")
    .select("is_blocked")
    .eq("id", courtId)
    .single();

  if (courtError || !court) {
    throw new Error("Lapangan tidak ditemukan atau terjadi kesalahan database.");
  }

  if (court.is_blocked) {
    throw new Error("Lapangan ini sedang diblokir untuk operasional (maintenance/turnamen).");
  }

  // 2. Check existing bookings
  const { data: existingBooking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, payment_status")
    .eq("court_id", courtId)
    .eq("date", bookingDate)
    .eq("start_time", timeSlot)
    .in("payment_status", ["pending", "success"])
    .maybeSingle();

  if (bookingError) {
    throw new Error("Terjadi kesalahan saat memeriksa ketersediaan jadwal.");
  }

  if (existingBooking) {
    throw new Error(`Maaf, jadwal pada ${bookingDate} jam ${timeSlot} sudah dipesan oleh orang lain.`);
  }

  return true;
}

/**
 * Creates a regular booking atomically.
 * Relies on PostgreSQL Partial Unique Index to prevent race conditions.
 */
export async function createRegularBooking(bookingData: Partial<Booking>): Promise<Booking> {
  if (!bookingData.courtId || !bookingData.date || !bookingData.startTime) {
    throw new Error("Data booking tidak lengkap (courtId, date, startTime wajib diisi).");
  }

  // Pre-check for clear UI errors
  await checkSlotAvailability(bookingData.courtId, bookingData.date, bookingData.startTime);

  // Auto-insert user if not exists based on phone. Use getAdminSupabase() to bypass RLS
  if (bookingData.phoneNumber && bookingData.customerName) {
    const supabaseAdmin = getAdminSupabase();
    const { error: userError } = await supabaseAdmin.from("users").upsert({
      phone: bookingData.phoneNumber,
      name: bookingData.customerName,
      role: "user"
    }, { onConflict: 'phone', ignoreDuplicates: true });
    
    if (userError) {
      console.warn("Gagal auto-insert user saat booking:", userError);
    }
  }

  // Attempt Atomic Insertion
  const rowToInsert = {
    id: bookingData.id || `book_reg_${Date.now()}`,
    customer_name: bookingData.customerName,
    phone_number: bookingData.phoneNumber,
    date: bookingData.date,
    start_time: bookingData.startTime,
    end_time: bookingData.endTime,
    court_id: bookingData.courtId,
    booking_type: bookingData.bookingType || "regular",
    payment_method: bookingData.paymentMethod,
    payment_status: bookingData.paymentStatus || "pending",
    amount: bookingData.amount,
    service_fee: bookingData.serviceFee || 0,
    total_amount: bookingData.totalAmount,
    payment_verification_status: bookingData.paymentVerificationStatus || "unsubmitted",
    created_at: bookingData.createdAt || new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("bookings")
    .insert([rowToInsert])
    .select()
    .single();

  if (error) {
    // 23505 is PostgreSQL Unique Violation Error Code
    if (error.code === '23505') {
      throw new Error(`[CRITICAL] Terjadi tabrakan pemesanan (Double Booking). Slot ${bookingData.date} jam ${bookingData.startTime} baru saja diambil orang lain di detik yang sama.`);
    }
    throw new Error("Gagal menyimpan booking ke database: " + error.message);
  }

  return {
    id: data.id,
    customerName: data.customer_name,
    phoneNumber: data.phone_number,
    date: data.date,
    startTime: data.start_time,
    endTime: data.end_time,
    courtId: data.court_id,
    bookingType: data.booking_type,
    paymentMethod: data.payment_method,
    paymentStatus: data.payment_status,
    amount: Number(data.amount),
    serviceFee: Number(data.service_fee),
    totalAmount: Number(data.total_amount),
    paymentVerificationStatus: data.payment_verification_status,
    createdAt: data.created_at,
  };
}
