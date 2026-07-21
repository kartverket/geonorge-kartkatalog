import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ hostname: "editor.geonorge.no" }],
  },
  /* config options here */
  typedRoutes: true,
  reactCompiler: true,
};

export default nextConfig;
