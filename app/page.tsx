"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "../lib/bookingHelpers";
import { motion, Variants } from "framer-motion";
import {
  MapPin,
  CalendarDays,
  ShieldCheck,
  CreditCard,
  Zap,
  CheckCircle2,
  Droplets,
  Car,
  Lightbulb,
  Medal,
  ChevronRight,
  Clock
} from "lucide-react";

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
      dayType: weekend ? "Sabtu - Minggu" : "Senin - Jumat",
    });
  };

  useEffect(() => {
    updateGorStatus();
    const interval = setInterval(updateGorStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const facilities = [
    {
      icon: <Medal className="w-8 h-8 text-blue-500" />,
      title: "Karpet Lapangan Premium",
      desc: "Vinyl standar kompetisi tebal, meredam benturan kaki dan anti-licin.",
    },
    {
      icon: <Lightbulb className="w-8 h-8 text-amber-400" />,
      title: "Lampu LED Anti Silau",
      desc: "Pencahayaan rata ke seluruh lapangan tanpa menyilaukan pandangan.",
    },
    {
      icon: <Droplets className="w-8 h-8 text-cyan-500" />,
      title: "Toilet & Kamar Bilas",
      desc: "Fasilitas sanitasi bersih dan nyaman dengan sirkulasi udara baik.",
    },
    {
      icon: <Car className="w-8 h-8 text-emerald-500" />,
      title: "Parkir Kendaraan Luas",
      desc: "Area parkir motor & mobil yang luas",
    },
  ];

  const steps = [
    { num: "01", icon: <CalendarDays className="w-6 h-6 text-slate-400" />, title: "Pilih Jadwal", desc: "Tentukan Court, tanggal, dan jam." },
    { num: "02", icon: <ShieldCheck className="w-6 h-6 text-slate-400" />, title: "Isi Data", desc: "Masukkan nama & nomor WhatsApp." },
    { num: "03", icon: <CreditCard className="w-6 h-6 text-slate-400" />, title: "Pembayaran", desc: "Selesaikan via QRIS atau COD." },
    { num: "04", icon: <Zap className="w-6 h-6 text-slate-400" />, title: "Mulai Main", desc: "Tunjukkan bukti booking ke admin." },
  ];

  const fadeUpVariant: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full bg-slate-950 text-slate-200 min-h-screen relative overflow-x-hidden font-sans selection:bg-lime-500/30">

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <nav className="w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">GP</span>
            </div>
            <span className="font-heading font-black text-white text-xl tracking-tight uppercase">
              GOR Pandu Cendikia
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/booking/history")}
              className="hidden md:block px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Riwayat Sewa
            </button>
            <button
              onClick={() => router.push("/booking")}
              className="px-5 py-2 bg-lime-500 hover:bg-lime-400 text-slate-950 text-sm font-bold rounded transition-all active:scale-95"
            >
              Booking Online
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ──────────────────────────────────────────── */}
      <section className="relative w-full py-20 md:py-32 bg-slate-950 flex flex-col items-center justify-center text-center border-b border-slate-900">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=2000')] bg-cover bg-center opacity-10 mix-blend-luminosity grayscale pointer-events-none" />

        <div className="relative z-10 w-full max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 bg-slate-900 border border-slate-800 px-4 py-2 rounded-full mb-8 shadow-sm"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${gorOpenStatus.isOpen ? "bg-lime-400" : "bg-red-400"}`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${gorOpenStatus.isOpen ? "bg-lime-500" : "bg-red-500"}`} />
            </span>
            <span className="text-xs font-semibold text-slate-300">
              {gorOpenStatus.isOpen ? "Status: BUKA" : "Status: TUTUP"} &bull; {gorOpenStatus.hoursText}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-heading text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tight uppercase mb-6"
          >
            Tingkatkan Permainanmu<br />Di GOR Pandu Cendikia
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Sistem penyewaan lapangan badminton profesional di Meulaboh. Transparansi harga, fasilitas unggulan, dan kemudahan transaksi instan.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={() => router.push("/booking")}
              className="w-full sm:w-auto px-10 py-4 bg-lime-500 text-slate-950 font-bold text-lg rounded hover:scale-105 hover:bg-lime-400 hover:shadow-lg hover:shadow-lime-500/20 transition-all duration-300 flex items-center justify-center gap-2 uppercase tracking-wide"
            >
              Pesan Sekarang <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.push("/booking/history")}
              className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-lg rounded transition-colors duration-300"
            >
              Cek Jadwal Kosong
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── ALUR PEMESANAN (MINIMALIST) ───────────────────────────── */}
      <section className="w-full py-16 bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {steps.map((step, idx) => (
              <div key={idx} className="flex flex-col p-6 bg-slate-950 rounded border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  {step.icon}
                  <span className="text-2xl font-black text-slate-800">{step.num}</span>
                </div>
                <h4 className="font-heading font-bold text-white mb-2">{step.title}</h4>
                <p className="text-sm text-slate-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICE LIST SECTION ────────────────────────────────────── */}
      <section className="w-full py-24 bg-slate-950">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-black text-white uppercase tracking-tight mb-4">Daftar Harga Sewa</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Pilih skema penyewaan yang sesuai dengan intensitas permainan Anda.</p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {/* Card 1: Reguler */}
            <motion.div variants={fadeUpVariant} className="flex flex-col bg-slate-900 border border-slate-800 p-8 rounded-lg hover:border-slate-600 transition-colors">
              <div className="mb-6">
                <span className="text-sm font-semibold text-blue-400 uppercase tracking-wider block mb-2">Sewa Kasual</span>
                <h3 className="font-heading text-2xl font-black text-white mb-2">Reguler</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white tracking-tighter">{formatRupiah(100000)}</span>
                  <span className="text-slate-400 font-medium">/ 2 Jam</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {[
                  "Durasi standar 2 jam permainan",
                  "Bebas memilih slot jadwal kosong",
                  "Metode pembayaran QRIS atau Tunai",
                  "Akses penuh ke fasilitas GOR",
                  "Cocok untuk permainan santai"
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => router.push("/booking")}
                className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded transition-colors"
              >
                Pilih Reguler
              </button>
            </motion.div>

            {/* Card 2: Member */}
            <motion.div variants={fadeUpVariant} className="flex flex-col bg-slate-900 border-2 border-lime-500 p-8 rounded-lg relative shadow-lg">
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-lime-500 text-slate-950 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                Paling Hemat
              </div>

              <div className="mb-6 mt-2">
                <span className="text-sm font-semibold text-lime-400 uppercase tracking-wider block mb-2">Berlangganan</span>
                <h3 className="font-heading text-2xl font-black text-white mb-2">Member Bulanan</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white tracking-tighter">{formatRupiah(400000)}</span>
                  <span className="text-slate-400 font-medium">/ Bulan</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {[
                  "Jaminan jadwal tetap setiap minggu",
                  "Total 4-5 kali bermain dalam 1 bulan",
                  "Penghematan biaya secara keseluruhan",
                  "Prioritas ketersediaan slot",
                  "Manajemen jadwal lebih teratur"
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-lime-500 shrink-0" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => router.push("/booking")}
                className="w-full py-3.5 bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold rounded hover:scale-[1.02] transition-transform"
              >
                Daftar Member
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── FACILITIES SECTION ────────────────────────────────────── */}
      <section className="w-full py-24 bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="font-heading text-3xl font-black text-white uppercase tracking-tight mb-2">Fasilitas Standar Turnamen</h2>
              <p className="text-slate-400">Komitmen kami memberikan infrastruktur olahraga terbaik.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {facilities.map((item, idx) => (
              <div key={idx} className="bg-slate-950 p-8 rounded-lg border border-slate-800">
                <div className="mb-6">{item.icon}</div>
                <h4 className="font-heading font-bold text-white mb-3 text-lg leading-tight">{item.title}</h4>
                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer className="w-full bg-slate-950 border-t border-slate-800 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">

          {/* Col 1: Identity & Address */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">GP</span>
              </div>
              <span className="font-heading font-black text-white text-xl tracking-tight uppercase">
                GOR Pandu Cendikia
              </span>
            </div>

            <div className="flex items-start gap-3 text-slate-400">
              <MapPin className="w-5 h-5 shrink-0 text-slate-500 mt-0.5" />
              <p className="text-sm leading-relaxed">
                Ujong, Jalan Imam Bonjol, Seuneubok<br />
                Kecamatan Johan Pahlawan<br />
                Kabupaten Aceh Barat, Aceh 23611
              </p>
            </div>

            <a href="https://maps.app.goo.gl/cLGDv6pTgZVxgJCS7" target="_blank" rel="noopener noreferrer" className="inline-flex text-blue-400 text-sm font-semibold hover:text-blue-300 transition-colors">
              Lihat di Google Maps &rarr;
            </a>
          </div>

          {/* Col 2: Operational Hours */}
          <div className="space-y-6">
            <h4 className="font-heading font-bold text-white text-lg">Jam Operasional</h4>
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-slate-500 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-200">Senin - Jumat</p>
                  <p className="text-slate-400">12:00 - 23:00 WIB</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-slate-500 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-200">Sabtu - Minggu</p>
                  <p className="text-slate-400">08:00 - 23:00 WIB</p>
                </div>
              </div>
            </div>
          </div>

          {/* Col 3: Contact */}
          <div className="space-y-6">
            <h4 className="font-heading font-bold text-white text-lg">Kontak Reservasi</h4>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded text-sm">
              <p className="text-slate-400 mb-2">Butuh bantuan reservasi manual?</p>
              <a
                href="https://wa.me/6281360078986"
                target="_blank"
                rel="noopener noreferrer"
                className="text-lime-400 font-bold hover:text-lime-300 flex items-center gap-2 transition-colors"
              >
                WhatsApp: 0813-6007-8986
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">&copy; 2026 Booking GOR Pandu Cendikia. Sistem Penyewaan Resmi.</p>
          <div className="text-xs text-slate-500 flex gap-4">
            <span>Privasi</span>
            <span>Syarat & Ketentuan</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
