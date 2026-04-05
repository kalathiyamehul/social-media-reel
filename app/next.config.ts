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
        source: "/api/creators",
        destination: "http://localhost:3000/api/instagram/creators",
      },
      {
        source: "/api/creators/:path*",
        destination: "http://localhost:3000/api/instagram/creators/:path*",
      },
      {
        source: "/api/configs",
        destination: "http://localhost:3000/api/instagram/configs",
      },
      {
        source: "/api/configs/:path*",
        destination: "http://localhost:3000/api/instagram/configs/:path*",
      },
      {
        source: "/api/pipeline",
        destination: "http://localhost:3000/api/instagram/pipeline/stream",
      },
      {
        source: "/api/videos",
        destination: "http://localhost:3000/api/instagram/posts",
      },
      {
        source: "/api/videos/:id",
        destination: "http://localhost:3000/api/instagram/posts/:id",
      },
    ];
  },
};

export default nextConfig;
