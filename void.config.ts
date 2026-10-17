import { defineConfig } from "void/config";

export default defineConfig({
  cloudflare: {
    account_id: "908138c815eac9d3d4eb9c0f5d0ba8cc",
    compatibility_date: "2026-04-16",
    name: "octo",
    observability: {
      enabled: true,
      head_sampling_rate: 1,
    },
    ratelimits: [
      {
        name: "RATE_LIMITER",
        namespace_id: "1001",
        simple: { limit: 60, period: 60 },
      },
    ],
    preview_urls: false,
    routes: [{ custom_domain: true, pattern: "octo.aayush.cv" }],
    workers_dev: false,
  },
});
