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
  // Russian only for now: other entry points lead to the Russian pages.
  redirects: {
    "/": "/ru/",
    "/de": "/ru/",
    "/data-transfers": "/ru/data-transfers/",
    "/de/data-transfers": "/ru/data-transfers/",
    "/data-transfers/push": "/ru/data-transfers/push/",
    "/de/data-transfers/push": "/ru/data-transfers/push/",
  },
  integrations: [react(), mdx()],
  // Development preview host used by the workspace browser.
  vite: { server: { allowedHosts: ["terminal.local"] } },
});
