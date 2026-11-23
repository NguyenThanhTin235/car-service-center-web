import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['recharts', 'react-hot-toast', '@reduxjs/toolkit'],
  },
};

export default nextConfig;
