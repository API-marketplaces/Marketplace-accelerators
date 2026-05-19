import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Raise the default server action / route handler timeout from 10s to 30s.
  // The analytics endpoints process large CSV/Excel files (100k+ rows) via
  // FastAPI and routinely take 5-10s — this prevents the "signal is aborted
  // without reason" AbortError that appeared when slow responses were cut off.
  serverExternalPackages: [],
  experimental: {
    // serverActions timeout (ms) — applies globally as a backstop.
    serverActionsBodySizeLimit: "10mb",
  },
};

export default nextConfig;