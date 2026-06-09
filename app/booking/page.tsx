"use client";

import React from "react";
import { useRouter } from "next/navigation";
import BookingForm from "@/components/BookingForm";

export default function BookingPage() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-8 bg-[#080b11]">
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

      {/* Main Form */}
      <BookingForm onBookingSuccess={() => router.push("/booking/history")} />
    </div>
  );
}
