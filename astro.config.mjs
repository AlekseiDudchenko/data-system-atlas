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
  integrations: [react(), mdx()],
});
