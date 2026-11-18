import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Em desenvolvimento o front roda em http://localhost:5173 e a API em
// http://localhost:3000. O api.ts já chama a API pela URL completa em dev
// (o back tem cors() ligado), mas o proxy abaixo deixa "/api/..." funcionando
// também caso alguém troque o API_BASE para "".
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
