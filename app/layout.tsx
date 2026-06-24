import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Referent",
  description: "Референт-переводчик с ИИ-обработкой",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="overflow-x-hidden antialiased text-slate-900">{children}</body>
    </html>
  );
}
