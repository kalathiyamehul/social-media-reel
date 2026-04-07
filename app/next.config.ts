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
        source: "/api/creators/:path*",
        destination: `${backendUrl}/api/instagram/creators/:path*`,
      },
      {
        source: "/api/creators",
        destination: `${backendUrl}/api/instagram/creators`,
      },
      {
        source: "/api/configs/:path*",
        destination: `${backendUrl}/api/instagram/configs/:path*`,
      },
      {
        source: "/api/configs",
        destination: `${backendUrl}/api/instagram/configs`,
      },
      {
        source: "/api/content-mix/:path*",
        destination: `${backendUrl}/api/instagram/content-mix/:path*`,
      },
      {
        source: "/api/content-mix",
        destination: `${backendUrl}/api/instagram/content-mix`,
      },
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

