"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah, getTimeSlotsForDate } from "@/lib/bookingHelpers";
import { Booking, MockUser, MockMember, CourtConfig } from "@/types";

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Tab State: "bookings" | "courts" | "members" | "accounts"
  const [activeTab, setActiveTab] = useState<string>("bookings");

  // Database States
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<MockUser[]>([]);
  const [members, setMembers] = useState<MockMember[]>([]);
  const [courts, setCourts] = useState<CourtConfig[]>([]);

  // UI Filters / Modal States
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [activeReceiptPreview, setActiveReceiptPreview] = useState<string | null>(null);
  const [showManualModal, setShowManualModal] = useState<boolean>(false);

  // Financial metrics & breakdown
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    activeMembersCount: 0,
    qrisRevenue: 0,
    codRevenue: 0,
    memberRevenue: 0,
  });

  // Modal Input: Add Manual Booking
  const [manualName, setManualName] = useState<string>("");
  const [manualPhone, setManualPhone] = useState<string>("");
  const [manualCourtId, setManualCourtId] = useState<string>("court-1");
  const [manualDate, setManualDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [manualStartTime, setManualStartTime] = useState<string>("");
  const [manualPaymentMethod, setManualPaymentMethod] = useState<"cod" | "transfer">("cod");
  const [manualLoading, setManualLoading] = useState<boolean>(false);

  // Modal Input: Block Court Slot
  const [blockCourtId, setBlockCourtId] = useState<string>("court-1");
  const [blockDate, setBlockDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [blockStartTime, setBlockStartTime] = useState<string>("");
  const [blockReason, setBlockReason] = useState<string>("TURNAMEN INTERNAL GOR");
  const [blockLoading, setBlockLoading] = useState<boolean>(false);

  // Form Input: Add Member Manual
  const [memberEmail, setMemberEmail] = useState<string>("");
  const [memberName, setMemberName] = useState<string>("");
  const [memberPhone, setMemberPhone] = useState<string>("");
  const [memberDuration, setMemberDuration] = useState<string>("30");
  const [memberLoading, setMemberLoading] = useState<boolean>(false);

  useEffect(() => {
    // Authentication Access Check
    const sessionStr = localStorage.getItem("gor_session");
    if (!sessionStr) {
      router.push("/login");
      return;
    }

    const session = JSON.parse(sessionStr);
    if (session.role !== "admin") {
      alert("Akses ditolak: Area khusus administrator.");
      router.push("/");
      return;
    }

    setIsAdmin(true);
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Parallel fetches for synced data loading
      const [resBookings, resAdmin] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/users")
      ]);

      const dataBookings = await resBookings.json();
      const dataAdmin = await resAdmin.json();

      if (dataBookings.success && dataAdmin.success) {
        setBookings(dataBookings.data || []);
        setUsers(dataAdmin.users || []);
        setMembers(dataAdmin.members || []);
        setCourts(dataAdmin.courts || []);
        calculateFinanceMetrics(dataBookings.data || []);
      }
    } catch (err) {
      console.error("Gagal memuat data admin:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateFinanceMetrics = (data: Booking[]) => {
    // 1. Total revenue (sum of verified paid bookings amount)
    const paidBookings = data.filter(
      (b) => b.paymentStatus === "success" && b.paymentVerificationStatus === "verified"
    );
    const totalRevenue = paidBookings.reduce((sum, b) => sum + b.amount, 0);

    // 2. Booking count
    const totalBookings = data.length;

    // 3. Unique members count (using active members array size)
    const activeMembersCount = members.length;

    // 4. Financial Breakdown
    // Sewa Reguler QRIS
    const qrisRevenue = paidBookings
      .filter((b) => b.bookingType === "regular" && b.paymentMethod === "qris")
      .reduce((sum, b) => sum + b.amount, 0);

    // Sewa Reguler COD (Paid manual cash)
    const codRevenue = paidBookings
      .filter((b) => b.bookingType === "regular" && b.paymentMethod === "cod")
      .reduce((sum, b) => sum + b.amount, 0);

    // Paket Membership Bulanan
    const memberRevenue = paidBookings
      .filter((b) => b.bookingType === "member")
      .reduce((sum, b) => sum + b.amount, 0);

    setMetrics({
      totalRevenue,
      totalBookings,
      activeMembersCount,
      qrisRevenue,
      codRevenue,
      memberRevenue
    });
  };

  // Verify Payment Screenshot Receipt
  const handleVerify = async (booking: Booking, decision: "approve" | "reject") => {
    setLoading(true);
    try {
      const targetBookingIds = booking.memberGroupId
        ? bookings.filter((b) => b.memberGroupId === booking.memberGroupId).map((b) => b.id)
        : [booking.id];

      const res = await fetch("/api/payments/qris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "admin_verify",
          bookingIds: targetBookingIds,
          adminDecision: decision,
        }),
      });

      const result = await res.json();
      if (result.success) {
        alert(`Pembayaran berhasil di-${decision === "approve" ? "setujui" : "tolak"}!`);
        setActiveReceiptPreview(null);
        fetchAdminData();
      } else {
        alert("Gagal memproses verifikasi: " + result.error);
        setLoading(false);
      }
    } catch (error) {
      alert("Koneksi gagal.");
      setLoading(false);
    }
  };

  // COD Quick cash verification handler
  const handleVerifyCodCash = async (booking: Booking) => {
    if (!confirm(`Tandai pembayaran COD senilai ${formatRupiah(booking.totalAmount)} sebagai LUNAS tunai?`)) return;
    setLoading(true);
    try {
      const res = await fetch("/api/payments/qris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingIds: [booking.id],
        }),
      });
      const result = await res.json();
      if (result.success) {
        alert("Pembayaran COD berhasil ditandai LUNAS.");
        fetchAdminData();
      } else {
        alert("Gagal memverifikasi COD: " + result.error);
        setLoading(false);
      }
    } catch (error) {
      alert("Koneksi gagal.");
      setLoading(false);
    }
  };

  // Reset database for developer testing convenience
  const handleResetDb = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus seluruh riwayat booking sewa lapangan?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/payments/qris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset_db",
          bookingIds: ["dummy"]
        })
      });
      const result = await res.json();
      if (result.success) {
        alert("Database booking berhasil direset.");
        fetchAdminData();
      }
    } catch (error) {
      alert("Gagal mereset database.");
    } finally {
      setLoading(false);
    }
  };

  // Save manual booking (WhatsApp entry)
  const handleSaveManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName || !manualDate || !manualStartTime) {
      alert("Mohon lengkapi nama, tanggal, dan jam sewa.");
      return;
    }
    setManualLoading(true);

    try {
      const pm = manualPaymentMethod === "transfer" ? "qris" : "cod";
      
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: manualName,
          phoneNumber: manualPhone || "081360078986",
          date: manualDate,
          startTime: manualStartTime,
          courtId: manualCourtId,
          bookingType: "regular",
          paymentMethod: pm
        }),
      });

      const result = await res.json();
      if (!result.success) {
        throw new Error(result.error || "Gagal menyimpan booking manual.");
      }

      // If Lunas is chosen, immediately flag paid
      if (manualPaymentMethod === "transfer") {
        const generatedBookingIds = result.data.map((b: Booking) => b.id);
        const payRes = await fetch("/api/payments/qris", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "admin_verify",
            bookingIds: generatedBookingIds,
            adminDecision: "approve",
          }),
        });
        const payResult = await payRes.json();
        if (!payResult.success) {
          console.error("Gagal verifikasi pembayaran transfer manual:", payResult.error);
        }
      }

      alert("Booking manual berhasil disimpan!");
      setManualName("");
      setManualPhone("");
      setManualStartTime("");
      setShowManualModal(false);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan.");
    } finally {
      setManualLoading(false);
    }
  };

  // Save manual slot block
  const handleSaveBlockSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockStartTime || !blockDate || !blockReason) {
      alert("Mohon isi seluruh kolom input.");
      return;
    }
    setBlockLoading(true);

    try {
      // Blocks are registered as regular bookings with blocked placeholders
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: `🔒 BLOCKED: ${blockReason.toUpperCase()}`,
          phoneNumber: "081360078986",
          date: blockDate,
          startTime: blockStartTime,
          courtId: blockCourtId,
          bookingType: "regular",
          paymentMethod: "cod"
        })
      });

      const result = await res.json();
      if (!result.success) {
        throw new Error(result.error || "Gagal memblokir slot.");
      }

      // Mark blocked slot as paid/verified immediately so it locks out
      const generatedIds = result.data.map((b: Booking) => b.id);
      await fetch("/api/payments/qris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "admin_verify",
          bookingIds: generatedIds,
          adminDecision: "approve"
        })
      });

      alert("Jadwal sewa lapangan berhasil diblokir.");
      setBlockStartTime("");
      setBlockReason("TURNAMEN INTERNAL GOR");
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan.");
    } finally {
      setBlockLoading(false);
    }
  };

  // Toggle court status (active vs maintenance)
  const handleToggleCourt = async (court: CourtConfig) => {
    const nextStatus = court.status === "active" ? "maintenance" : "active";
    if (!confirm(`Ubah status Court ${court.id.split("-")[1]} menjadi ${nextStatus.toUpperCase()}?`)) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_court",
          courtId: court.id,
          status: nextStatus
        })
      });
      const result = await res.json();
      if (result.success) {
        alert("Status lapangan diperbarui.");
        fetchAdminData();
      } else {
        alert("Gagal merubah status: " + result.error);
        setLoading(false);
      }
    } catch (e) {
      alert("Koneksi gagal.");
      setLoading(false);
    }
  };

  // Save manual member registration
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberEmail || !memberName || !memberPhone) {
      alert("Lengkapi semua form member.");
      return;
    }
    setMemberLoading(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_member",
          email: memberEmail,
          name: memberName,
          phone: memberPhone,
          durationDays: memberDuration
        })
      });
      const result = await res.json();
      if (result.success) {
        alert("Member berhasil ditambahkan.");
        setMemberEmail("");
        setMemberName("");
        setMemberPhone("");
        fetchAdminData();
      } else {
        alert("Gagal menambahkan member: " + result.error);
      }
    } catch (e) {
      alert("Koneksi gagal.");
    } finally {
      setMemberLoading(false);
    }
  };

  // Promote user / Change user role
  const handleToggleUserRole = async (user: MockUser) => {
    const nextRole = user.role === "admin" ? "user" : "admin";
    if (!confirm(`Ubah akses ${user.email} menjadi ${nextRole.toUpperCase()}?`)) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_role",
          email: user.email,
          role: nextRole
        })
      });
      const result = await res.json();
      if (result.success) {
        alert("Role user berhasil diperbarui.");
        fetchAdminData();
      } else {
        alert("Gagal mengubah role: " + result.error);
        setLoading(false);
      }
    } catch (e) {
      alert("Koneksi gagal.");
      setLoading(false);
    }
  };

  // Helper remaining days calculation
  const calculateRemainingDays = (endDateStr: string) => {
    const diff = new Date(endDateStr).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} Hari Aktif` : "Masa Aktif Habis";
  };

  if (!isAdmin) {
    return (
      <div className="flex-1 flex justify-center items-center bg-[#080b11] text-white">
        <span className="animate-spin rounded-full h-6 w-6 border-2 border-gor-primary border-t-transparent inline-block mr-2" />
        Verifikasi Hak Akses Admin...
      </div>
    );
  }

  // Filter Bookings list
  const filteredBookings = bookings.filter((b) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "pending") return b.paymentVerificationStatus === "pending_verification";
    if (filterStatus === "verified") return b.paymentVerificationStatus === "verified";
    if (filterStatus === "unsubmitted") return b.paymentVerificationStatus === "unsubmitted" || !b.paymentVerificationStatus;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col w-full max-w-lg mx-auto bg-[#070a13] border-x border-slate-900 min-h-screen px-4 py-8 relative overflow-hidden">
      
      {/* Ambient Glows */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[350px] h-[200px] bg-gor-primary/10 rounded-full blur-[80px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[200px] right-[-50px] w-[200px] h-[200px] bg-gor-bata/5 rounded-full blur-[70px] -z-10 pointer-events-none" />

      {/* Header bar */}
      <div className="flex justify-between items-center mb-6 z-10">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-1.5">
            Admin Panel <span className="text-slate-400">⚙️</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-wide">Kelola & verifikasi sewa lapangan real-time</p>
        </div>
        
        <button
          onClick={() => {
            localStorage.removeItem("gor_session");
            router.push("/");
          }}
          className="px-3 py-1.5 bg-slate-900/80 border border-slate-800 text-slate-300 text-[10px] font-bold rounded-xl hover:text-white hover:bg-slate-850 hover:border-slate-700 transition-all active:scale-95 shadow-md"
        >
          Keluar
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2.5 mb-4 text-center z-10">
        {/* Revenue Metric */}
        <div className="bg-gradient-to-br from-emerald-950/20 via-slate-950/40 to-slate-950/60 border border-emerald-500/20 p-3 rounded-2xl flex flex-col justify-between shadow-lg hover:border-emerald-500/30 transition-all duration-300">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Pendapatan</span>
          <span className="text-xs font-black text-emerald-400 block mt-1.5 leading-none">
            {formatRupiah(metrics.totalRevenue)}
          </span>
        </div>

        {/* Total Bookings Metric */}
        <div className="bg-gradient-to-br from-blue-950/20 via-slate-950/40 to-slate-950/60 border border-blue-500/20 p-3 rounded-2xl flex flex-col justify-between shadow-lg hover:border-blue-500/30 transition-all duration-300">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Total Sewa</span>
          <span className="text-xs font-black text-blue-400 block mt-1.5 leading-none">
            {metrics.totalBookings} Slot
          </span>
        </div>

        {/* Active Members Metric */}
        <div className="bg-gradient-to-br from-orange-950/20 via-slate-950/40 to-slate-950/60 border border-orange-500/20 p-3 rounded-2xl flex flex-col justify-between shadow-lg hover:border-orange-500/30 transition-all duration-300">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Member</span>
          <span className="text-xs font-black text-orange-400 block mt-1.5 leading-none">
            {metrics.activeMembersCount} Orang
          </span>
        </div>
      </div>

      {/* Financial Breakdown Panel */}
      <div className="bg-slate-950/50 backdrop-blur-md border border-slate-900 p-4.5 rounded-2xl mb-6 text-xs space-y-3 shadow-lg z-10">
        <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block border-b border-slate-900 pb-2 flex items-center gap-1.5">
          <span>📊</span> Detail Finansial GOR Terverifikasi
        </span>
        
        <div className="grid grid-cols-1 gap-2.5">
          <div className="flex justify-between items-center text-slate-400">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gor-primary rounded-full" />
              Sewa Reguler QRIS
            </span>
            <span className="text-white font-bold font-mono">{formatRupiah(metrics.qrisRevenue)}</span>
          </div>
          
          <div className="flex justify-between items-center text-slate-400">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              Sewa Reguler COD
            </span>
            <span className="text-white font-bold font-mono">{formatRupiah(metrics.codRevenue)}</span>
          </div>
          
          <div className="flex justify-between items-center text-slate-400">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gor-bata rounded-full" />
              Paket Member Bulanan
            </span>
            <span className="text-gor-bata font-black font-mono">{formatRupiah(metrics.memberRevenue)}</span>
          </div>
        </div>
      </div>

      {/* iOS-Style Pill Segmented Control Navigation */}
      <div className="bg-slate-950/70 p-1 border border-slate-900/80 rounded-2xl flex gap-1 mb-6 shadow-inner z-10">
        {[
          { id: "bookings", label: "Pesanan" },
          { id: "courts", label: "Lapangan" },
          { id: "members", label: "Member" },
          { id: "accounts", label: "Akun" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all duration-300 whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-[#0d1222] text-white shadow-md border border-slate-800/80"
                : "text-slate-500 hover:text-slate-350"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: KELOLA PESANAN PANEL */}
      {activeTab === "bookings" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Antrean Sewa Lapangan</h3>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowManualModal(true)}
                className="text-[9px] font-bold text-gor-court hover:text-emerald-400 border border-emerald-950 px-2 py-1 rounded bg-emerald-950/10 transition-all active:scale-95"
              >
                + Booking Manual
              </button>
              <button
                onClick={handleResetDb}
                className="text-[9px] font-bold text-red-500 hover:text-red-400 border border-red-950 px-2 py-1 rounded bg-red-950/10 transition-all active:scale-95"
              >
                Reset Database
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {[
              { id: "all", label: "Semua" },
              { id: "pending", label: "Pending Cek" },
              { id: "verified", label: "Lunas" },
              { id: "unsubmitted", label: "Belum Bayar" },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setFilterStatus(btn.id)}
                className={`px-3 py-1.5 rounded-xl border text-[10px] font-semibold transition-all whitespace-nowrap ${
                  filterStatus === btn.id
                    ? "bg-gor-primary border-gor-primary text-white"
                    : "bg-slate-950/30 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Bookings list */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-12">
                <span className="animate-spin rounded-full h-6 w-6 border-2 border-gor-primary border-t-transparent inline-block" />
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-12 bg-slate-950/20 border border-slate-850 rounded-2xl">
                <p className="text-xs text-slate-400">Tidak ada booking sewa lapangan.</p>
              </div>
            ) : (
              filteredBookings.map((booking) => {
                const verification = booking.paymentVerificationStatus || "unsubmitted";
                const isCod = booking.paymentMethod === "cod";
                const isUnpaid = booking.paymentStatus === "pending";

                return (
                  <div
                    key={booking.id}
                    className="bg-slate-955/40 border border-slate-850 p-4 rounded-3xl space-y-3 text-xs"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-white leading-tight">
                          {booking.customerName}
                        </h4>
                        <span className="text-[10px] text-slate-400">{booking.phoneNumber}</span>
                      </div>
                      <span className="font-bold text-slate-100">{formatRupiah(booking.totalAmount)}</span>
                    </div>

                    <div className="bg-slate-950/60 p-2.5 rounded-xl text-[10px] text-slate-400 space-y-1">
                      <div>Lapangan: <span className="text-slate-200">Court {booking.courtId.split("-")[1]}</span></div>
                      <div>Waktu: <span className="text-slate-200 font-mono">{booking.date} @ {booking.startTime} WIB</span></div>
                      <div>Paket: <span className="text-slate-200 uppercase">{booking.bookingType} • {booking.paymentMethod.toUpperCase()}</span></div>
                    </div>

                    {/* QRIS / Transfer receipt validation actions */}
                    {booking.paymentProofUrl && (
                      <div className="border-t border-slate-900/60 pt-3 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">Bukti Transfer:</span>
                        <button
                          onClick={() => setActiveReceiptPreview(booking.paymentProofUrl || null)}
                          className="px-3 py-1 bg-gor-primary/20 text-gor-primary border border-gor-primary/20 hover:bg-gor-primary/30 transition-all text-[10px] font-bold rounded-lg"
                        >
                          Lihat Bukti 📸
                        </button>
                      </div>
                    )}

                    {/* COD Quick actions */}
                    {isCod && isUnpaid && (
                      <div className="border-t border-slate-900/60 pt-3 flex gap-2">
                        <button
                          onClick={() => handleVerifyCodCash(booking)}
                          className="w-full py-1.5 bg-emerald-950/40 border border-emerald-800/40 text-gor-court font-semibold text-[10px] rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1"
                        >
                          <span>💵</span> Konfirmasi Bayar Tunai di Tempat
                        </button>
                      </div>
                    )}

                    {/* Verification status label */}
                    <div className="flex justify-between items-center text-[9px] text-slate-500 font-semibold mt-1">
                      <span>Status Pembayaran:</span>
                      <span className={`uppercase font-bold ${
                        verification === "verified"
                          ? "text-gor-court"
                          : verification === "pending_verification"
                          ? "text-amber-400 font-extrabold"
                          : verification === "rejected"
                          ? "text-red-400"
                          : "text-slate-400"
                      }`}>
                        {verification === "verified"
                          ? "Lunas (Terverifikasi)"
                          : verification === "pending_verification"
                          ? "Menunggu Konfirmasi"
                          : verification === "rejected"
                          ? "Bukti Ditolak"
                          : "Belum Bayar"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: KELOLA LAPANGAN PANEL */}
      {activeTab === "courts" && (
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Status Operasional Lapangan</h3>
            
            <div className="grid grid-cols-1 gap-2.5">
              {courts.map((court) => (
                <div 
                  key={court.id}
                  className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl flex justify-between items-center text-xs"
                >
                  <div>
                    <span className="font-bold text-white block">Court {court.id.split("-")[1]}</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Status: {court.status === "active" ? "Aktif 🟢" : "Dalam Perbaikan 🛠️"}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleCourt(court)}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                      court.status === "active"
                        ? "bg-amber-950/20 border-amber-900/30 text-amber-400"
                        : "bg-emerald-950/20 border-emerald-900/30 text-gor-court"
                    }`}
                  >
                    {court.status === "active" ? "Set Maintenance" : "Aktifkan"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Block Court Slot Form */}
          <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-3xl space-y-4">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider block">Blokir Slot Lapangan Manual</h4>
              <p className="text-[10px] text-slate-400 mt-1">Blokir slot jam untuk keperluan pribadi/turnamen internal GOR.</p>
            </div>

            <form onSubmit={handleSaveBlockSlot} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Lapangan</label>
                  <select
                    value={blockCourtId}
                    onChange={(e) => setBlockCourtId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white"
                  >
                    <option value="court-1">Court 1 (Vinyl)</option>
                    <option value="court-2">Court 2 (Vinyl)</option>
                    <option value="court-3">Court 3 (Semen)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={blockDate}
                    onChange={(e) => setBlockDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Jam Slot (2 Jam)</label>
                <select
                  value={blockStartTime}
                  onChange={(e) => setBlockStartTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white"
                  required
                >
                  <option value="">-- Pilih Jam --</option>
                  {getTimeSlotsForDate(blockDate).map((slot) => (
                    <option key={slot.startTime} value={slot.startTime}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Alasan Pemblokiran</label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white"
                  placeholder="Turnamen, Maintenance, Latihan, dll."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={blockLoading}
                className="w-full py-2 bg-gor-bata text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-950/20 transition-all active:scale-95"
              >
                {blockLoading ? "Memblokir..." : "Kunci Slot Lapangan"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: KELOLA MEMBER PANEL */}
      {activeTab === "members" && (
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Daftar Member Aktif</h3>
            
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {members.length === 0 ? (
                <div className="text-center py-8 bg-slate-950/20 border border-slate-850 rounded-2xl">
                  <p className="text-xs text-slate-400">Tidak ada member aktif saat ini.</p>
                </div>
              ) : (
                members.map((member) => (
                  <div 
                    key={member.id}
                    className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl text-xs space-y-1 relative"
                  >
                    <span className="absolute top-4 right-4 text-[9px] bg-orange-950/30 text-gor-bata border border-gor-bata/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      {calculateRemainingDays(member.endDate)}
                    </span>
                    
                    <span className="font-bold text-white block">{member.name}</span>
                    <span className="text-[10px] text-slate-400 block">{member.email}</span>
                    <span className="text-[10px] text-slate-400 block">{member.phone}</span>
                    <span className="text-[9px] text-slate-500 block pt-1 border-t border-slate-900 mt-2">
                      Masa Aktif: {member.startDate.split("T")[0]} s/d {member.endDate.split("T")[0]}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add member form */}
          <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-3xl space-y-4">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider block">Registrasi Member Baru Manual</h4>
              <p className="text-[10px] text-slate-400 mt-1">Daftarkan member baru langsung dari admin.</p>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nama Member</label>
                <input
                  type="text"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white"
                  placeholder="Contoh: Pak Ahmad"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white"
                    placeholder="nama@email.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">WhatsApp</label>
                  <input
                    type="tel"
                    value={memberPhone}
                    onChange={(e) => setMemberPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white"
                    placeholder="0813..."
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Durasi Paket (Rp400.000 / bln)</label>
                <select
                  value={memberDuration}
                  onChange={(e) => setMemberDuration(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white"
                >
                  <option value="30">1 Bulan (30 Hari)</option>
                  <option value="60">2 Bulan (60 Hari)</option>
                  <option value="90">3 Bulan (90 Hari)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={memberLoading}
                className="w-full py-2 bg-gor-primary text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-950/20 transition-all active:scale-95"
              >
                {memberLoading ? "Mendaftarkan..." : "Daftarkan Member"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: KELOLA AKUN PANEL */}
      {activeTab === "accounts" && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Daftar Akun Pengguna</h3>
          
          <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
            {users.map((user) => (
              <div 
                key={user.email}
                className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl text-xs flex justify-between items-center"
              >
                <div>
                  <span className="font-bold text-white block">
                    {user.name} 
                    {user.role === "admin" && <span className="text-[9px] bg-red-950/30 border border-red-900/30 text-red-400 px-1.5 py-0.5 rounded ml-1 font-bold">ADMIN</span>}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">{user.email}</span>
                  <span className="text-[10px] text-slate-400 block">{user.phone}</span>
                </div>

                <button
                  onClick={() => handleToggleUserRole(user)}
                  className={`px-3 py-1.5 text-[9px] font-bold rounded-lg border transition-all ${
                    user.role === "admin"
                      ? "bg-red-950/20 border-red-900/30 text-red-400"
                      : "bg-blue-950/20 border-blue-900/30 text-blue-400"
                  }`}
                >
                  {user.role === "admin" ? "Jadikan User" : "Jadikan Admin"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Receipt Preview & Approval Modal */}
      {activeReceiptPreview && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all duration-300">
          <div className="w-full max-w-sm bg-[#0a0d16] p-6 rounded-3xl border border-slate-850 space-y-4 shadow-2xl shadow-blue-950/10">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>📸</span> Verifikasi Bukti Bayar
              </span>
              <button 
                onClick={() => setActiveReceiptPreview(null)}
                className="text-slate-400 hover:text-white text-xs font-bold transition-colors"
              >
                Tutup
              </button>
            </div>
            
            <div className="relative h-72 w-full bg-[#05070c] rounded-2xl overflow-hidden border border-slate-900 flex items-center justify-center shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeReceiptPreview}
                alt="Receipt Detail"
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {/* Verification actions inside modal */}
            {(() => {
              // Find the booking matching active receipt to get details for buttons
              const matchedBooking = bookings.find((b) => b.paymentProofUrl === activeReceiptPreview);
              if (matchedBooking && matchedBooking.paymentVerificationStatus === "pending_verification") {
                return (
                  <div className="flex gap-2.5 pt-1">
                    <button
                      onClick={() => handleVerify(matchedBooking, "reject")}
                      className="flex-1 py-3 bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-950/40 font-bold text-xs rounded-xl transition-all active:scale-95"
                    >
                      Tolak Bukti ❌
                    </button>
                    <button
                      onClick={() => handleVerify(matchedBooking, "approve")}
                      className="flex-1 py-3 bg-emerald-950/30 border border-emerald-800/30 text-gor-court hover:bg-emerald-950/50 font-black text-xs rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-950/10"
                    >
                      Setujui Bayar ✓
                    </button>
                  </div>
                );
              }
              return (
                <div className="text-center text-[10px] text-slate-500 font-medium py-2.5 bg-slate-950/30 rounded-xl border border-slate-900 italic">
                  * Bukti transaksi ini telah diverifikasi.
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Quick navigation */}
      <button
        onClick={() => router.push("/")}
        className="w-full mt-6 py-3.5 bg-slate-950/50 border border-slate-800 text-slate-400 hover:text-white rounded-2xl text-xs font-semibold transition-all text-center"
      >
        ← Halaman Utama
      </button>

      {/* Manual Booking Modal Popup (WhatsApp booking input) */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleSaveManualBooking}
            className="w-full max-w-sm bg-[#0a0d16] border border-slate-850 p-6 rounded-3xl space-y-4 shadow-2xl text-xs"
          >
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1">
                <span>➕</span> Booking Manual GOR
              </h3>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold transition-colors"
              >
                Tutup
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Nama Penyewa</label>
                <input
                  type="text"
                  placeholder="Contoh: Pak Ahmad via WA"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full bg-[#05070c] border border-slate-900 focus:border-slate-750 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-gor-primary/10 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Nomor WhatsApp (Opsional)</label>
                <input
                  type="tel"
                  placeholder="Contoh: 081360078986"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  className="w-full bg-[#05070c] border border-slate-900 focus:border-slate-750 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-gor-primary/10 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Lapangan</label>
                  <select
                    value={manualCourtId}
                    onChange={(e) => setManualCourtId(e.target.value)}
                    className="w-full bg-[#05070c] border border-slate-900 focus:border-slate-750 rounded-xl px-2.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-gor-primary/10 transition-all"
                  >
                    <option value="court-1">Court 1 (Vinyl)</option>
                    <option value="court-2">Court 2 (Vinyl)</option>
                    <option value="court-3">Court 3 (Semen)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Tanggal</label>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => {
                      setManualDate(e.target.value);
                      setManualStartTime(""); // Reset selected slot
                    }}
                    className="w-full bg-[#05070c] border border-slate-900 focus:border-slate-750 rounded-xl px-2 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-gor-primary/10 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Jam Slot (2 Jam)</label>
                <select
                  value={manualStartTime}
                  onChange={(e) => setManualStartTime(e.target.value)}
                  className="w-full bg-[#05070c] border border-slate-900 focus:border-slate-750 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-gor-primary/10 transition-all"
                  required
                >
                  <option value="">-- Pilih Jam --</option>
                  {getTimeSlotsForDate(manualDate).map((slot) => (
                    <option key={slot.startTime} value={slot.startTime}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5 font-semibold">Status Pembayaran</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setManualPaymentMethod("cod")}
                    className={`py-2.5 px-3 border rounded-xl font-bold transition-all text-center text-[10px] active:scale-95 ${
                      manualPaymentMethod === "cod"
                        ? "bg-gor-court/10 border-gor-court/50 text-white"
                        : "bg-[#05070c] border-slate-900 text-slate-500 hover:text-slate-400"
                    }`}
                  >
                    COD / Belum Lunas
                  </button>

                  <button
                    type="button"
                    onClick={() => setManualPaymentMethod("transfer")}
                    className={`py-2.5 px-3 border rounded-xl font-bold transition-all text-center text-[10px] active:scale-95 ${
                      manualPaymentMethod === "transfer"
                        ? "bg-[#0d1222] border-gor-primary/50 text-white"
                        : "bg-[#05070c] border-slate-900 text-slate-500 hover:text-slate-400"
                    }`}
                  >
                    Transfer / Lunas
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={manualLoading}
                className="w-full py-3.5 bg-gor-primary hover:bg-blue-600 text-white rounded-xl font-black text-xs shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all active:scale-95 flex justify-center items-center gap-2 border border-blue-400/20"
              >
                {manualLoading ? (
                  <>
                    <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Booking Manual"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
