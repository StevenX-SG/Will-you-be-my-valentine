import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        format: "iife",
        name: "app",
        entryFileNames: "assets/[name].js",
      },
    },
  },
});
