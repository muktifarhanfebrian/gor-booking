"use client";

import React, { useState, useEffect } from "react";

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      // Prevent standard browser bar from showing
      e.preventDefault();
      // Store event to trigger later
      setDeferredPrompt(e);
      // Show custom banner
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Hide if already installed
    window.addEventListener("appinstalled", () => {
      setDeferredPrompt(null);
      setIsVisible(false);
      console.log("PWA Booking GOR Pandu berhasil terinstal di perangkat.");
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // Trigger prompt
    deferredPrompt.prompt();
    
    // Wait for choice
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Pilihan user untuk menginstal PWA: ${outcome}`);
    
    // Reset deferred prompt
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-50 bg-slate-950/90 backdrop-blur-md border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-2xl animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gor-primary/10 border border-gor-primary/20 text-gor-primary rounded-xl flex items-center justify-center text-base font-extrabold">
          GP
        </div>
        <div>
          <span className="block text-xs font-bold text-white leading-tight">Instal Aplikasi</span>
          <span className="block text-[10px] text-slate-400 mt-0.5">Booking lebih cepat langsung dari Home Screen</span>
        </div>
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => setIsVisible(false)}
          className="px-2.5 py-1.5 text-[11px] text-slate-500 hover:text-slate-300 font-semibold"
        >
          Nanti
        </button>
        <button
          onClick={handleInstall}
          className="px-3.5 py-1.5 bg-gor-primary hover:bg-blue-700 text-white font-bold text-[11px] rounded-xl shadow-lg shadow-blue-600/20"
        >
          Pasang
        </button>
      </div>
    </div>
  );
}
