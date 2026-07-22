import posthog from "posthog-js";

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if (projectToken) {
  posthog.init(projectToken, {
    api_host: apiHost,
    defaults: "2026-05-30",
    autocapture: false,
    disable_session_recording: true,
    debug: process.env.NODE_ENV === "development",
    capture_pageview: false,
    capture_heatmaps: false,
    // TODO: sette opp sånn at vi kun tracker når bruker har tillatt. Dette har vi feks gjort i kartkatalog.react
    // opt_out_capturing_by_default: true,
  });
}
