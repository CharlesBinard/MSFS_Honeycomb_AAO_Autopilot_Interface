import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://192.168.1.11:43380", // URL de l'API d'Axis and Ohs
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""), // Retire le préfixe /api dans les requêtes
      },
    },
  },
});
