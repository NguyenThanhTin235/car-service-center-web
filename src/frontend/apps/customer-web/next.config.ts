import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ["@car-service-center/ui", "@car-service-center/lib"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["@reduxjs/toolkit", "react-redux"],
  },
};

export default nextConfig;
