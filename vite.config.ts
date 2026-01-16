import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  base: "/pes-magic-patcher/",
  plugins: [
    react({
      jsxRuntime: "classic",
    }),
  ],
  esbuild: {
    jsxInject: `import React from "react"`,
  },
});
