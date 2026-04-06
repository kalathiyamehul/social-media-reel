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
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
    return [
      {
        source: "/api/pipeline",
        destination: `${backendUrl}/api/instagram/pipeline/stream`,
      },
      {
        source: "/api/videos/:path*",
        destination: `${backendUrl}/api/instagram/posts/:path*`,
      },
      {
        source: "/api/videos",
        destination: `${backendUrl}/api/instagram/posts`,
      },
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/instagram/:path*`,
      },
    ];
  },
};

export default nextConfig;

