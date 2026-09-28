import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Контур — диагностика автомобиля",
  description:
    "Интерактивная 3D-схема автомобиля с визуализацией узлов, требующих проверки или ремонта.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
