import posthog from "posthog-js";
import { markPosthogInitialized } from "@/components/PosthogConsent/posthogConsent";

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if (process.env.NODE_ENV === "production" && projectToken && apiHost) {
  posthog.init(projectToken, {
    api_host: apiHost,
    defaults: "2026-05-30",
    autocapture: false,
    disable_session_recording: true,
    capture_pageview: false,
    capture_pageleave: false,
    capture_heatmaps: false,
    opt_out_capturing_by_default: true,
  });

  markPosthogInitialized();
}
