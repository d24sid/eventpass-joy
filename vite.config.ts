// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

/**
 * Build-time base resolution for GitHub Pages:
 *  - During dev: use '/' so localhost works normally
 *  - During CI/build: use VITE_BASE env var if present
 *  - Fallback for production builds: '/eventpass-joy/'
 *
 * In GitHub Actions, set VITE_BASE to "/eventpass-joy/" (or leave fallback).
 */
export default defineConfig(({ mode }) => {
  const envBase = process.env.VITE_BASE; // set in CI or locally if you want
  const isDev = mode === "development";

  const base = isDev ? "/" : envBase || "/eventpass-joy/";

  return {
    base,
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
