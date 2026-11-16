import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JINQP Gaming Center — Không gian chơi của bạn",
  description: "Khám phá game trí tuệ và phản xạ, thành viên JINQP và ví xu thử nghiệm.",
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
