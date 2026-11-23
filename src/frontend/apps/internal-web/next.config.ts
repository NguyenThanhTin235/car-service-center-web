import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['recharts', '@reduxjs/toolkit'],
  },
};

export default nextConfig;
