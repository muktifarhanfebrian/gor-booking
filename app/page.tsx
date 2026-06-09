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
      dayType: weekend ? "Weekend (Sabtu - Minggu)" : "Weekday (Senin - Jumat)"
    });
  };

  useEffect(() => {
    updateGorStatus();
    const interval = setInterval(updateGorStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex flex-col w-full bg-[#080b11] text-slate-100 min-h-screen font-sans relative overflow-x-hidden">

      {/* Decorative Badminton Court Lines (Background Layer) */}
      <div className="absolute top-0 left-0 w-full h-[600px] pointer-events-none opacity-[0.03] overflow-hidden -z-20">
        <div className="absolute top-10 left-10 right-10 bottom-10 border-4 border-white">
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white -translate-y-1/2" />
          <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-white -translate-x-1/2" />
          <div className="absolute top-[18%] bottom-[18%] left-[6%] right-[6%] border-2 border-dashed border-white" />
        </div>
      </div>

      {/* Navbar */}
      <nav className="w-full max-w-5xl mx-auto px-6 py-5 flex justify-between items-center border-b border-slate-900/60 sticky top-0 bg-[#080b11]/85 backdrop-blur-md z-30">
        <div className="flex items-center gap-2">
          <span className="text-2xl animate-pulse">🏸</span>
          <span className="font-black text-white text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            GOR Pandu
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/booking/history")}
            className="px-4 py-2 bg-slate-900/80 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl hover:text-white hover:bg-slate-800 transition-all shadow-lg active:scale-95"
          >
            Riwayat Sewa
          </button>
          <button
            onClick={() => router.push("/admin")}
            className="px-3 py-2 text-slate-500 hover:text-slate-300 text-xs font-semibold transition-colors"
          >
            Admin ⚙️
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="w-full max-w-4xl mx-auto px-6 py-16 md:py-24 text-center space-y-8 relative">
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-gor-primary/10 rounded-full blur-[100px] -z-10" />
        <div className="absolute top-1/3 left-1/4 w-[200px] h-[200px] bg-gor-court/5 rounded-full blur-[80px] -z-10" />

        {/* Live Operational Status Pill */}
        <div className="inline-flex items-center gap-2 bg-slate-950/80 border border-slate-850 px-4 py-2 rounded-full shadow-xl">
          <span className="flex h-2.5 w-2.5 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${gorOpenStatus.isOpen ? "bg-emerald-400" : "bg-red-400"}`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${gorOpenStatus.isOpen ? "bg-emerald-500" : "bg-red-500"}`} />
          </span>
          <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-widest">
            {gorOpenStatus.isOpen ? "GOR Buka Sekarang" : "GOR Tutup"} • {gorOpenStatus.hoursText}
          </span>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-black text-white leading-[1.15] tracking-tight max-w-3xl mx-auto">
            Sewa Lapangan Badminton <br />
            <span className="bg-gradient-to-r from-gor-primary via-[#4F46E5] to-[#818CF8] bg-clip-text text-transparent">
              Mudah, Cepat & Tanpa Antre
            </span>
          </h1>

          <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Penyewaan lapangan badminton GOR Pandu di Meulaboh. Booking jadwal bermain secara realtime, dukung paket membership bulanan hemat, dan verifikasi pembayaran instan via QRIS.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
          <button
            onClick={() => router.push("/booking")}
            className="w-full sm:w-auto px-8 py-4 bg-gor-primary hover:bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-900/30 transition-all duration-300 hover:scale-105 active:scale-95 text-sm"
          >
            Pesan Lapangan Sekarang ⚡
          </button>

          <button
            onClick={() => router.push("/booking/history")}
            className="w-full sm:w-auto px-6 py-4 bg-slate-950/50 hover:bg-slate-900 border border-slate-850 text-slate-300 font-bold rounded-2xl text-sm transition-all hover:border-slate-700"
          >
            Cari Jadwal & Riwayat
          </button>
        </div>
      </section>

      {/* Fasilitas GOR Section (Glassmorphism Grid) */}
      <section className="w-full max-w-5xl mx-auto px-6 py-12 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-gor-court uppercase tracking-widest block">Layanan Unggulan</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Fasilitas GOR Pandu</h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">Kenyamanan bermain badminton didukung fasilitas standar olahraga yang memadai</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "🏸", title: "Karpet Lapangan Standar", desc: "Alas lapangan menggunakan karpet vinyl tebal premium, meredam benturan kaki dan anti licin." },
            { icon: "💡", title: "Pencahayaan Terang", desc: "Sebaran pencahayaan lampu LED merata di seluruh court, nyaman untuk main siang maupun malam." },
            { icon: "🚿", title: "Toilet & Ruang Ganti", desc: "Tersedia toilet bersih, area shower mandi bilas, gantungan baju, dan ruang ganti terpisah." },
            { icon: "🚗", title: "Area Parkir Aman", desc: "Area parkir kendaraan roda dua & empat yang luas, aman terpantau kamera CCTV GOR." }
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-950/30 border border-slate-850 p-6 rounded-3xl space-y-3 shadow-lg hover:border-slate-700 hover:bg-slate-950/50 transition-all duration-300"
            >
              <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-xl shadow-inner">
                {item.icon}
              </div>
              <h4 className="text-xs font-bold text-white tracking-tight">{item.title}</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Cards (Polished Checkmarks) */}
      <section className="w-full max-w-4xl mx-auto px-6 py-12 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-gor-primary uppercase tracking-widest block">Daftar Paket Harga</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Tarif Sewa Lapangan</h2>
          <p className="text-xs text-slate-400">Pilih skema sewa kasual reguler atau berlangganan bulanan member</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Regular Pricing Card */}
          <div className="bg-slate-950/40 border border-slate-850 p-6 md:p-8 rounded-3xl space-y-6 flex flex-col justify-between hover:border-slate-800 hover:bg-slate-950/60 transition-all duration-300">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] bg-gor-primary/10 text-gor-primary border border-gor-primary/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                  Sewa Reguler
                </span>
                <span className="text-xs text-slate-500">Kasual</span>
              </div>

              <h3 className="text-3xl font-black text-white">
                {formatRupiah(100000)} <span className="text-xs font-normal text-slate-400">/ 2 Jam</span>
              </h3>

              <p className="text-xs text-slate-400 leading-relaxed">
                Cocok bagi Anda yang bermain kasual bersama teman atau rekan kerja tanpa jadwal rutin tetap.
              </p>

              <div className="h-[1px] bg-slate-900" />

              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="text-gor-court text-xs">✓</span> Main 2 jam penuh per sesi sewa
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gor-court text-xs">✓</span> Bebas pilih jam operasional kosong
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gor-court text-xs">✓</span> Bayar instan QRIS (+Rp1.000) atau COD tempat
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gor-court text-xs">✓</span> Bebas akses seluruh fasilitas GOR
                </li>
              </ul>
            </div>

            <button
              onClick={() => router.push("/booking")}
              className="w-full py-3.5 mt-6 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-white rounded-xl font-bold text-xs transition-all"
            >
              Pesan Lapangan
            </button>
          </div>

          {/* Member Pricing Card */}
          <div className="bg-gradient-to-b from-orange-950/10 to-slate-950/40 border border-gor-bata/40 p-6 md:p-8 rounded-3xl space-y-6 flex flex-col justify-between hover:border-gor-bata hover:bg-slate-950/50 transition-all duration-300 relative">
            <div className="absolute top-6 right-6 text-xs font-black text-gor-bata uppercase tracking-widest animate-pulse">
              🌟 Rekomendasi
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] bg-gor-bata/10 text-gor-bata border border-gor-bata/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                  Paket Member Bulanan
                </span>
              </div>

              <h3 className="text-3xl font-black text-white">
                {formatRupiah(400000)} <span className="text-xs font-normal text-slate-400">/ Bulan</span>
              </h3>

              <p className="text-xs text-slate-400 leading-relaxed">
                Jaminan tersedianya slot lapangan tetap pada hari & jam yang sama setiap minggu secara berturut-turut.
              </p>

              <div className="h-[1px] bg-slate-900" />

              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="text-gor-court text-xs">✓</span> Slot hari & jam tetap aman ter-booking
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gor-court text-xs">✓</span> Dinamis 4 hingga 5 pertemuan dalam 30 hari
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gor-court text-xs">✓</span> Pembayaran otomatis terpecah per baris atomik
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gor-court text-xs">✓</span> Hemat biaya sewa sebulan hingga 20%
                </li>
              </ul>
            </div>

            <button
              onClick={() => router.push("/booking")}
              className="w-full py-3.5 mt-6 bg-gor-bata hover:bg-orange-600 text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-orange-950/20"
            >
              Mendaftar Member
            </button>
          </div>
        </div>
      </section>

      {/* Booking Workflow Section */}
      <section className="w-full max-w-4xl mx-auto px-6 py-12 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Proses Booking</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Alur Pemesanan 4 Langkah</h2>
          <p className="text-xs text-slate-400">Langkah mudah mengunci jam sewa lapangan badminton GOR Pandu</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
          {[
            { num: "01", icon: "👤", title: "Login Akun", desc: "Masuk menggunakan email terdaftar atau cari instan via WA." },
            { num: "02", icon: "🗓️", title: "Pilih Jadwal", desc: "Tentukan Court lapangan, tanggal bermain, dan jam slot kosong." },
            { num: "03", icon: "💳", title: "Bayar Sewa", desc: "Selesaikan transaksi via QRIS instan otomatis atau COD langsung." },
            { num: "04", icon: "🏸", title: "Mulai Main", desc: "Tunjukkan bukti booking ke penjaga GOR Pandu dan mulai bermain." },
          ].map((step, idx) => (
            <div key={idx} className="bg-slate-950/30 border border-slate-900 p-5 rounded-2xl relative overflow-hidden">
              <span className="text-3xl font-black text-slate-800/20 absolute right-3 top-2 select-none">
                {step.num}
              </span>
              <div className="text-lg mb-2">{step.icon}</div>
              <h4 className="text-xs font-bold text-white mb-1.5">{step.title}</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Gallery & Testimonials Section */}
      <section className="w-full max-w-5xl mx-auto px-6 py-12 space-y-12">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-gor-court uppercase tracking-widest block">Komunitas GOR</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Keseruan di GOR Pandu</h2>
          <p className="text-xs text-slate-400">Apa kata para pemain dan dokumentasi lapangan sewa</p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="h-32 md:h-40 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-850 rounded-2xl relative overflow-hidden flex items-center justify-center">
            <span className="text-2xl">🏸</span>
            <div className="absolute inset-0 bg-black/60 flex items-end p-2.5">
              <span className="text-[9px] font-bold text-white">Karpet Court 1</span>
            </div>
          </div>
          <div className="h-32 md:h-40 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-850 rounded-2xl relative overflow-hidden flex items-center justify-center">
            <span className="text-2xl">💡</span>
            <div className="absolute inset-0 bg-black/60 flex items-end p-2.5">
              <span className="text-[9px] font-bold text-white">Lampu LED Merata</span>
            </div>
          </div>
          <div className="h-32 md:h-40 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-850 rounded-2xl relative overflow-hidden flex items-center justify-center">
            <span className="text-2xl">🏆</span>
            <div className="absolute inset-0 bg-black/60 flex items-end p-2.5">
              <span className="text-[9px] font-bold text-white">Event Turnamen</span>
            </div>
          </div>
          <div className="h-32 md:h-40 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-850 rounded-2xl relative overflow-hidden flex items-center justify-center">
            <span className="text-2xl">🙌</span>
            <div className="absolute inset-0 bg-black/60 flex items-end p-2.5">
              <span className="text-[9px] font-bold text-white">Sesi Main Komunitas</span>
            </div>
          </div>
        </div>

        {/* Testimonials Review Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: "Hendra Wijaya", role: "Komunitas Smash Meulaboh", text: "Tempat bersih sekali, lampu terang tidak silau sama sekali waktu netting. Karpet lapangannya empuk dan tidak bikin slip. Rekomendasi buat main badminton." },
            { name: "dr. Faisal", role: "Member Bulanan", text: "Sistem member bulanan sangat membantu buat kami sekeluarga yang punya jadwal main tetap setiap hari Jumat. QRIS otomatis langsung mengonfirmasi pembayaran." },
            { name: "Pak Samsul", role: "Pemain Kasual", text: "Proses booking lewat website sangat cepat. Parkirannya luas dan dijaga jadi merasa tenang waktu main. Toilet dan shower mandi setelah tanding juga bersih." }
          ].map((review, idx) => (
            <div key={idx} className="bg-slate-950/40 border border-slate-850 p-6 rounded-2xl space-y-3">
              <div className="flex gap-1 text-amber-500 font-bold text-xs">⭐⭐⭐⭐⭐</div>
              <p className="text-[11px] text-slate-300 italic leading-relaxed">"{review.text}"</p>
              <div>
                <span className="text-xs font-bold text-white block">{review.name}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{review.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer with Contact Info & Google Maps */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-12 mt-12 border-t border-slate-900/60 grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-slate-950/20">
        <div className="space-y-6">
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white">GOR Pandu Meulaboh</h4>
            <a
              href="https://maps.app.goo.gl/cLGDv6pTgZVxgJCS7"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-400 hover:text-white leading-relaxed block hover:underline"
            >
              Ujong, Jalan Imam Bonjol, Seuneubok, Kec. Johan Pahlawan, Kabupaten Aceh Barat, Aceh 23611
            </a>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="text-slate-400">📞 WhatsApp / Telepon: <a href="https://wa.me/6281360078986" className="text-gor-primary font-bold hover:underline">0813-6007-8986</a></div>
            <div className="text-slate-400">📸 Instagram: <a href="https://instagram.com/gor_pandu_meulaboh" target="_blank" rel="noopener noreferrer" className="text-gor-primary font-semibold hover:underline">@gor_pandu_meulaboh</a></div>
            <div className="text-slate-400">✉️ Email: <span className="text-slate-300 font-medium">info@gor-pandu.com</span></div>
          </div>

          <p className="text-[10px] text-slate-500">
            © 2026 Booking GOR Pandu. Developed as Progressive Web App (PWA) with Next.js & Tailwind CSS.
          </p>
        </div>

        {/* Real responsive Google Maps iframe */}
        <div className="w-full h-52 bg-slate-950/50 rounded-2xl overflow-hidden border border-slate-850 relative shadow-2xl">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d15917.076307554222!2d96.11598039147951!3d4.167421856817336!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x303ec3e39d1bd509%3A0xfbb592a4512045b0!2sGOR%20PANDU%20CENDIKIA!5e0!3m2!1sid!2sid!4v1781048247844!5m2!1sid!2sid"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="opacity-75 hover:opacity-100 transition-opacity duration-300"
          />
        </div>
      </footer>

      {/* Floating WhatsApp Helper for elderly/non-technical users */}
      <a
        href="https://wa.me/6281360078986?text=Halo%20Admin%20GOR%20Pandu%2C%20saya%20ingin%20memesan%20lapangan%20secara%20manual%20lewat%20chat%20karena%20kesulitan%20menggunakan%20aplikasi%2Fwebsite.%20Bisa%20tolong%20bantu%20cek%20jadwal%20yang%20kosong%3F"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 transition-all duration-350 hover:scale-105 font-black text-xs border border-emerald-400 active:scale-95 animate-bounce"
        style={{ animationDuration: "3s" }}
      >
        <span className="text-base">💬</span>
        <span>Bantuan WA</span>
      </a>

    </div>
  );
}
