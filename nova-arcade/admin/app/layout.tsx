import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JINQP Control — Quản trị hệ thống",
  description: "Quản trị thành viên, gói dịch vụ, game và sổ cái xu JINQP Gaming Center.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased">{children}</body>
    </html>
  );
}
