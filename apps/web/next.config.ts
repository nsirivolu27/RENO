import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@reno/core"],
  experimental: {
    serverActions: {
      // Image data URLs are large; keep headroom for a full-size photo.
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
