import type { Metadata } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import StoreProvider from "@/components/StoreProvider";
import WebVitalsReporter from "@/components/shared/WebVitalsReporter";

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
  title: "AutoCare Pro – Cổng Dịch vụ Kỹ thuật Ô tô",
  description:
    "Đặt lịch bảo dưỡng, theo dõi tiến độ sửa chữa trực tiếp, duyệt báo giá minh bạch và thanh toán SePay tại AutoCare Pro.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink-primary font-sans selection:bg-accent-soft selection:text-accent-ink">
        <StoreProvider>
          <WebVitalsReporter appName="customer-web" />
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
