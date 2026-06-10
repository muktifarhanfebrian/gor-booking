import { supabase } from "@/lib/supabase";
import { getAdminSupabase } from "@/lib/adminAuth";
import { checkSlotAvailability } from "./bookingService";

/**
 * Dynamically calculates the dates of a specific day of the week 
 * falling within a 30-day window from the start date.
 */
function calculateMembershipDates(startDateStr: string): string[] {
  const startDate = new Date(startDateStr);
  const limitDate = new Date(startDate);
  limitDate.setDate(startDate.getDate() + 30); // 30-day window

  const slotDates: string[] = [];
  let currentSlotDate = new Date(startDate);

  // Generate weekly slots as long as they fit in the 30-day window (max 5)
  while (currentSlotDate <= limitDate && slotDates.length < 5) {
    const yyyy = currentSlotDate.getFullYear();
    const mm = String(currentSlotDate.getMonth() + 1).padStart(2, "0");
    const dd = String(currentSlotDate.getDate()).padStart(2, "0");
    slotDates.push(`${yyyy}-${mm}-${dd}`);

    currentSlotDate.setDate(currentSlotDate.getDate() + 7); // Go to next week
  }

  // Fallback: Ensure at least 4 slots for value consistency
  if (slotDates.length < 4) {
    slotDates.length = 0; 
    for (let i = 0; i < 4; i++) {
      const nextDate = new Date(startDate);
      nextDate.setDate(startDate.getDate() + i * 7);
      const yyyy = nextDate.getFullYear();
      const mm = String(nextDate.getMonth() + 1).padStart(2, "0");
      const dd = String(nextDate.getDate()).padStart(2, "0");
      slotDates.push(`${yyyy}-${mm}-${dd}`);
    }
  }

  return slotDates;
}

/**
 * Registers a new monthly membership and automatically books the weekly slots.
 * This function performs atomic validation and bulk insertion.
 */
export async function registerMonthlyMembership(params: {
  customerName: string;
  phoneNumber: string;
  email: string;
  courtId: string;
  startDate: string;
  timeSlot: string; // e.g. "19:00"
  paymentMethod: "cod" | "qris";
}) {
  const { customerName, phoneNumber, email, courtId, startDate, timeSlot, paymentMethod } = params;

  // 1. Calculate slot dates within 30 days
  const slotDates = calculateMembershipDates(startDate);
  const totalSessions = slotDates.length; // Either 4 or 5

  // 2. Validate availability for ALL projected slots
  // If even one is taken, we reject the membership booking completely to maintain atomic consistency.
  for (const date of slotDates) {
    try {
      await checkSlotAvailability(courtId, date, timeSlot);
    } catch (error: any) {
      throw new Error(`Gagal mendaftar paket member: Slot pada tanggal ${date} jam ${timeSlot} tidak tersedia. (${error.message})`);
    }
  }

  // 3. Mathematical division for flat rate Rp400.000
  const flatRate = 400000;
  const pricePerSession = Math.floor(flatRate / totalSessions); // E.g., 400000 / 4 = 100000, 400000 / 5 = 80000

  // Determine end time (+2 hours)
  const startHour = parseInt(timeSlot.split(":")[0]);
  const endHour = startHour + 2;
  const endTime = `${String(endHour).padStart(2, "0")}:00`;

  // QRIS Service Fee is charged once for the whole package
  const serviceFee = paymentMethod === "qris" ? 1000 : 0;
  const memberGroupId = `group_mem_${Date.now()}`;
  
  // 4. Construct Bulk Insert Bookings payload
  const bookingsToInsert = slotDates.map((date, index) => {
    const slotServiceFee = index === 0 ? serviceFee : 0; // Charge fee on first slot only

    return {
      id: `book_mem_${Date.now()}_${index}`,
      customer_name: customerName,
      phone_number: phoneNumber,
      date: date,
      start_time: timeSlot,
      end_time: endTime,
      court_id: courtId,
      booking_type: "member",
      payment_method: paymentMethod,
      payment_status: "pending", 
      amount: pricePerSession,
      service_fee: slotServiceFee,
      total_amount: pricePerSession + slotServiceFee,
      member_group_id: memberGroupId,
      payment_verification_status: "unsubmitted",
      created_at: new Date().toISOString(),
    };
  });

  // End date for the membership row
  const endDate = slotDates[slotDates.length - 1]; // The last slot date

  // 5. Database Transaction (RPC or Client-side sequential insert if no custom RPC)
  // Since we rely on Supabase JS Client, we do sequential inserts. If any fails, we'd ideally rollback,
  // but the partial unique index helps prevent race conditions.
  
  const supabaseAdmin = getAdminSupabase();

  // A. Ensure user exists (Upsert by phone)
  const { error: userError } = await supabaseAdmin.from("users").upsert({
    phone: phoneNumber,
    name: customerName,
    email: email || null,
    role: "user" // Default fallback
  }, { onConflict: 'phone', ignoreDuplicates: true });
  
  if (userError) throw new Error("Gagal mendaftarkan data pengguna: " + userError.message);

  // B. Insert into memberships table
  const { error: memError } = await supabase.from("memberships").insert({
    id: memberGroupId,
    name: customerName,
    phone: phoneNumber,
    email: email || null,
    start_date: new Date(startDate).toISOString(),
    end_date: new Date(endDate).toISOString(),
  });

  if (memError) throw new Error("Gagal mengaktifkan paket membership: " + memError.message);

  // C. Bulk Insert Bookings
  const { error: bookingError } = await supabase
    .from("bookings")
    .insert(bookingsToInsert);

  if (bookingError) {
    if (bookingError.code === '23505') {
      throw new Error(`[CRITICAL] Terjadi tabrakan saat memproses jadwal member (Double Booking). Salah satu slot tiba-tiba diambil.`);
    }
    throw new Error("Gagal menyimpan jadwal member: " + bookingError.message);
  }

  return {
    success: true,
    memberGroupId,
    totalSessions,
    pricePerSession,
    bookings: bookingsToInsert
  };
}
