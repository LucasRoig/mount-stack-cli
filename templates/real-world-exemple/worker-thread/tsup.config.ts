import { defineConfig } from "tsup";

export default defineConfig({
  entry: { worker: "src/worker.ts" },
  format: "esm",
  platform: "node",
  outDir: "dist",
  bundle: true,
  noExternal: [/.*/],
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
});
