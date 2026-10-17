import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["yahoo-finance2"],
  images: { unoptimized: true },
};

export default nextConfig;
