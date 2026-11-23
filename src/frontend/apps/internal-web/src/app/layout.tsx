import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AutoCare Pro - Trang Quản Trị",
  description: "Hệ thống quản trị và vận hành dịch vụ ô tô AutoCare Pro",
};

import StoreProvider from "@/components/StoreProvider";
import { Toaster } from "react-hot-toast";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${beVietnamPro.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${beVietnamPro.className} min-h-full flex flex-col`}>
        <StoreProvider>{children}</StoreProvider>
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            className: 'border border-outline-variant shadow-lg font-semibold text-body-md bg-surface-container-lowest text-on-surface rounded-xl',
            duration: 3000,
            style: {
              padding: '16px',
            },
            success: {
              iconTheme: {
                primary: '#16a34a',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#dc2626',
                secondary: '#ffffff',
              },
            }
          }}
        />
      </body>
    </html>
  );
}
