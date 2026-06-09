"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/bookingHelpers";
import { Booking } from "@/types";

export default function BookingHistoryPage() {
  const router = useRouter();
  const [userSession, setUserSession] = useState<any>(null);
  
  // Search state
  const [searchPhone, setSearchPhone] = useState<string>("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // File upload state per booking
  const [uploadingBookingId, setUploadingBookingId] = useState<string | null>(null);
  const [selectedFileBase64, setSelectedFileBase64] = useState<string>("");

  // Load active session from localStorage on load
  useEffect(() => {
    const sessionStr = localStorage.getItem("gor_session");
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      setUserSession(session);
      
      // If user session is present, search by email prefix as a placeholder or phone if saved.
      // But standard lookup is usually by phone number. Let's fetch bookings.
      // In this demo database, let's load all bookings and filter by email name or phone if we have it.
      // Let's filter bookings that match either search or session user's name/details.
      fetchBookingsBySession(session);
    }
  }, []);

  const fetchBookingsBySession = async (session: any) => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings");
      const result = await res.json();
      if (result.success) {
        // Mock filter: match by customer name or email prefix
        const nameKey = session.name?.toLowerCase() || "";
        const sessionBookings = result.data.filter(
          (b: Booking) => 
            b.customerName.toLowerCase().includes(nameKey) ||
            b.phoneNumber.includes(searchPhone)
        );
        setBookings(sessionBookings);
      }
    } catch (err) {
      console.error("Gagal memuat history booking:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPhone.trim()) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/bookings?phoneNumber=${encodeURIComponent(searchPhone)}`);
      const result = await res.json();
      if (result.success) {
        setBookings(result.data);
        if (result.data.length === 0) {
          setMessage({ type: "error", text: "Tidak ditemukan riwayat booking untuk nomor ini." });
        } else {
          setMessage({ type: "success", text: `Ditemukan ${result.data.length} riwayat sewa lapangan.` });
        }
      } else {
        throw new Error(result.error || "Gagal memuat data");
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Gagal memuat history." });
    } finally {
      setLoading(false);
    }
  };

  // Process File Input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setSelectedFileBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Upload Payment Proof
  const handleUploadProof = async (booking: Booking) => {
    if (!selectedFileBase64) {
      alert("Silakan pilih file bukti transfer terlebih dahulu.");
      return;
    }

    setLoading(true);
    try {
      // Find all bookings with the same group id if it is a member booking,
      // so the user can upload a single receipt to cover the entire monthly payment!
      const targetBookingIds = booking.memberGroupId 
        ? bookings.filter(b => b.memberGroupId === booking.memberGroupId).map(b => b.id)
        : [booking.id];

      const res = await fetch("/api/payments/qris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upload_proof",
          bookingIds: targetBookingIds,
          paymentProofUrl: selectedFileBase64,
        }),
      });

      const result = await res.json();
      if (result.success) {
        // Update local state
        setBookings(prev => 
          prev.map(b => 
            targetBookingIds.includes(b.id) 
              ? { ...b, paymentProofUrl: selectedFileBase64, paymentVerificationStatus: "pending_verification" }
              : b
          )
        );
        setSelectedFileBase64("");
        setUploadingBookingId(null);
        alert("Bukti transfer berhasil diunggah! Mohon tunggu verifikasi admin.");
      } else {
        alert("Gagal mengunggah bukti: " + result.error);
      }
    } catch (error) {
      alert("Terjadi kesalahan koneksi saat mengunggah bukti.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("gor_session");
    setUserSession(null);
    setBookings([]);
    router.push("/");
  };

  return (
    <div className="flex-1 flex flex-col w-full max-w-lg mx-auto bg-[#0b0f19] min-h-screen px-4 py-8">
      
      {/* Header bar */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Riwayat Pemesanan</h1>
          <p className="text-xs text-slate-400">Status penyewaan dan upload bukti bayar</p>
        </div>
        
        {userSession ? (
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-red-950/40 border border-red-900/30 text-red-400 text-xs rounded-xl hover:bg-red-950/60"
          >
            Keluar
          </button>
        ) : (
          <button
            onClick={() => router.push("/login")}
            className="px-3.5 py-1.5 bg-gor-primary/20 border border-gor-primary/20 text-gor-primary text-xs font-semibold rounded-xl"
          >
            Masuk Akun
          </button>
        )}
      </div>

      {/* Lookup box (always shown for quick search by WhatsApp) */}
      <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-3xl space-y-4 mb-6">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider block">Cari dengan Nomor WhatsApp</h3>
        <form onSubmit={handlePhoneSearch} className="flex gap-2">
          <input
            type="tel"
            placeholder="Masukkan nomor WA (cth: 0813...)"
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            className="flex-1 bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-gor-primary text-xs"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-gor-primary hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all"
          >
            Cari
          </button>
        </form>
        {message && (
          <p className={`text-[10px] ${message.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
            {message.text}
          </p>
        )}
      </div>

      {/* Bookings history list */}
      <div className="flex-1 space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <span className="animate-spin rounded-full h-6 w-6 border-2 border-gor-primary border-t-transparent inline-block" />
            <p className="text-xs text-slate-500 mt-2">Memuat riwayat...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 bg-slate-950/20 border border-slate-850 rounded-3xl">
            <span className="text-3xl block mb-2">📋</span>
            <p className="text-xs text-slate-400 font-medium">Belum ada riwayat booking.</p>
            <p className="text-[10px] text-slate-500 mt-1">Gunakan form pencarian di atas atau lakukan pemesanan baru.</p>
            <button
              onClick={() => router.push("/booking")}
              className="mt-4 px-4 py-2 bg-gor-primary text-white text-xs font-bold rounded-xl"
            >
              Pesan Lapangan
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => {
              const isQris = booking.paymentMethod === "qris";
              const isUnpaid = booking.paymentStatus === "pending";
              const verification = booking.paymentVerificationStatus || "unsubmitted";

              // Setup verification status styling
              let verBadge = { bg: "bg-slate-950 text-slate-400 border-slate-800", text: "Belum Bayar" };
              if (verification === "pending_verification") {
                verBadge = { bg: "bg-amber-950/30 text-amber-400 border-amber-900/30", text: "Menunggu Verifikasi Admin" };
              } else if (verification === "verified") {
                verBadge = { bg: "bg-emerald-950/40 text-gor-court border-emerald-900/30", text: "Pembayaran Terverifikasi" };
              } else if (verification === "rejected") {
                verBadge = { bg: "bg-red-950/40 text-red-400 border-red-900/30", text: "Bukti Ditolak (Kirim Ulang)" };
              }

              return (
                <div
                  key={booking.id}
                  className="bg-slate-950/40 border border-slate-850 p-4 rounded-3xl space-y-3 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">
                        ID: {booking.id.split("_")[2] || booking.id.substring(0, 10)}
                      </span>
                      <h4 className="text-xs font-bold text-white mt-0.5">
                        Court {booking.courtId.split("-")[1]} • {booking.startTime} WIB
                      </h4>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{booking.date}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-extrabold text-slate-100 block">
                        {formatRupiah(booking.totalAmount)}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block mt-0.5">
                        {booking.paymentMethod.toUpperCase()} • {booking.bookingType}
                      </span>
                    </div>
                  </div>

                  {/* Verification Status Badge */}
                  <div className="flex items-center justify-between border-t border-slate-900 pt-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${verBadge.bg}`}>
                      {verBadge.text}
                    </span>

                    {/* Upload widget toggler */}
                    {isQris && (verification === "unsubmitted" || verification === "rejected") && (
                      <button
                        onClick={() => 
                          setUploadingBookingId(uploadingBookingId === booking.id ? null : booking.id)
                        }
                        className="text-[10px] text-gor-primary font-bold hover:underline"
                      >
                        {uploadingBookingId === booking.id ? "Batal" : "Upload Bukti Transfer"}
                      </button>
                    )}
                  </div>

                  {/* Receipt Upload File Form */}
                  {uploadingBookingId === booking.id && (
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-3 animate-fade-in">
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        Pilih Screenshot Pembayaran QRIS (Maks 2MB)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full text-slate-400 text-xs file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800"
                      />
                      {selectedFileBase64 && (
                        <div className="space-y-2">
                          <span className="text-[9px] text-emerald-400 block">✓ Foto terpilih</span>
                          <button
                            onClick={() => handleUploadProof(booking)}
                            disabled={loading}
                            className="w-full py-2 bg-gor-court text-white font-bold text-xs rounded-xl"
                          >
                            Kirim Bukti Pembayaran
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Display uploaded thumbnail mock if present */}
                  {booking.paymentProofUrl && (
                    <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-900 flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex items-center justify-center text-[10px] text-slate-500">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={booking.paymentProofUrl}
                          alt="Receipt Proof"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">Bukti Pembayaran Terkirim</span>
                        <span className="text-[9px] text-slate-500 block">Dapat diunggah ulang jika ditolak admin</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Back to Home Navigation */}
      <button
        onClick={() => router.push("/")}
        className="w-full mt-6 py-3.5 bg-slate-950/50 border border-slate-800 text-slate-400 hover:text-white rounded-2xl text-xs font-semibold transition-all text-center"
      >
        ← Kembali ke Beranda
      </button>
    </div>
  );
}
