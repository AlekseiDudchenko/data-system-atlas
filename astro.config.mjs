import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
export default defineConfig({
  site: "https://data-systems-atlas.dudchenko.org",
  output: "static",
  i18n: {
    defaultLocale: "en",
    locales: ["en", "de", "ru"],
    routing: { prefixDefaultLocale: false },
  },
  // German remains unpublished; English uses unprefixed routes.
  redirects: {
    "/de": "/ru/",
    "/de/data-transfers": "/ru/data-transfers/",
    "/de/data-transfers/push": "/ru/data-transfers/push/",
  },
  integrations: [react(), mdx()],
  // Development preview host used by the workspace browser.
  vite: { server: { allowedHosts: ["terminal.local"] } },
});
