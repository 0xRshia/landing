import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output includes only the server and runtime dependencies needed
  // by the Docker image. Regular builds retain the Cloudflare Worker output.
  output: process.env.VINEXT_STANDALONE === "1" ? "standalone" : undefined,
};

export default nextConfig;
