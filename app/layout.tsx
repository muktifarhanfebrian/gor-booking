import type { Metadata, Viewport } from "next";
import { Montserrat, Open_Sans } from "next/font/google";
import "./globals.css";
import RegisterSW from "../components/RegisterSW";
import InstallPWA from "../components/InstallPWA";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#2563EB",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Booking GOR Pandu Meulaboh - Sewa Lapangan Badminton Online",
  description:
    "Sistem penyewaan lapangan badminton GOR Pandu di Ujong, Meulaboh. Booking mudah secara online, mendukung pembayaran QRIS otomatis dan Keanggotaan Member.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GOR Pandu",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${montserrat.variable} ${openSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#050810] text-slate-100 selection:bg-gor-primary/30 selection:text-white font-sans">
        <RegisterSW />
        <main className="flex-1 flex flex-col">{children}</main>
        <InstallPWA />
      </body>
    </html>
  );
}
