import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

export const metadata: Metadata = {
  title: "Orion OPT | Saha Yönetim Sistemi & Proje Takip",
  description: "Orion OPT - Pazar Araştırma, Hakediş, Avans & Saha Yönetim Sistemi",
  manifest: "/manifest.json",
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: "/icon-192.svg",
    apple: "/icon-192.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  // Yakınlaştırma açık: küçük yazıyı parmakla büyütebilmek erişilebilirlik için şart
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="h-full bg-gray-50 text-gray-900 antialiased">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-gray-50 text-gray-900 selection:bg-blue-200 selection:text-gray-900">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
