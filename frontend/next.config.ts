import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "editor.geonorge.no",
        pathname: "/thumbnails/**",
      },
    ],
  },
  /* config options here */
  typedRoutes: true,
  reactCompiler: true,
};

export default nextConfig;
