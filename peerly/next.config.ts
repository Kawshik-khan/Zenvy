import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-ignore - To prevent potential TS mismatches with newer Next.js versions
  allowedDevOrigins: ['10.67.188.161'],
};

export default nextConfig;
