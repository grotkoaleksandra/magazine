import type { NextConfig } from "next";

// Exported as plain static files so it can be hosted on GitHub Pages.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  images: { unoptimized: true },
};

export default nextConfig;
