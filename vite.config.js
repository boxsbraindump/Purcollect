import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/Purcollect/",
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: "build.html"
    }
  }
});
