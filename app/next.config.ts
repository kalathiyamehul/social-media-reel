import type { NextConfig } from "next";
import path from "path";
import { config } from "dotenv";

// Load .env from parent directory
config({ path: path.join(__dirname, "..", ".env") });

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.cdninstagram.com" },
      { protocol: "https", hostname: "**.fbcdn.net" },
      { protocol: "https", hostname: "scontent.cdninstagram.com" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/pipeline",
        destination: "http://localhost:3000/api/instagram/pipeline/stream",
      },
      {
        source: "/api/videos/:path*",
        destination: "http://localhost:3000/api/instagram/posts/:path*",
      },
      {
        source: "/api/videos",
        destination: "http://localhost:3000/api/instagram/posts",
      },
      // Catch-all for other instagram endpoints (creators, configs, content-mix)
      {
        source: "/api/:path*",
        destination: "http://localhost:3000/api/instagram/:path*",
      },
    ];
  },
};

export default nextConfig;
