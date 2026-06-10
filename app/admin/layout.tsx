import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard | GOR Pandu Cendikia Meulaboh",
  description: "Sistem Informasi Manajemen Penyewaan Lapangan Bulu Tangkis berbasis Web pada GOR Pandu Cendikia Meulaboh.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
