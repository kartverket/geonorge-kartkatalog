import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const displayFullUrl = process.env.NEXT_PUBLIC_DISPLAY_FULL_URL === "true";

const nextConfig: NextConfig = {
  basePath,
  cacheComponents: true,
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
  logging: {
    fetches: {
      fullUrl: displayFullUrl,
    },
  },
};

export default nextConfig;
