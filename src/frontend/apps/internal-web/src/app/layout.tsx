import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoCare Pro - Trang Quản Trị",
  description: "Hệ thống quản trị và vận hành dịch vụ ô tô AutoCare Pro",
};

import StoreProvider from "@/components/StoreProvider";
import { Toaster } from "react-hot-toast";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col">
        <StoreProvider>{children}</StoreProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
