export type BookingType = "regular" | "member";
export type PaymentMethod = "cod" | "qris";
export type PaymentStatus = "pending" | "success" | "failed";
export type VerificationStatus = "unsubmitted" | "pending_verification" | "verified" | "rejected";

export interface Booking {
  id: string;
  customerName: string;
  phoneNumber: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  courtId: string;
  bookingType: BookingType;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  amount: number;
  serviceFee: number;
  totalAmount: number;
  memberGroupId?: string; // Links the atomic slots generated for a member
  paymentProofUrl?: string; // Base64 or image URL representing uploaded receipt
  paymentVerificationStatus?: VerificationStatus;
  createdAt: string;
}

export interface Court {
  id: string;
  name: string;
  type: string; // e.g. "Vinyl Premium"
  status: "active" | "maintenance";
}

export interface TimeSlot {
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  isBooked: boolean;
  bookedBy?: string;
  bookingType?: BookingType;
}

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
  qrisUrl?: string; // Generated mock QRIS image/payload
  status: PaymentStatus;
}

export interface MockUser {
  email: string;
  name: string;
  phone: string;
  role: "user" | "admin";
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

export interface CourtConfig {
  id: string;
  status: "active" | "maintenance";
}
