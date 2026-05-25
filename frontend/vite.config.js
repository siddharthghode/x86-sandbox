import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // All /api/* calls are forwarded to Django during development
      "/api": "http://localhost:8000",
    },
  },
});
