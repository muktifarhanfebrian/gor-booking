"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah, getTimeSlotsForDate } from "@/lib/bookingHelpers";
import { Booking, MockUser, MockMember, CourtConfig } from "@/types";
import { CourtsManager } from "@/components/admin/CourtsManager";
import { UsersManager } from "@/components/admin/UsersManager";

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
      alert("Gagal memproses data. Periksa koneksi internet Anda dan coba lagi.");
    } finally {
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
      alert("Gagal memproses data. Periksa koneksi internet Anda dan coba lagi.");
    } finally {
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
      alert("Gagal memproses data. Periksa koneksi internet Anda dan coba lagi.");
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
      alert("Gagal memproses data. Periksa koneksi internet Anda dan coba lagi.");
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
      alert("Gagal memproses data. Periksa koneksi internet Anda dan coba lagi.");
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
      alert("Gagal memproses data. Periksa koneksi internet Anda dan coba lagi.");
    } finally {
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
      alert("Gagal memproses data. Periksa koneksi internet Anda dan coba lagi.");
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
      <div className="flex-1 flex justify-center items-center bg-slate-950 text-white relative overflow-hidden">
        {/* Decorative radial gradients */}
        <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="fixed bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-lime-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />
        <div className="flex flex-col items-center gap-3">
          <span className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
          <p className="text-xs text-slate-400 font-medium">Verifikasi Hak Akses Admin...</p>
        </div>
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

  // Tab config
  const tabs = [
    { id: "bookings", label: "Pesanan", icon: "📋" },
    { id: "courts", label: "Lapangan", icon: "🏸" },
    { id: "members", label: "Member", icon: "👥" },
    { id: "accounts", label: "Akun", icon: "🔑" },
  ];

  // Status badge helper
  const getStatusBadge = (verification: string) => {
    if (verification === "verified") return { text: "Lunas ✓", cls: "bg-lime-500/15 text-lime-400 border-lime-500/30" };
    if (verification === "pending_verification") return { text: "Menunggu ⏳", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" };
    if (verification === "rejected") return { text: "Ditolak ✗", cls: "bg-red-500/15 text-red-400 border-red-500/30" };
    return { text: "Belum Bayar", cls: "bg-slate-500/15 text-slate-400 border-slate-500/30" };
  };

  return (
    <div className="flex-1 flex flex-col w-full max-w-md md:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 py-6 bg-slate-950 min-h-screen relative overflow-hidden">

      {/* ── BACKGROUND GLOWS ─────────────────────── */}
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-lime-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="space-y-5">

        {/* ── HEADER ───────────────────────────────── */}
        <div className="flex justify-between items-center">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
                <span className="text-xs">⚙️</span>
              </div>
              <h1 className="text-lg font-black text-white tracking-tight">Admin Panel</h1>
            </div>
            <p className="text-[10px] text-slate-500 font-medium pl-9">Kelola & verifikasi sewa lapangan GOR Pandu</p>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem("gor_session");
              router.push("/");
            }}
            className="px-3 py-1.5 bg-white/5 border border-white/10 text-slate-400 hover:text-white text-[10px] font-bold rounded-xl hover:bg-white/8 hover:border-white/15 transition-all active:scale-95"
          >
            Keluar →
          </button>
        </div>

        {/* ── METRICS CARDS ────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Revenue */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950/40 to-emerald-900/5 border border-emerald-500/20 p-3.5 rounded-2xl shadow-xl hover:border-emerald-500/30 transition-all group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl" />
            <p className="text-[9px] text-emerald-400/70 font-black uppercase tracking-widest">Pendapatan</p>
            <p className="text-[13px] font-black text-emerald-300 mt-1.5 leading-none tabular-nums">
              {formatRupiah(metrics.totalRevenue)}
            </p>
          </div>

          {/* Total Bookings */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-950/40 to-blue-900/5 border border-blue-500/20 p-3.5 rounded-2xl shadow-xl hover:border-blue-500/30 transition-all group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-xl" />
            <p className="text-[9px] text-blue-400/70 font-black uppercase tracking-widest">Total Sewa</p>
            <p className="text-2xl font-black text-blue-300 mt-1.5 leading-none">{metrics.totalBookings}</p>
            <p className="text-[9px] text-blue-400/50 font-semibold -mt-0.5">slot booking</p>
          </div>

          {/* Members */}
          <div className="relative overflow-hidden bg-gradient-to-br from-orange-950/40 to-orange-900/5 border border-orange-500/20 p-3.5 rounded-2xl shadow-xl hover:border-orange-500/30 transition-all group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 rounded-full blur-xl" />
            <p className="text-[9px] text-orange-400/70 font-black uppercase tracking-widest">Member</p>
            <p className="text-2xl font-black text-orange-300 mt-1.5 leading-none">{metrics.activeMembersCount}</p>
            <p className="text-[9px] text-orange-400/50 font-semibold -mt-0.5">orang aktif</p>
          </div>
        </div>

        {/* ── FINANCIAL BREAKDOWN ───────────────────── */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl overflow-hidden relative z-10">
          <div className="px-4 py-2.5 border-b border-white/6 flex items-center gap-1.5">
            <span className="text-[10px]">📊</span>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Detail Finansial Terverifikasi</span>
          </div>
          <div className="px-4 py-3 space-y-2.5 text-xs">
            {[
              { dot: "bg-blue-500", label: "Sewa Reguler QRIS", value: formatRupiah(metrics.qrisRevenue), valCls: "text-white" },
              { dot: "bg-emerald-500", label: "Sewa Reguler COD", value: formatRupiah(metrics.codRevenue), valCls: "text-white" },
              { dot: "bg-orange-400", label: "Paket Member Bulanan", value: formatRupiah(metrics.memberRevenue), valCls: "text-orange-300 font-black" },
            ].map((row, i) => (
              <div key={i} className="flex justify-between items-center text-slate-400">
                <span className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${row.dot}`} />
                  {row.label}
                </span>
                <span className={`font-mono font-bold ${row.valCls}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── iOS SEGMENTED TAB CONTROL ────────────── */}
        <div className="bg-slate-900/40 backdrop-blur-md p-1 rounded-2xl flex gap-1 border border-slate-800/60 shadow-inner relative z-10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-slate-800 text-lime-400 shadow-lg border border-slate-700"
                  : "text-slate-500 hover:text-slate-400"
              }`}
            >
              <span className="text-sm leading-none">{tab.icon}</span>
              <span className="text-[9px] font-black mt-0.5 uppercase tracking-wider">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ─────────────────────────────────────────── */}
        {/* TAB 1: KELOLA PESANAN                     */}
        {/* ─────────────────────────────────────────── */}
        {activeTab === "bookings" && (
          <div className="space-y-4">
            {/* Top bar */}
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">Antrean Booking</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowManualModal(true)}
                  className="flex items-center gap-1 text-[9px] font-black text-emerald-400 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl bg-emerald-500/8 hover:bg-emerald-500/15 transition-all active:scale-95"
                >
                  ＋ Manual
                </button>
                <button
                  onClick={handleResetDb}
                  className="text-[9px] font-bold text-red-400 border border-red-500/20 px-2.5 py-1.5 rounded-xl bg-red-500/8 hover:bg-red-500/15 transition-all active:scale-95"
                >
                  Reset DB
                </button>
              </div>
            </div>

            {/* Filter chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {[
                { id: "all", label: "Semua" },
                { id: "pending", label: "⏳ Pending" },
                { id: "verified", label: "✓ Lunas" },
                { id: "unsubmitted", label: "Belum Bayar" },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setFilterStatus(btn.id)}
                  className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                    filterStatus === btn.id
                      ? "bg-blue-500 border-blue-400 text-white shadow-md shadow-blue-500/20"
                      : "bg-slate-900/40 border-slate-800/60 text-slate-400 hover:text-slate-300 hover:border-slate-700"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Bookings list */}
            <div className="space-y-2.5">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white/[0.02] border border-white/6 rounded-2xl p-4 space-y-4 animate-pulse">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 w-1/2">
                        <div className="h-4 bg-white/10 rounded-md w-3/4"></div>
                        <div className="h-3 bg-white/5 rounded-md w-1/2"></div>
                      </div>
                      <div className="h-4 bg-white/10 rounded-md w-1/4"></div>
                    </div>
                    <div className="h-16 bg-white/5 rounded-xl w-full"></div>
                  </div>
                ))
              ) : filteredBookings.length === 0 ? (
                <div className="text-center py-20 px-6 bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-3xl shadow-2xl flex flex-col items-center justify-center">
                  <div className="w-20 h-20 mb-4 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                    <span className="text-4xl opacity-80">☕</span>
                  </div>
                  <h4 className="text-sm font-black text-white mb-2 tracking-wide">Semua Bersih!</h4>
                  <p className="text-xs text-slate-400 font-medium max-w-[250px] leading-relaxed">
                    Belum ada antrean booking untuk hari ini. Santai dulu!
                  </p>
                </div>
              ) : (
                filteredBookings.map((booking) => {
                  const verification = booking.paymentVerificationStatus || "unsubmitted";
                  const isCod = booking.paymentMethod === "cod";
                  const isUnpaid = booking.paymentStatus === "pending";
                  const badge = getStatusBadge(verification);

                  const maskPhone = (phone: string) => {
                    if (!phone) return "-";
                    const p = phone.replace(/\D/g, "");
                    if (p.length < 8) return p;
                    return p.slice(0, 4) + "-" + p.slice(4, 8) + "-" + p.slice(8);
                  };

                  const handleWhatsAppNotification = (booking: Booking, status: "approve" | "reject") => {
                    let phone = booking.phoneNumber.replace(/\D/g, "");
                    if (phone.startsWith("0")) phone = "62" + phone.slice(1);

                    const courtName = courts.find(c => c.id === booking.courtId)?.name || booking.courtId;
                    const isApprove = status === "approve";
                    const statusText = isApprove ? "DISETUJUI" : "DITOLAK";
                    const note = isApprove 
                      ? "Silakan datang ke GOR Pandu 15 menit sebelum jadwal. Tunjukkan pesan ini ke pengelola." 
                      : "Silakan hubungi admin untuk pengembalian dana (jika ada) atau ganti jadwal.";
                    
                    const message = `Halo ${booking.customerName},\n\nBooking Anda untuk lapangan *${courtName}* pada tanggal *${booking.date}* jam *${booking.startTime} WIB* telah *${statusText}*.\n\n${note}\n\nTerima kasih,\nAdmin GOR Pandu`;

                    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                    window.open(url, "_blank");
                  };

                  const courtName = courts.find(c => c.id === booking.courtId)?.name || booking.courtId;

                  return (
                    <div
                      key={booking.id}
                      className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 hover:border-slate-700 p-4 rounded-2xl space-y-3 text-xs transition-all group relative z-10"
                    >
                      {/* Row 1: Name + Amount */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-black text-white text-sm leading-tight">{booking.customerName}</h4>
                          <span className="text-[10px] text-slate-500 font-mono">{maskPhone(booking.phoneNumber)}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-white text-sm leading-tight">{formatRupiah(booking.totalAmount)}</p>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${badge.cls}`}>
                            {badge.text}
                          </span>
                        </div>
                      </div>

                      {/* Row 2: Details */}
                      <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl px-3 py-2 space-y-1 text-[10px] text-slate-400">
                        <div className="flex justify-between">
                          <span>Lapangan</span>
                          <span className="text-slate-200 font-bold">{courtName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Waktu</span>
                          <span className="text-slate-200 font-mono">{booking.date} · {booking.startTime} WIB</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Paket</span>
                          <span className="text-slate-200 uppercase font-semibold">{booking.bookingType} · {booking.paymentMethod}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-2 flex flex-col sm:flex-row gap-2">
                        {/* Receipt button */}
                        {booking.paymentProofUrl && (
                          <button
                            onClick={() => setActiveReceiptPreview(booking.paymentProofUrl || null)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-500/12 text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 transition-all text-[10px] font-black rounded-xl active:scale-95"
                          >
                            📸 Lihat Bukti Bayar
                          </button>
                        )}

                        {/* COD Confirm button */}
                        {isCod && isUnpaid && (
                          <button
                            onClick={() => handleVerifyCodCash(booking)}
                            className="flex-1 py-2 bg-emerald-500/12 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 font-black text-[10px] rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5"
                          >
                            💵 Konfirmasi Tunai Lunas
                          </button>
                        )}

                        {/* WA Notify Buttons (Visible on hover/always on mobile) */}
                        <div className="flex-1 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                           <button
                            onClick={() => handleWhatsAppNotification(booking, "approve")}
                            className="flex-1 py-2 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/20 font-black text-[10px] rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1"
                            title="Kirim WA Setuju"
                          >
                            💬 WA Setuju
                          </button>
                          <button
                            onClick={() => handleWhatsAppNotification(booking, "reject")}
                            className="flex-1 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 font-black text-[10px] rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1"
                            title="Kirim WA Tolak"
                          >
                            💬 WA Tolak
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────── */}
        {/* TAB 2: KELOLA LAPANGAN                    */}
        {/* ─────────────────────────────────────────── */}
        {activeTab === "courts" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <CourtsManager />
            </div>

            <div className="lg:col-span-1">
              {/* Block Slot Form */}
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl overflow-hidden relative z-10">
                <div className="px-4 py-3 border-b border-slate-800/60">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Blokir Slot Lapangan</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Kunci slot untuk turnamen, latihan, atau maintenance.</p>
                </div>
                <form onSubmit={handleSaveBlockSlot} className="px-4 py-4 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="flex flex-col gap-1.5 w-full">
                      <label className="text-slate-400 font-semibold">Lapangan</label>
                      <select
                        value={blockCourtId}
                        onChange={(e) => setBlockCourtId(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500/50 transition-all"
                      >
                        {courts.map((c) => (
                          <option key={c.id} value={c.id} className="bg-slate-950 text-white">
                            {c.name || c.id} {c.status === "maintenance" ? "(Maintenance)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5 w-full">
                      <label className="text-slate-400 font-semibold">Tanggal</label>
                      <input
                        type="date"
                        value={blockDate}
                        onChange={(e) => setBlockDate(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500/50 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 w-full">
                    <label className="text-slate-400 font-semibold">Jam Slot (2 Jam)</label>
                    <select
                      value={blockStartTime}
                      onChange={(e) => setBlockStartTime(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500/50 transition-all"
                      required
                    >
                      <option value="" className="bg-slate-950 text-white">-- Pilih Jam --</option>
                      {getTimeSlotsForDate(blockDate).map((slot) => (
                        <option key={slot.startTime} value={slot.startTime} className="bg-slate-950 text-white">
                          {slot.label}
                        </option>
                      ))}
                    </select>
                  </div>

                <div>
                  <label className="block text-slate-400 mb-1.5 font-semibold">Alasan Pemblokiran</label>
                  <input
                    type="text"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500/50 transition-all"
                    placeholder="Turnamen, Maintenance, dll."
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={blockLoading}
                  className="w-full py-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs rounded-xl shadow-lg shadow-orange-600/15 transition-all active:scale-95 flex justify-center items-center gap-2"
                >
                  {blockLoading ? (
                    <><span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" /> Memblokir...</>
                  ) : "🔒 Kunci Slot Lapangan"}
                </button>
              </form>
            </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────── */}
        {/* TAB 3: KELOLA MEMBER                      */}
        {/* ─────────────────────────────────────────── */}
        {activeTab === "members" && (
          <div className="space-y-5">
            <div className="space-y-2.5">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">Daftar Member Aktif</h3>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
                {members.length === 0 ? (
                  <div className="text-center py-16 px-6 bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 rounded-3xl backdrop-blur-md shadow-2xl flex flex-col items-center justify-center mb-4">
                    <div className="w-16 h-16 mb-4 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                      <span className="text-3xl opacity-80">👥</span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium max-w-[200px] leading-relaxed">
                      Belum ada member bulanan aktif yang terdaftar.
                    </p>
                  </div>
                ) : (
                  members.map((member) => (
                    <div
                      key={member.id}
                      className="bg-white/[0.025] border border-white/8 p-4 rounded-2xl text-xs relative"
                    >
                      <span className="absolute top-3.5 right-3.5 text-[9px] bg-orange-500/15 text-orange-300 border border-orange-500/25 px-2 py-0.5 rounded-lg font-black">
                        {calculateRemainingDays(member.endDate)}
                      </span>
                      <p className="font-black text-white text-sm leading-tight">{member.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{member.email}</p>
                      <p className="text-[10px] text-slate-400">{member.phone}</p>
                      <p className="text-[9px] text-slate-600 mt-2 pt-2 border-t border-white/6">
                        {member.startDate.split("T")[0]} s/d {member.endDate.split("T")[0]}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add Member Form */}
            <div className="bg-white/[0.025] border border-white/8 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/6">
                <h4 className="text-xs font-black text-white uppercase tracking-wider">Registrasi Member Baru</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Daftarkan member baru langsung dari admin panel.</p>
              </div>
              <form onSubmit={handleSaveMember} className="px-4 py-4 space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1.5 font-semibold">Nama Member</label>
                  <input
                    type="text"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500/50 transition-all"
                    placeholder="Contoh: Pak Ahmad"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-400 mb-1.5 font-semibold">Email</label>
                    <input
                      type="email"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500/50 transition-all"
                      placeholder="nama@email.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1.5 font-semibold">WhatsApp</label>
                    <input
                      type="tel"
                      value={memberPhone}
                      onChange={(e) => setMemberPhone(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500/50 transition-all"
                      placeholder="0813..."
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1.5 font-semibold">Durasi Paket (Rp400.000/bln)</label>
                  <select
                    value={memberDuration}
                    onChange={(e) => setMemberDuration(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500/50 transition-all"
                  >
                    <option value="30" className="bg-[#0d1526] text-white">1 Bulan (30 Hari)</option>
                    <option value="60" className="bg-[#0d1526] text-white">2 Bulan (60 Hari)</option>
                    <option value="90" className="bg-[#0d1526] text-white">3 Bulan (90 Hari)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={memberLoading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-600/15 transition-all active:scale-95 flex justify-center items-center gap-2"
                >
                  {memberLoading ? (
                    <><span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" /> Mendaftarkan...</>
                  ) : "👥 Daftarkan Member"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────── */}
        {/* TAB 4: KELOLA AKUN                        */}
        {/* ─────────────────────────────────────────── */}
        {activeTab === "accounts" && (
          <div className="space-y-5">
            <UsersManager />
          </div>
        )}

        {/* ── BACK BUTTON ──────────────────────────── */}
        <button
          onClick={() => router.push("/")}
          className="w-full py-3 bg-white/[0.03] border border-white/8 text-slate-500 hover:text-slate-300 rounded-2xl text-xs font-semibold transition-all text-center hover:border-white/12 active:scale-95"
        >
          ← Kembali ke Halaman Utama
        </button>
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/*  RECEIPT VERIFICATION MODAL                   */}
      {/* ══════════════════════════════════════════════ */}
      {activeReceiptPreview && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-end sm:items-center justify-center p-4 transition-all duration-300"
          onClick={(e) => { if (e.target === e.currentTarget) setActiveReceiptPreview(null); }}
        >
          <div className="w-full max-w-sm bg-[#0a0d18] border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/50 animate-in slide-in-from-bottom-4 duration-300">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-white/8">
              <div className="flex items-center gap-2">
                <span className="text-base">📸</span>
                <span className="text-xs font-black text-white uppercase tracking-wider">Verifikasi Bukti Bayar</span>
              </div>
              <button
                onClick={() => setActiveReceiptPreview(null)}
                className="w-7 h-7 bg-white/8 hover:bg-white/15 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-all text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Receipt Image */}
            <div className="bg-[#030508] flex items-center justify-center min-h-[280px] max-h-[360px] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeReceiptPreview}
                alt="Bukti Transfer"
                className="max-w-full max-h-[360px] object-contain"
              />
            </div>

            {/* Action Buttons */}
            <div className="px-5 py-4 border-t border-white/8">
              {(() => {
                const matchedBooking = bookings.find((b) => b.paymentProofUrl === activeReceiptPreview);
                if (matchedBooking && matchedBooking.paymentVerificationStatus === "pending_verification") {
                  return (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleVerify(matchedBooking, "reject")}
                        className="flex-1 py-3 bg-red-500/12 border border-red-500/25 text-red-300 hover:bg-red-500/20 font-black text-xs rounded-2xl transition-all active:scale-95"
                      >
                        ✕ Tolak
                      </button>
                      <button
                        onClick={() => handleVerify(matchedBooking, "approve")}
                        className="flex-1 py-3 bg-emerald-500/20 border border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/30 font-black text-xs rounded-2xl transition-all active:scale-95 shadow-lg shadow-emerald-500/10"
                      >
                        ✓ Setujui Lunas
                      </button>
                    </div>
                  );
                }
                return (
                  <div className="py-2 text-center text-[10px] text-slate-500 bg-white/[0.02] rounded-xl border border-white/6 font-medium italic">
                    * Bukti transaksi ini telah diverifikasi.
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/*  MANUAL BOOKING MODAL                         */}
      {/* ══════════════════════════════════════════════ */}
      {showManualModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-end sm:items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowManualModal(false); }}
        >
          <form
            onSubmit={handleSaveManualBooking}
            className="w-full max-w-sm bg-[#0a0d18] border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/50"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-white/8">
              <div className="flex items-center gap-2">
                <span className="text-base">➕</span>
                <span className="text-xs font-black text-white uppercase tracking-wider">Booking Manual GOR</span>
              </div>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="w-7 h-7 bg-white/8 hover:bg-white/15 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-all text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Form Fields */}
            <div className="px-5 py-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1.5 font-semibold">Nama Penyewa</label>
                <input
                  type="text"
                  placeholder="Contoh: Pak Ahmad via WA"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/10 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5 font-semibold">Nomor WhatsApp (Opsional)</label>
                <input
                  type="tel"
                  placeholder="081360078986"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-400 mb-1.5 font-semibold">Lapangan</label>
                  <select
                    value={manualCourtId}
                    onChange={(e) => setManualCourtId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500/40 transition-all"
                  >
                    {courts.filter(c => c.status === "active").map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#0d1526] text-white">
                        {c.name || c.id}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1.5 font-semibold">Tanggal</label>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => {
                      setManualDate(e.target.value);
                      setManualStartTime("");
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-2.5 py-2.5 text-white focus:outline-none focus:border-blue-500/40 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5 font-semibold">Jam Slot (2 Jam)</label>
                <select
                  value={manualStartTime}
                  onChange={(e) => setManualStartTime(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500/40 transition-all"
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
                    className={`py-2.5 px-3 border rounded-xl font-black transition-all text-center text-[10px] active:scale-95 ${
                      manualPaymentMethod === "cod"
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                        : "bg-white/[0.03] border-white/8 text-slate-500 hover:text-slate-400"
                    }`}
                  >
                    COD / Belum Lunas
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualPaymentMethod("transfer")}
                    className={`py-2.5 px-3 border rounded-xl font-black transition-all text-center text-[10px] active:scale-95 ${
                      manualPaymentMethod === "transfer"
                        ? "bg-blue-500/15 border-blue-500/40 text-blue-300"
                        : "bg-white/[0.03] border-white/8 text-slate-500 hover:text-slate-400"
                    }`}
                  >
                    Transfer / Lunas
                  </button>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="px-5 pb-5">
              <button
                type="submit"
                disabled={manualLoading}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 text-white rounded-2xl font-black text-xs shadow-xl shadow-blue-600/20 transition-all active:scale-95 flex justify-center items-center gap-2 border border-blue-400/20"
              >
                {manualLoading ? (
                  <><span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" /> Menyimpan...</>
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

