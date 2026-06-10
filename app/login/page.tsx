"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState<boolean>(true);
  
  // Form Inputs
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");

  // UI States
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isMockAuth, setIsMockAuth] = useState<boolean>(false);

  // Check if using mock Supabase keys
  useEffect(() => {
    const isMock = 
      !process.env.NEXT_PUBLIC_GOR_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_GOR_SUPABASE_URL.includes("your-gor-supabase-url") ||
      process.env.NEXT_PUBLIC_GOR_SUPABASE_URL.includes("placeholder");
    
    setIsMockAuth(isMock);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!email || !password || (!isLogin && !fullName)) {
      setMessage({ type: "error", text: "Mohon isi semua kolom input." });
      setLoading(false);
      return;
    }

    try {
      if (isMockAuth) {
        // MOCK AUTHENTICATION FLOW
        console.warn("Using Mock Authentication fallback.");
        
        if (isLogin) {
          // Admin account mock
          if (email === "admin@gor.com" && password === "admin123") {
            localStorage.setItem("gor_session", JSON.stringify({ email, role: "admin", name: "Administrator GOR" }));
            setMessage({ type: "success", text: "Login admin berhasil! Mengalihkan..." });
            setTimeout(() => router.push("/admin"), 1000);
          } else {
            // General user account mock
            localStorage.setItem("gor_session", JSON.stringify({ email, role: "user", name: email.split("@")[0] }));
            setMessage({ type: "success", text: "Login user berhasil! Mengalihkan..." });
            setTimeout(() => router.push("/booking/history"), 1000);
          }
        } else {
          // Sign Up mock - save to json database
          await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "register_user",
              email,
              name: fullName,
              phone: "0812" + Math.floor(10000000 + Math.random() * 90000000)
            })
          });
          setMessage({ type: "success", text: "Pendaftaran berhasil! Silakan login." });
          setIsLogin(true);
        }
      } else {
        // CUSTOM TABLE AUTHENTICATION FLOW
        if (isLogin) {
          const res = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "login_admin",
              email,
              password
            })
          });

          const result = await res.json();

          if (!res.ok || !result.success) {
            throw new Error(result.error || "Login gagal. Pastikan email dan password Anda benar.");
          }

          const user = result.user;
          const isAdmin = user.role === "admin";
          
          localStorage.setItem(
            "gor_session",
            JSON.stringify({
              email: user.email,
              role: user.role,
              name: user.name,
              id: user.id
            })
          );

          setMessage({ type: "success", text: "Login berhasil! Mengalihkan..." });
          setTimeout(() => {
            if (isAdmin) {
              router.push("/admin");
            } else {
              router.push("/booking/history");
            }
          }, 1000);
        } else {
          // Sign Up
          throw new Error("Pendaftaran mandiri dengan password dinonaktifkan. Silakan gunakan login OTP via WhatsApp atau hubungi admin.");
        }
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Terjadi kesalahan otentikasi." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 bg-slate-950 relative overflow-hidden">
      {/* Decorative radial gradients */}
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-lime-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Top Navigation */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold rounded-xl transition-all"
        >
          ← Beranda
        </button>
        <span className="text-xs text-slate-500 font-bold tracking-wider">GOR PANDU MEULABOH</span>
      </div>

      <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-md border border-slate-800/60 p-8 rounded-3xl shadow-2xl space-y-6">
        
        {/* Branding header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-gor-primary/10 border border-gor-primary/20 text-gor-primary rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-2 shadow-inner">
            🏸
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {isLogin ? "Masuk Akun" : "Daftar Akun Baru"}
          </h2>
          <p className="text-xs text-slate-400">
            Akses sistem booking sewa lapangan GOR Pandu Meulaboh
          </p>
        </div>

        {/* Mock auth info notification */}
        {isMockAuth && (
          <div className="p-3 bg-amber-950/40 border border-amber-900/40 text-amber-200 text-[10px] rounded-xl leading-relaxed">
            <strong>Mode Demo Aktif:</strong> Supabase tidak terhubung. Anda dapat menggunakan akun simulasi:
            <ul className="list-disc list-inside mt-1 font-semibold">
              <li>Admin: admin@gor.com / admin123</li>
              <li>Penyewa: email bebas / password bebas</li>
            </ul>
          </div>
        )}

        {message && (
          <div
            className={`p-3 text-xs rounded-xl border ${
              message.type === "success"
                ? "bg-emerald-950/40 border-emerald-800 text-emerald-200"
                : "bg-red-950/40 border-red-800 text-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nama Lengkap</label>
              <input
                type="text"
                placeholder="Nama Lengkap Anda"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Alamat Email</label>
            <input
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-all"
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full py-3.5 bg-lime-500 hover:bg-lime-400 hover:scale-105 text-slate-950 rounded-xl font-extrabold shadow-lg shadow-lime-500/20 text-sm transition-all duration-300 flex justify-center items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Memproses...
              </>
            ) : isLogin ? (
              "Masuk Sekarang"
            ) : (
              "Daftar Akun"
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage(null);
            }}
            className="text-xs text-gor-primary hover:underline font-semibold"
          >
            {isLogin ? "Belum punya akun? Daftar di sini" : "Sudah punya akun? Masuk di sini"}
          </button>
        </div>

      </div>
    </div>
  );
}
