import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@reno/core"],
  outputFileTracingRoot: path.join(__dirname, "../.."),
  experimental: {
    serverActions: {
      // Image data URLs are large; keep headroom for a full-size photo.
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
