// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: "https://10x-cards-2ps.pages.dev",
  output: "server",
  integrations: [react(), sitemap()],
  server: {
    port: 3000,
    host: true, // Nasłuchuj na wszystkich interfejsach
  },
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  experimental: {
    session: true,
  },
});
