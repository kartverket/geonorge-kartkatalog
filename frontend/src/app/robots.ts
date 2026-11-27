import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/siteUrl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      other: {
        "Content-Signal": "ai-train=no, search=yes, ai-input=no",
      },
    },
    sitemap: siteUrl("/sitemap.xml"),
  };
}
