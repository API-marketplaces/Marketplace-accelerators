import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Azure Static Web Apps hybrid (SSR) rendering
  output: "standalone",

  // Expose FASTAPI_URL to server-side API routes at runtime
  env: {
    FASTAPI_URL: process.env.FASTAPI_URL ?? "http://localhost:8000",
  },

  // Allow images from Azure and localhost origins
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.azurewebsites.net" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
};

export default nextConfig;