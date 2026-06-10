"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "../lib/bookingHelpers";

export default function Home() {
  const router = useRouter();
  const [gorOpenStatus, setGorOpenStatus] = useState<{
    isOpen: boolean;
    hoursText: string;
    dayType: string;
  }>({ isOpen: false, hoursText: "", dayType: "" });

  // Compute GOR operational status based on WIB (UTC+7)
  const updateGorStatus = () => {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const wibTime = new Date(utc + 3600000 * 7); // Meulaboh is UTC+7

    const day = wibTime.getDay(); // 0 = Sunday, 6 = Saturday
    const hour = wibTime.getHours();

    const weekend = day === 0 || day === 6;
    const startHour = weekend ? 8 : 12;
    const endHour = 23;

    const isOpen = hour >= startHour && hour < endHour;
    setGorOpenStatus({
      isOpen,
      hoursText: weekend ? "08:00 - 23:00 WIB" : "12:00 - 23:00 WIB",
      dayType: weekend ? "Weekend (Sabtu - Minggu)" : "Weekday (Senin - Jumat)",
    });
  };

  useEffect(() => {
    updateGorStatus();
    const interval = setInterval(updateGorStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const facilities = [
    {
      icon: "🏸",
      title: "Karpet Lapangan Premium",
      desc: "Vinyl standar kompetisi tebal, meredam benturan kaki dan anti-licin untuk performa terbaik.",
      color: "from-blue-500/10 to-blue-900/5",
      border: "border-blue-500/20",
      glow: "group-hover:shadow-blue-500/10",
    },
    {
      icon: "💡",
      title: "Lampu LED Anti Silau",
      desc: "Pencahayaan LED khusus menyebar rata ke seluruh court tanpa membuat silau pandangan.",
      color: "from-yellow-500/10 to-yellow-900/5",
      border: "border-yellow-500/20",
      glow: "group-hover:shadow-yellow-500/10",
    },
    {
      icon: "🚿",
      title: "Toilet & Kamar Bilas",
      desc: "Toilet bersih, ruang ganti nyaman, gantungan pakaian, dan keran shower air bersih.",
      color: "from-cyan-500/10 to-cyan-900/5",
      border: "border-cyan-500/20",
      glow: "group-hover:shadow-cyan-500/10",
    },
    {
      icon: "🚗",
      title: "Parkir Kendaraan Luas",
      desc: "Area parkir motor & mobil luas di depan GOR, diawasi petugas & terpantau kamera CCTV.",
      color: "from-emerald-500/10 to-emerald-900/5",
      border: "border-emerald-500/20",
      glow: "group-hover:shadow-emerald-500/10",
    },
  ];

  const steps = [
    { num: "01", icon: "🗓️", title: "Pilih Slot Jadwal", desc: "Pilih nomor Court lapangan, tanggal bermain, dan jam slot sewa yang masih kosong." },
    { num: "02", icon: "📱", title: "Isi Data Diri", desc: "Masukkan nama lengkap Anda dan nomor WhatsApp aktif untuk kebutuhan konfirmasi dan cek riwayat sewa." },
    { num: "03", icon: "💳", title: "Lakukan Pembayaran", desc: "Selesaikan tagihan sewa via QRIS otomatis dengan biaya layanan Rp1.000 atau pilih bayar COD di lokasi." },
    { num: "04", icon: "🏸", title: "Mulai Bertanding", desc: "Tunjukkan nomor WhatsApp atau nama Anda ke pengelola GOR saat tiba di lokasi untuk langsung main." },
  ];

  const reviews = [
    {
      name: "Hendra Wijaya",
      role: "Smash Club Meulaboh",
      avatar: "HW",
      avatarColor: "from-blue-500 to-indigo-600",
      text: "Kualitas karpet GOR Pandu mantap, tidak licin sama sekali. LED-nya pas, tidak silau saat melihat shuttlecock ke atas. Booking dari HP dalam 30 detik!",
      stars: 5,
    },
    {
      name: "dr. Faisal Rahman",
      role: "Member Bulanan Aktif",
      avatar: "FR",
      avatarColor: "from-emerald-500 to-teal-600",
      text: "Paket member bulanan sangat praktis. Bayar via QRIS langsung auto-verify, jadwal main rutin kami setiap minggu otomatis aman dikunci tanpa ribet.",
      stars: 5,
    },
    {
      name: "Pak Samsul Bahri",
      role: "Pemain Kasual Lokal",
      avatar: "SB",
      avatarColor: "from-orange-500 to-red-600",
      text: "Proses booking-nya anti-ribet. Parkiran aman ada petugas jaga. Toilet dan kamar bilas bersih banget setelah tanding. Recommended buat sewa lapangan Meulaboh!",
      stars: 5,
    },
  ];

  return (
    <div className="flex-1 flex flex-col w-full bg-[#050810] text-slate-100 min-h-screen font-sans relative overflow-x-hidden">

      {/* ── BACKGROUND LAYERS ─────────────────────────────────────── */}
      {/* Mesh gradient orbs */}
      <div className="fixed top-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-blue-600/8 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed top-[500px] left-[-100px] w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed top-[900px] right-[-80px] w-[350px] h-[350px] bg-orange-600/5 rounded-full blur-[110px] pointer-events-none -z-10" />

      {/* Court line decoration */}
      <div className="absolute top-0 left-0 w-full h-[600px] pointer-events-none overflow-hidden -z-10 opacity-[0.025]">
        <div className="absolute inset-8 border-2 border-white rounded-3xl">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-white -translate-y-1/2" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white -translate-x-1/2" />
          <div className="absolute inset-[12%] border border-dashed border-white rounded-xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white" />
        </div>
      </div>

      {/* ── STICKY NAVBAR ─────────────────────────────────────────── */}
      <nav className="w-full max-w-5xl mx-auto px-5 py-4 flex justify-between items-center sticky top-0 z-40 bg-[#050810]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <span className="text-sm">🏸</span>
          </div>
          <span className="font-black text-white text-sm tracking-tight">
            GOR <span className="text-blue-400">Pandu Cendikia</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/booking/history")}
            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-[11px] font-bold rounded-xl transition-all duration-200 active:scale-95"
          >
            Riwayat Sewa
          </button>
          <button
            onClick={() => router.push("/admin")}
            className="px-3 py-2 text-slate-500 hover:text-slate-400 text-[11px] font-semibold transition-colors"
          >
            Admin ⚙
          </button>
        </div>
      </nav>

      {/* ── HERO SECTION ──────────────────────────────────────────── */}
      <section className="w-full max-w-5xl mx-auto px-5 pt-14 pb-10 md:pt-20 md:pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">

          {/* Left: Copy */}
          <div className="space-y-7 text-center md:text-left">
            {/* Status pill */}
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${gorOpenStatus.isOpen ? "bg-emerald-400" : "bg-red-400"}`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${gorOpenStatus.isOpen ? "bg-emerald-500" : "bg-red-500"}`} />
              </span>
              <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">
                {gorOpenStatus.isOpen ? "🟢 GOR Buka Sekarang" : "🔴 GOR Sedang Tutup"} • {gorOpenStatus.hoursText}
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-black text-white leading-[1.1] tracking-tight">
                Sewa Lapangan
                <br />
                Badminton
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                  Online & Instan ⚡
                </span>
              </h1>
              <p className="text-sm text-slate-400 max-w-sm mx-auto md:mx-0 leading-relaxed">
                Booking jadwal tanding di GOR Pandu Meulaboh — pilih slot, bayar QRIS, langsung main. Daftar member bulanan dan hemat hingga 20%.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <button
                onClick={() => router.push("/booking")}
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 text-white font-black rounded-2xl shadow-2xl shadow-blue-600/30 hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105 active:scale-95 text-sm border border-blue-400/30 overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-700 skew-x-12" />
                Pesan Lapangan Sekarang ⚡
              </button>
              <button
                onClick={() => router.push("/booking/history")}
                className="px-7 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white font-semibold rounded-2xl text-sm transition-all duration-200 active:scale-95 backdrop-blur-sm"
              >
                Cek Jadwal & Riwayat →
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-5 justify-center md:justify-start pt-1">
              <div className="text-center">
                <p className="text-lg font-black text-white">3</p>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Court</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-lg font-black text-white">QRIS</p>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Pembayaran</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-lg font-black text-white">24/7</p>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Booking</p>
              </div>
            </div>
          </div>

          {/* Right: Hero Image */}
          <div className="relative hidden md:block">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/20 border border-white/10 h-[380px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200"
                alt="Badminton court GOR Pandu Meulaboh"
                className="w-full h-full object-cover"
              />
              {/* Image overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#050810] via-transparent to-transparent opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#050810]/30 to-transparent" />

              {/* Floating stat chip on image */}
              <div className="absolute bottom-4 left-4 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-2.5 space-y-0.5">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">Tarif Sewa</p>
                <p className="text-xl font-black text-white leading-none">{formatRupiah(100000)}</p>
                <p className="text-[10px] text-slate-400">per 2 jam • COD & QRIS</p>
              </div>
              <div className="absolute top-4 right-4 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-300 uppercase tracking-wider">Live Booking</span>
              </div>
            </div>
            {/* Glow below image */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-12 bg-blue-600/20 blur-2xl rounded-full" />
          </div>
        </div>
      </section>

      {/* ── FASILITAS SECTION ─────────────────────────────────────── */}
      <section className="w-full max-w-5xl mx-auto px-5 py-14 space-y-10">
        <div className="text-center space-y-2.5">
          <span className="inline-block text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 rounded-full">
            Standar GOR Premium
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Fasilitas Lapangan Kami</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Bermain nyaman dengan fasilitas berkualitas yang terawat dan terjaga setiap harinya
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {facilities.map((item, idx) => (
            <div
              key={idx}
              className={`group bg-gradient-to-b ${item.color} bg-white/[0.03] backdrop-blur-md border ${item.border} p-6 rounded-3xl space-y-4 shadow-xl hover:shadow-2xl ${item.glow} transition-all duration-300 hover:-translate-y-1.5 hover:bg-white/[0.05]`}
            >
              <div className="w-12 h-12 bg-white/8 border border-white/10 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                {item.icon}
              </div>
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-white leading-tight">{item.title}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING SECTION ───────────────────────────────────────── */}
      <section className="w-full max-w-4xl mx-auto px-5 py-14 space-y-10">
        <div className="text-center space-y-2.5">
          <span className="inline-block text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] border border-blue-500/30 bg-blue-500/10 px-3 py-1 rounded-full">
            Skema Pembayaran
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Pilihan Tarif Sewa</h2>
          <p className="text-sm text-slate-400">Pilih sewa kasual per jam atau hemat lebih banyak dengan paket member bulanan</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Regular Card */}
          <div className="relative bg-white/[0.03] border border-white/8 hover:border-white/15 p-7 rounded-3xl space-y-6 flex flex-col transition-all duration-300 hover:-translate-y-1 shadow-xl backdrop-blur-sm">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-blue-500/15 text-blue-300 border border-blue-500/25 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                  Sewa Reguler
                </span>
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Kasual / Jam</span>
              </div>

              <div>
                <p className="text-[10px] text-slate-500 font-semibold mb-0.5">Harga Sewa</p>
                <p className="text-4xl font-black text-white tracking-tight">
                  {formatRupiah(100000)}
                  <span className="text-sm font-normal text-slate-400 ml-1">/ 2 Jam</span>
                </p>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Ideal untuk sewa santai sewaktu-waktu bersama teman tanpa ikatan jadwal tetap berkala.
              </p>

              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              <ul className="space-y-2.5">
                {[
                  "Durasi bermain 2 jam penuh",
                  "Bebas pilih jam operasional kosong",
                  "Bayar QRIS (+Rp1.000) atau COD di tempat",
                  "Akses toilet, parkir, dan ruang ganti",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[12px] text-slate-300">
                    <span className="text-emerald-400 font-black text-base leading-none mt-[-1px]">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => router.push("/booking")}
              className="w-full py-3.5 bg-white/8 hover:bg-white/12 border border-white/10 hover:border-white/20 text-white rounded-2xl font-bold text-sm transition-all active:scale-95"
            >
              Pesan Lapangan →
            </button>
          </div>

          {/* Member Card (Featured) */}
          <div className="relative bg-gradient-to-b from-orange-950/30 via-[#0d0805]/60 to-[#050810]/80 border border-orange-500/30 hover:border-orange-500/60 p-7 rounded-3xl space-y-6 flex flex-col transition-all duration-300 hover:-translate-y-1 shadow-2xl shadow-orange-950/10 backdrop-blur-sm overflow-hidden">
            {/* Glow orb */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="absolute top-5 right-5 text-[9px] bg-orange-500/20 border border-orange-500/40 px-2.5 py-1.5 rounded-full font-black text-orange-300 uppercase tracking-widest">
              🌟 Paling Hemat
            </div>

            <div className="space-y-4">
              <span className="text-[10px] bg-orange-500/15 text-orange-300 border border-orange-500/25 px-3 py-1 rounded-full font-bold uppercase tracking-wider inline-block">
                Paket Member Bulanan
              </span>

              <div>
                <p className="text-[10px] text-slate-500 font-semibold mb-0.5">Berlangganan</p>
                <p className="text-4xl font-black text-white tracking-tight">
                  {formatRupiah(400000)}
                  <span className="text-sm font-normal text-slate-400 ml-1">/ Bulan</span>
                </p>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Jaminan lapangan Fixed Slot pada hari & jam yang sama setiap minggu secara rutin.
              </p>

              <div className="h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />

              <ul className="space-y-2.5">
                {[
                  "Prioritas kunci slot jadwal tetap mingguan",
                  "Dinamis 4-5 kali tanding dalam 30 hari",
                  "Pembayaran aman dipecah per transaksi atomik",
                  "Hemat pengeluaran bulanan sewa hingga 20%",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[12px] text-slate-300">
                    <span className="text-emerald-400 font-black text-base leading-none mt-[-1px]">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => router.push("/booking")}
              className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white rounded-2xl font-black text-sm transition-all active:scale-95 shadow-lg shadow-orange-600/20 hover:shadow-orange-500/30 hover:scale-[1.02]"
            >
              Daftar Member Sekarang →
            </button>
          </div>
        </div>
      </section>

      {/* ── ALUR PEMESANAN ────────────────────────────────────────── */}
      <section className="w-full max-w-4xl mx-auto px-5 py-14 space-y-10">
        <div className="text-center space-y-2.5">
          <span className="inline-block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border border-white/10 bg-white/5 px-3 py-1 rounded-full">
            Prosedur Sewa
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Langkah Mudah Pemesanan</h2>
          <p className="text-sm text-slate-400">Cukup 4 langkah untuk mengamankan sewa lapangan GOR Pandu</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {steps.map((step, idx) => (
            <div key={idx} className="relative bg-white/[0.03] border border-white/8 hover:border-white/15 p-5 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 group">
              <span className="absolute right-3 top-2 text-4xl font-black text-white/4 group-hover:text-white/7 transition-all select-none">
                {step.num}
              </span>
              <div className="text-2xl mb-3">{step.icon}</div>
              <h4 className="text-xs font-bold text-white mb-1.5 leading-tight">{step.title}</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">{step.desc}</p>
              {idx < steps.length - 1 && (
                <div className="absolute right-[-18px] top-1/2 -translate-y-1/2 text-slate-700 text-lg font-bold hidden md:block z-10">→</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── GALLERY + TESTIMONIALS ────────────────────────────────── */}
      <section className="w-full max-w-5xl mx-auto px-5 py-14 space-y-12">
        <div className="text-center space-y-2.5">
          <span className="inline-block text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 rounded-full">
            Komunitas Badminton Meulaboh
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Keseruan di GOR Pandu</h2>
          <p className="text-sm text-slate-400">Ulasan nyata dari pemain setia komunitas lokal Aceh Barat</p>
        </div>

        {/* Gallery Grid with Unsplash image */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="col-span-2 row-span-2 relative rounded-2xl overflow-hidden border border-white/8 shadow-xl h-48 md:h-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=800"
              alt="Court GOR Pandu"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050810]/80 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 space-y-1">
              <span className="text-[9px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded font-bold uppercase block w-max">Court 1 Vinyl</span>
              <span className="text-sm font-black text-white block">Lapangan Utama</span>
            </div>
          </div>

          {[
            { icon: "💡", label: "Lighting", title: "LED Merata", color: "from-yellow-500/10 to-transparent" },
            { icon: "🏆", label: "Tournament", title: "Internal Cup", color: "from-orange-500/10 to-transparent" },
            { icon: "🚿", label: "Fasilitas", title: "Kamar Bilas", color: "from-cyan-500/10 to-transparent" },
            { icon: "🚗", label: "Parkir", title: "Lahan Luas", color: "from-slate-500/10 to-transparent" },
          ].map((item, idx) => (
            <div key={idx} className={`h-24 md:h-auto bg-gradient-to-br ${item.color} bg-white/[0.03] border border-white/8 rounded-2xl relative overflow-hidden flex flex-col justify-between p-3.5 hover:border-white/15 transition-all`}>
              <span className="text-xl">{item.icon}</span>
              <div>
                <span className="text-[9px] bg-white/10 border border-white/10 text-slate-300 px-2 py-0.5 rounded font-bold uppercase block w-max">{item.label}</span>
                <span className="text-[11px] font-bold text-white block mt-1">{item.title}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Review Cards with Avatars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reviews.map((review, idx) => (
            <div key={idx} className="bg-white/[0.03] border border-white/8 hover:border-white/15 p-6 rounded-3xl space-y-4 transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm shadow-xl">
              {/* Stars */}
              <div className="flex gap-0.5 text-amber-400 text-sm select-none">
                {"★".repeat(review.stars)}
              </div>

              {/* Quote */}
              <p className="text-[12px] text-slate-300 leading-relaxed">
                &ldquo;{review.text}&rdquo;
              </p>

              {/* Reviewer */}
              <div className="flex items-center gap-3 pt-1 border-t border-white/8">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${review.avatarColor} flex items-center justify-center text-[11px] font-black text-white shadow-lg flex-shrink-0`}>
                  {review.avatar}
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">{review.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{review.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer className="w-full mt-6 border-t border-white/6 bg-[#030508]">
        <div className="max-w-5xl mx-auto px-5 py-12 grid grid-cols-1 md:grid-cols-2 gap-10 items-start">

          {/* Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="text-sm">🏸</span>
              </div>
              <span className="font-black text-white text-sm">GOR Pandu Cendikia Meulaboh</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5 text-slate-400">
                <span className="mt-0.5 text-slate-500">📍</span>
                <a
                  href="https://maps.app.goo.gl/cLGDv6pTgZVxgJCS7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors hover:underline leading-relaxed"
                >
                  Ujong, Jalan Imam Bonjol, Seuneubok, Kec. Johan Pahlawan,<br />Kabupaten Aceh Barat, Aceh 23611
                </a>
              </div>
              <div className="flex items-center gap-2.5 text-slate-400">
                <span className="text-slate-500">📞</span>
                <a href="https://wa.me/6281360078986" className="text-emerald-400 font-black hover:underline">
                  0813-6007-8986
                </a>
                <span className="text-slate-600">WhatsApp & Telepon</span>
              </div>
              {/* <div className="flex items-center gap-2.5 text-slate-400">
                <span className="text-slate-500">📸</span>
                <a href="https://instagram.com/gor_pandu_meulaboh" target="_blank" rel="noopener noreferrer" className="text-blue-400 font-semibold hover:underline">
                  @gor_pandu_meulaboh
                </a>
              </div> */}
            </div>

            {/* Hours */}
            <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-4 space-y-2 text-xs">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Jam Operasional</p>
              <div className="flex justify-between text-slate-300">
                <span>Weekday (Senin – Jumat)</span>
                <span className="font-bold text-white">12:00 – 23:00 WIB</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Weekend (Sabtu – Minggu)</span>
                <span className="font-bold text-white">08:00 – 23:00 WIB</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-600">© 2026 Booking GOR Pandu. Developed as PWA.</p>
          </div>

          {/* Google Maps */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Lokasi GOR Pandu</p>
            <div className="w-full h-56 rounded-2xl overflow-hidden border border-white/8 shadow-2xl shadow-black/30 relative">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d15916.921480185792!2d96.11016!3d4.1750637!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x303ec3e39d1bd509%3A0xfbb592a4512045b0!2sGOR%20PANDU%20CENDIKIA!5e0!3m2!1sid!2sid!4v1781054042832!5m2!1sid!2sid"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="opacity-80 hover:opacity-100 transition-opacity duration-300"
              />
            </div>
            <a
              href="https://maps.app.goo.gl/cLGDv6pTgZVxgJCS7"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-white/5 hover:bg-white/8 border border-white/10 rounded-xl text-xs text-slate-300 hover:text-white font-semibold transition-all"
            >
              <span>🗺️</span> Buka di Google Maps
            </a>
          </div>
        </div>
      </footer>

      {/* ── FLOATING WHATSAPP BUTTON ──────────────────────────────── */}
      <a
        href="https://wa.me/6281360078986?text=Halo%20Admin%20GOR%20Pandu%2C%20saya%20ingin%20memesan%20lapangan%20secara%20manual%20lewat%20chat%20karena%20kesulitan%20menggunakan%20aplikasi%2Fwebsite.%20Bisa%20tolong%20bantu%20cek%20jadwal%20yang%20kosong%3F"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-5 z-50 flex items-center gap-2.5 bg-emerald-500 hover:bg-emerald-400 text-white pl-3.5 pr-4.5 py-3 rounded-full shadow-2xl shadow-emerald-600/40 hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105 active:scale-95 font-black text-xs border border-emerald-400/50"
        style={{ paddingRight: "18px" }}
      >
        {/* Pulsing ring */}
        <span className="relative flex items-center justify-center">
          <span className="absolute w-8 h-8 rounded-full bg-emerald-400/30 animate-ping" />
          <span className="text-base relative">💬</span>
        </span>
        <span>Bantuan WA</span>
      </a>
    </div>
  );
}
