import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "admingaming.chiprin.com",
    "dashboardgaming.chiprin.com",
    "*.chiprin.com",
    "localhost",
    "127.0.0.1",
  ],
};

export default nextConfig;
