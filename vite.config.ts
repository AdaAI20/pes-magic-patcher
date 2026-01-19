import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  // Ensure this matches your GitHub repo name exactly
  base: "/pes-magic-patcher/", 
  
  plugins: [react()],
  
  resolve: {
    alias: {
      // This correctly maps "@" to your "src" folder
      "@": path.resolve(__dirname, "./src"), 
    },
  },

  // Ensures .wasm files are treated as static assets and not inlined as text
  assetsInclude: ["**/*.wasm"], 
  
  build: {
    target: "esnext", // Modern browsers for WASM support
  }
});
