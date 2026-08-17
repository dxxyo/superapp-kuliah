import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jadwal Kuliah Kelas A — Semester 1",
  description: "Superapp jadwal kuliah Kelas A: jadwal, notes, materi, todo list, notifikasi, dan export kalender.",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#0c2440",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
