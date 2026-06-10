// ── Primitive union types ──────────────────────────────────────────
export type BookingType   = "regular" | "member";
export type PaymentMethod = "cod" | "qris";
export type PaymentStatus = "pending" | "success" | "failed";
export type VerificationStatus =
  | "unsubmitted"
  | "pending_verification"
  | "verified"
  | "rejected";
export type CourtStatus = "active" | "maintenance";
export type UserRole    = "user" | "admin";

// ── Court ──────────────────────────────────────────────────────────
/** Mapped camelCase representation of the `courts` Supabase table */
export interface Court {
  id: string;
  name: string;
  status: CourtStatus;
  isBlocked: boolean;
}

export interface CourtInput {
  name: string;
  status?: CourtStatus;
  isBlocked?: boolean;
}

/** Legacy alias – kept for backward-compat with existing admin page */
export interface CourtConfig {
  id: string;
  name?: string;
  status: CourtStatus;
  isBlocked?: boolean;
}

// ── User ───────────────────────────────────────────────────────────
/** Mapped camelCase representation of the `users` Supabase table */
export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  createdAt: string;
}

export interface UserInput {
  name: string;
  phone: string;
  email?: string;
  role?: UserRole;
}

// ── Booking ────────────────────────────────────────────────────────
export interface Booking {
  id: string;
  customerName: string;
  phoneNumber: string;
  date: string;        // YYYY-MM-DD
  startTime: string;   // HH:MM
  endTime: string;     // HH:MM
  courtId: string;
  bookingType: BookingType;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  amount: number;
  serviceFee: number;
  totalAmount: number;
  memberGroupId?: string;
  paymentProofUrl?: string;
  paymentVerificationStatus?: VerificationStatus;
  createdAt: string;
}

// ── Timeslot ───────────────────────────────────────────────────────
export interface TimeSlot {
  startTime: string;
  endTime: string;
  isBooked: boolean;
  bookedBy?: string;
  bookingType?: BookingType;
}

// ── Request / Response DTOs ────────────────────────────────────────
export interface BookingRequestPayload {
  customerName: string;
  phoneNumber: string;
  date: string;
  startTime: string;
  courtId: string;
  bookingType: BookingType;
  paymentMethod: PaymentMethod;
}

export interface PaymentPayload {
  bookingId: string;
  amount: number;
  paymentMethod: PaymentMethod;
}

export interface PaymentResponse {
  success: boolean;
  paymentId: string;
  amount: number;
  serviceFee: number;
  totalAmount: number;
  qrisUrl?: string;
  status: PaymentStatus;
}

// ── Generic service result wrapper ────────────────────────────────
export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

// ── Legacy mock types (preserved for backward-compat) ──────────────
export interface MockUser {
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  createdAt: string;
}

export interface MockMember {
  id: string;
  email: string;
  name: string;
  phone: string;
  startDate: string;
  endDate: string;
}
