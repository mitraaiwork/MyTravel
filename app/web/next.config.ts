import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.mapbox.com" },
    ],
  },
  webpack(config) {
    // pnpm uses symlinks to its store; on Windows/OneDrive readlink fails.
    // Telling webpack not to follow symlinks avoids the EINVAL errors.
    config.resolve.symlinks = false;
    return config;
  },
};

export default nextConfig;
