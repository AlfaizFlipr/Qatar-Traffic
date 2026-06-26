import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Admin dashboard runs on its own port, separate from the public site (5173).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: false,
  },
});
