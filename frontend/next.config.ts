import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  basePath,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "editor.geonorge.no",
        pathname: "/thumbnails/**",
      },
      {
        protocol: "https",
        hostname: "editor.test.geonorge.no",
        pathname: "/thumbnails/**",
      },
    ],
  },
  output: "standalone",
  typedRoutes: true,
  reactCompiler: true,
};

export default nextConfig;
