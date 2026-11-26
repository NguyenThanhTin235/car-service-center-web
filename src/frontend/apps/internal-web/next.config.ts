import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ["@car-service-center/ui", "@car-service-center/lib"],
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ['react-hot-toast', '@reduxjs/toolkit'],
  },
};

export default nextConfig;
