import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/docs/cs-system-guide",
        destination: "/docs/cs-system-guide/index.html",
      },
    ];
  },
};

export default nextConfig;
