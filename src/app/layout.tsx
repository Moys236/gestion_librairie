import type { Metadata } from "next";
import { Cairo, Outfit, Sora } from "next/font/google";
import "./globals.css";
import ToastInitializer from "@/components/ToastInitializer";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ابن رشد - إدارة المكتبة",
  description: "نظام إدارة مكتبة ابن رشد للمستلزمات والكتب المدرسية",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} ${outfit.variable} ${sora.variable}`}
    >
      <head>
        <style dangerouslySetInnerHTML={{__html: `
          :root {
            --font-sans: var(--font-cairo), var(--font-outfit), system-ui, sans-serif;
            --font-heading: var(--font-cairo), var(--font-sora), sans-serif;
          }
        `}} />
      </head>
      <body>
        <ToastInitializer />
        {children}
      </body>
    </html>
  );
}
