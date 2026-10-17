import { defineConfig } from "void/config";

export default defineConfig({
  cloudflare: {
    compatibility_date: "2026-04-16",
    name: "octo",
    observability: {
      enabled: true,
      head_sampling_rate: 1,
    },
    ratelimits: [
      {
        name: "RATE_LIMITER",
        namespace_id: "0",
        simple: { limit: 60, period: 60 },
      },
    ],
    preview_urls: false,
    routes: [{ custom_domain: true, pattern: "octo.aayush.cv" }],
    workers_dev: false,
  },
});
