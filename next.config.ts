import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {
    // Explicitly set the root to avoid misdetection from parent lockfiles
    root: "/Users/thecasterymedia/Downloads/ANTIGRAVITY/film_resource_africa/film-directory",
  },
};

export default nextConfig;
