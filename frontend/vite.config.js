import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Клиентская часть «PC Sale». В режиме разработки запросы к /api
// проксируются на запущенный сервер FastAPI (http://127.0.0.1:8000).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: "127.0.0.1",
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
    host: "127.0.0.1",
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
