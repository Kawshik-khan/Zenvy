import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // @ts-ignore
  allowedDevOrigins: ['10.67.188.161'],
};

export default nextConfig;
