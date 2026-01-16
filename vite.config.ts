import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  base: "/pes-magic-patcher/",
  plugins: [
    react({
      jsxImportSource: "react",
      jsxRuntime: "automatic",
    }),
  ],
});
