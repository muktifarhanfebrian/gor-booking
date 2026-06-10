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
    <div className="flex-1 flex flex-col w-full bg-[#06080e] text-slate-100 min-h-screen font-sans relative overflow-x-hidden">
      
      {/* Decorative Badminton Court Lines (Background Layer) */}
      <div className="absolute top-0 left-0 w-full h-[700px] pointer-events-none opacity-[0.02] overflow-hidden -z-20">
        <div className="absolute top-8 left-8 right-8 bottom-8 border-4 border-white rounded-3xl">
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white -translate-y-1/2" />
          <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-white -translate-x-1/2" />
          <div className="absolute top-[15%] bottom-[15%] left-[8%] right-[8%] border-2 border-dashed border-white" />
        </div>
      </div>

      {/* Glow Effects (Background Layer) */}
      <div className="absolute top-[-150px] left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gor-primary/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute top-[300px] left-[10%] w-[300px] h-[300px] bg-gor-court/5 rounded-full blur-[100px] -z-10" />
      <div className="absolute top-[500px] right-[5%] w-[250px] h-[250px] bg-gor-bata/5 rounded-full blur-[90px] -z-10" />

      {/* Navbar */}
      <nav className="w-full max-w-5xl mx-auto px-6 py-5 flex justify-between items-center border-b border-slate-900/60 sticky top-0 bg-[#06080e]/90 backdrop-blur-md z-30">
        <div className="flex items-center gap-2">
          <span className="text-2xl animate-pulse">🏸</span>
          <span className="font-black text-white text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            GOR Pandu
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/booking/history")}
            className="px-4 py-2 bg-slate-900/80 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl hover:text-white hover:bg-slate-800 hover:border-slate-700 transition-all shadow-lg active:scale-95"
          >
            Riwayat Sewa
          </button>
          <button
            onClick={() => router.push("/admin")}
            className="px-3 py-2 text-slate-500 hover:text-slate-300 text-xs font-semibold transition-colors"
          >
            Admin ⚙
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="w-full max-w-4xl mx-auto px-6 py-20 md:py-28 text-center space-y-8 relative">
        {/* Pulsing status banner */}
        <div className="inline-flex items-center gap-2 bg-slate-950/90 border border-slate-850 px-4.5 py-2 rounded-full shadow-2xl">
          <span className="flex h-2.5 w-2.5 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${gorOpenStatus.isOpen ? "bg-emerald-400" : "bg-red-400"}`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${gorOpenStatus.isOpen ? "bg-emerald-500" : "bg-red-500"}`} />
          </span>
          <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest leading-none">
            {gorOpenStatus.isOpen ? "GOR Buka Sekarang" : "GOR Tutup"} • {gorOpenStatus.hoursText}
          </span>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-black text-white leading-[1.12] tracking-tight max-w-3xl mx-auto">
            Sewa Lapangan Badminton <br/>
            <span className="bg-gradient-to-r from-gor-primary via-indigo-500 to-purple-400 bg-clip-text text-transparent drop-shadow-sm">
              Real-time, Instan & Premium
            </span>
          </h1>
          
          <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Sistem sewa lapangan badminton GOR Pandu, Ujong, Meulaboh. Pesan jadwal tanding, daftar keanggotaan member, dan kelola pemesanan langsung dari gawai Anda.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
          <button
            onClick={() => router.push("/booking")}
            className="w-full sm:w-auto px-9 py-4.5 bg-gor-primary hover:bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105 active:scale-95 text-xs md:text-sm border border-blue-400/20"
          >
            Pesan Lapangan Sekarang ⚡
          </button>
          
          <button
            onClick={() => router.push("/booking/history")}
            className="w-full sm:w-auto px-7 py-4.5 bg-slate-950/60 hover:bg-slate-900 border border-slate-850 text-slate-300 font-bold rounded-2xl text-xs md:text-sm transition-all hover:border-slate-700 active:scale-95"
          >
            Cek Jadwal & Riwayat
          </button>
        </div>
      </section>

      {/* Fasilitas GOR Section (Glassmorphism Grid) */}
      <section className="w-full max-w-5xl mx-auto px-6 py-12 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-gor-court uppercase tracking-widest block">Standardisasi GOR</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Fasilitas Lapangan</h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">Kenyamanan bermain badminton didukung fasilitas lapangan prima berkualitas</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "🏸", title: "Karpet Lapangan Premium", desc: "Alas menggunakan karpet vinyl standar kompetisi yang tebal, meredam benturan kaki dan aman tidak licin." },
            { icon: "💡", title: "Lampu LED Anti Silau", desc: "Pencahayaan LED khusus didesain agar menyebar rata ke seluruh court tanpa membuat silau pandangan pemain." },
            { icon: "🚿", title: "Toilet & Kamar Bilas", desc: "Fasilitas toilet bersih, ruang ganti baju yang nyaman, gantungan pakaian, dan keran shower air bersih." },
            { icon: "🚗", title: "Parkir Kendaraan Luas", desc: "Area parkir motor dan mobil sangat luas langsung di depan GOR, diawasi petugas dan terpantau kamera CCTV." }
          ].map((item, idx) => (
            <div 
              key={idx} 
              className="bg-slate-950/40 backdrop-blur-md border border-slate-900 p-6 rounded-3xl space-y-3.5 shadow-lg hover:border-slate-800 hover:bg-slate-950/60 transition-all duration-300 hover:translate-y-[-4px]"
            >
              <div className="w-11 h-11 bg-[#0d121f] border border-slate-850 rounded-2xl flex items-center justify-center text-xl shadow-inner">
                {item.icon}
              </div>
              <h4 className="text-xs font-bold text-white tracking-tight">{item.title}</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="w-full max-w-4xl mx-auto px-6 py-12 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-gor-primary uppercase tracking-widest block">Skema Pembayaran</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Pilihan Tarif Sewa</h2>
          <p className="text-xs text-slate-400">Pilih skema penyewaan jam reguler kasual atau paket berlangganan member bulanan</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Regular Pricing Card */}
          <div className="bg-slate-950/40 border border-slate-900 p-6 md:p-8 rounded-3xl space-y-6 flex flex-col justify-between hover:border-slate-800 hover:bg-[#090d16] transition-all duration-300 shadow-xl">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] bg-gor-primary/10 text-gor-primary border border-gor-primary/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                  Sewa Reguler
                </span>
                <span className="text-[10px] text-slate-500 font-bold uppercase">Kasual / Jam</span>
              </div>
              
              <h3 className="text-3xl font-black text-white">
                {formatRupiah(100000)} <span className="text-xs font-normal text-slate-400">/ 2 Jam</span>
              </h3>
              
              <p className="text-xs text-slate-400 leading-relaxed">
                Ideal untuk penyewaan santai sewaktu-waktu bersama teman kerja atau komunitas tanpa ikatan jadwal berkala.
              </p>

              <div className="h-[1px] bg-slate-900/60" />

              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-gor-court font-black text-sm select-none">✓</span>
                  <span>Durasi bermain sepuasnya 2 jam penuh</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gor-court font-black text-sm select-none">✓</span>
                  <span>Bebas menentukan jam operasional kosong</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gor-court font-black text-sm select-none">✓</span>
                  <span>Metode bayar QRIS (+Rp1.000) atau COD di tempat</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gor-court font-black text-sm select-none">✓</span>
                  <span>Akses toilet, parkir, dan ruang ganti bersih</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => router.push("/booking")}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-white rounded-2xl font-bold text-xs transition-all active:scale-95"
            >
              Pesan Lapangan
            </button>
          </div>

          {/* Member Pricing Card */}
          <div className="bg-gradient-to-b from-orange-950/15 to-[#06080e]/40 border border-gor-bata/40 p-6 md:p-8 rounded-3xl space-y-6 flex flex-col justify-between hover:border-gor-bata transition-all duration-350 relative shadow-2xl hover:shadow-orange-950/10">
            <div className="absolute top-6 right-6 text-[9px] bg-gor-bata/20 border border-gor-bata/40 px-2.5 py-1 rounded-full font-black text-gor-bata uppercase tracking-widest select-none">
              🌟 Paling Hemat
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] bg-gor-bata/15 text-gor-bata border border-gor-bata/30 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                  Paket Member Bulanan
                </span>
              </div>
              
              <h3 className="text-3xl font-black text-white">
                {formatRupiah(400000)} <span className="text-xs font-normal text-slate-400">/ Bulan</span>
              </h3>
              
              <p className="text-xs text-slate-400 leading-relaxed">
                Jaminan tersedianya lapangan tetap (Fixed Slot) pada hari dan jam yang sama secara rutin di setiap minggu.
              </p>

              <div className="h-[1px] bg-slate-900/60" />

              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-gor-court font-black text-sm select-none">✓</span>
                  <span>Prioritas kunci slot jadwal tetap seminggu sekali</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gor-court font-black text-sm select-none">✓</span>
                  <span>Dinamis 4-5 kali tanding (otomatis dalam 30 hari)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gor-court font-black text-sm select-none">✓</span>
                  <span>Pembayaran aman dipecah per baris transaksi atomik</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gor-court font-black text-sm select-none">✓</span>
                  <span>Menghemat pengeluaran bulanan sewa hingga 20%</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => router.push("/booking")}
              className="w-full py-3.5 bg-gor-bata hover:bg-orange-600 text-white rounded-2xl font-bold text-xs transition-all shadow-lg shadow-orange-950/20 active:scale-95"
            >
              Mendaftar Member
            </button>
          </div>
        </div>
      </section>

      {/* Booking Steps (Alur Pemesanan) */}
      <section className="w-full max-w-4xl mx-auto px-6 py-12 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Prosedur Sewa</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Langkah Mudah Pemesanan</h2>
          <p className="text-xs text-slate-400">Alur sederhana mengamankan sewa lapangan badminton GOR Pandu</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { num: "01", icon: "👤", title: "Registrasi / Masuk", desc: "Masuk akun menggunakan email terdaftar atau cari instan via nomor WhatsApp." },
            { num: "02", icon: "🗓️", title: "Pilih Jam Lapangan", desc: "Pilih nomor Court lapangan, tanggal bermain, dan jam slot sewa yang kosong." },
            { num: "03", icon: "💳", title: "Lakukan Pembayaran", desc: "Pindai kode QRIS otomatis (+Biaya Layanan Rp1.000) atau pilih bayar COD." },
            { num: "04", icon: "🏸", title: "Mulai Bertanding", desc: "Tunjukkan bukti booking ke pengelola GOR Pandu Meulaboh saat tiba." },
          ].map((step, idx) => (
            <div key={idx} className="bg-slate-950/40 border border-slate-900 p-5 rounded-2xl relative overflow-hidden shadow-md">
              <span className="text-3xl font-black text-slate-900/40 absolute right-3.5 top-2 select-none">
                {step.num}
              </span>
              <div className="text-xl mb-2.5">{step.icon}</div>
              <h4 className="text-xs font-bold text-white mb-1">{step.title}</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof Gallery & Testimonials */}
      <section className="w-full max-w-5xl mx-auto px-6 py-12 space-y-12">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-gor-court uppercase tracking-widest block">Komentar Pemain</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Keseruan di GOR Pandu</h2>
          <p className="text-xs text-slate-400">Dokumentasi jepretan lapangan dan ulasan kepuasan dari komunitas lokal</p>
        </div>

        {/* Gallery Grid (Actual styled picture placeholders) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="h-32 md:h-40 bg-gradient-to-br from-[#121829] to-[#0a0f1d] border border-slate-850 rounded-2xl relative overflow-hidden flex flex-col justify-between p-3.5 group shadow hover:border-slate-800 transition-all">
            <span className="text-2xl">🏸</span>
            <div>
              <span className="text-[9px] bg-gor-court/10 text-gor-court border border-gor-court/20 px-2 py-0.5 rounded font-bold uppercase block w-max">Court 1 Vinyl</span>
              <span className="text-[10px] font-bold text-white block mt-1.5">Kebersihan Karpet</span>
            </div>
          </div>

          <div className="h-32 md:h-40 bg-gradient-to-br from-[#121829] to-[#0a0f1d] border border-slate-850 rounded-2xl relative overflow-hidden flex flex-col justify-between p-3.5 group shadow hover:border-slate-800 transition-all">
            <span className="text-2xl">💡</span>
            <div>
              <span className="text-[9px] bg-gor-primary/10 text-gor-primary border border-gor-primary/20 px-2 py-0.5 rounded font-bold uppercase block w-max">Lighting</span>
              <span className="text-[10px] font-bold text-white block mt-1.5">LED Menyebar Merata</span>
            </div>
          </div>

          <div className="h-32 md:h-40 bg-gradient-to-br from-[#121829] to-[#0a0f1d] border border-slate-850 rounded-2xl relative overflow-hidden flex flex-col justify-between p-3.5 group shadow hover:border-slate-800 transition-all">
            <span className="text-2xl">🏆</span>
            <div>
              <span className="text-[9px] bg-gor-bata/15 text-gor-bata border border-gor-bata/30 px-2 py-0.5 rounded font-bold uppercase block w-max">Internal Cup</span>
              <span className="text-[10px] font-bold text-white block mt-1.5">Sesi Pertandingan</span>
            </div>
          </div>

          <div className="h-32 md:h-40 bg-gradient-to-br from-[#121829] to-[#0a0f1d] border border-slate-850 rounded-2xl relative overflow-hidden flex flex-col justify-between p-3.5 group shadow hover:border-slate-800 transition-all">
            <span className="text-2xl">🍿</span>
            <div>
              <span className="text-[9px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-bold uppercase block w-max">Kantin & Parkir</span>
              <span className="text-[10px] font-bold text-white block mt-1.5">Fasilitas Penunjang</span>
            </div>
          </div>
        </div>

        {/* Testimonials Review Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: "Hendra Wijaya", role: "Smash Club Meulaboh", text: "Kualitas karpet lapangan GOR Pandu mantap, tidak licin sama sekali. Pencahayaan LED-nya pas, tidak silau saat melihat shuttlecock ke atas." },
            { name: "dr. Faisal", role: "Langganan Member Bulanan", text: "Paket member bulanan sangat praktis. Begitu bayar via QRIS sistem langsung auto-verify, jadwal main rutin kami setiap minggu otomatis aman dikunci." },
            { name: "Pak Samsul", role: "Pemain Badminton Kasual", text: "Proses booking-nya anti ribet. Parkirannya aman karena ada petugas jaga, toilet dan kamar mandi bilas setelah tanding juga bersih." }
          ].map((review, idx) => (
            <div key={idx} className="bg-slate-950/40 border border-slate-900 p-6 rounded-2xl space-y-3 shadow-md">
              <div className="flex gap-0.5 text-amber-500 font-extrabold text-[11px] select-none">⭐️⭐️⭐️⭐️⭐️</div>
              <p className="text-[11px] text-slate-300 italic leading-relaxed">"{review.text}"</p>
              <div className="pt-1.5 border-t border-slate-900/60">
                <span className="text-xs font-bold text-white block">{review.name}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{review.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer with Contact Info & Google Maps */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-12 mt-12 border-t border-slate-900/60 grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-[#05070c]/50">
        <div className="space-y-6">
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white tracking-wide">GOR Pandu Meulaboh</h4>
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
            <div className="text-slate-400">📞 WhatsApp / Telepon: <a href="https://wa.me/6281360078986" className="text-gor-primary font-black hover:underline">0813-6007-8986</a></div>
            <div className="text-slate-400">📸 Instagram: <a href="https://instagram.com/gor_pandu_meulaboh" target="_blank" rel="noopener noreferrer" className="text-gor-primary font-semibold hover:underline">@gor_pandu_meulaboh</a></div>
            <div className="text-slate-400">✉️ Email: <span className="text-slate-300 font-medium">info@gor-pandu.com</span></div>
          </div>
          
          <p className="text-[10px] text-slate-500">
            © 2026 Booking GOR Pandu. Developed as PWA.
          </p>
        </div>

        {/* Real responsive Google Maps iframe */}
        <div className="w-full h-52 bg-slate-950/80 rounded-2xl overflow-hidden border border-slate-900 shadow-2xl relative">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3978.7844005615783!2d96.12450517409252!3d4.124116046462705!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x303ec3a0c5c4e9cf%3A0xe54e60b138e6dfd8!2sJl.%20Imam%20Bonjol%2C%20Seuneubok%2C%20Kec.%20Johan%20Pahlawan%2C%20Kabupaten%20Aceh%20Barat%2C%20Aceh!5e0!3m2!1sid!2sid!4v1700000000000!5m2!1sid!2sid"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="opacity-70 hover:opacity-100 transition-opacity duration-300"
          />
        </div>
      </footer>

      {/* Floating WhatsApp Helper for elderly/non-technical users */}
      <a
        href="https://wa.me/6281360078986?text=Halo%20Admin%20GOR%20Pandu%2C%20saya%20ingin%20memesan%20lapangan%20secara%20manual%20lewat%20chat%20karena%20kesulitan%20menggunakan%20aplikasi%2Fwebsite.%20Bisa%20tolong%20bantu%20cek%20jadwal%20yang%20kosong%3F"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 transition-all duration-350 hover:scale-105 font-black text-xs border border-emerald-400 active:scale-95 ring-4 ring-emerald-500/20"
      >
        <span className="text-base animate-bounce" style={{ animationDuration: "2s" }}>💬</span>
        <span>Bantuan WA</span>
      </a>

    </div>
  );
}
