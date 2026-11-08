import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The floating dev badge sits bottom-left, which is exactly where the
  // speedometer lives. Errors still surface without it.
  devIndicators: false,
};

export default nextConfig;
