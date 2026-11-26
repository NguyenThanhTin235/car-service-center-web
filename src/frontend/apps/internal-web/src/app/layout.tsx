import type { Metadata } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["vietnamese", "latin"],
  weight: ["500", "600", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AutoCare Pro - Trang Quản Trị",
  description: "Hệ thống quản trị và vận hành dịch vụ ô tô AutoCare Pro",
};

import StoreProvider from "@/components/StoreProvider";
import WebVitalsReporter from "@/components/shared/WebVitalsReporter";
import { Toaster } from "react-hot-toast";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className={`${beVietnamPro.className} min-h-full flex flex-col`}>
        <StoreProvider>
          <WebVitalsReporter appName="internal-web" />
          {children}
        </StoreProvider>
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
