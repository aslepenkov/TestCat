import { build } from "esbuild";

build({
  entryPoints: ["index.ts"],
  outfile: "dist/index.js",
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  sourcemap: true,
  logLevel: "info",
  tsconfig: "tsconfig.json",
  packages: "external", // ✅ externalize all npm packages automatically
}).catch(() => process.exit(1));
