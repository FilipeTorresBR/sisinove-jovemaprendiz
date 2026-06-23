import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: [
      "sisdip.sisinove.com.br",
      "iso.sisinove.com.br",
      "sisaprendiz.sisinove.com.br",
      "localhost",
    ],
    watch: {
      usePolling: true,
    },
  },
});
