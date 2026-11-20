import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base './' es obligatorio para el despliegue en subruta de AWS.
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
});
