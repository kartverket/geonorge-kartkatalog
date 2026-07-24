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
  output: "standalone",
  typedRoutes: true,
  reactCompiler: true,
};

export default nextConfig;
