import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",           // para acceder desde cualquier IP local
    port: 8080,           // puerto dev
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000", // tu backend FastAPI
        changeOrigin: true,
        secure: false,
        // NO rewrite, dejamos /api intacto para que FastAPI lo reciba tal cual
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(), // tagger solo en dev
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // alias para imports limpios
    },
  },
  build: {
    outDir: "dist",
    sourcemap: mode === "development", // source maps solo en dev
  },
  define: {
    "process.env": process.env, // útil para variables .env
  },
}));
