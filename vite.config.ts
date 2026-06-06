import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

function pruneCloudflarePublicAssets(): Plugin {
  let outDir = "dist";
  let root = process.cwd();

  return {
    name: "cell-architecture-studio:prune-cloudflare-public-assets",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
      root = config.root;
    },
    writeBundle() {
      const resolvedOutDir = resolve(root, outDir);
      for (const directory of ["models", "texture-references", "cell-renders"]) {
        rmSync(resolve(resolvedOutDir, directory), { recursive: true, force: true });
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isCloudflareR2AssetBuild = env.CLOUDFLARE_R2_ASSET_BUILD === "1";
  const modelAssetBaseUrl = env.VITE_MODEL_ASSET_BASE_URL?.trim();

  if (isCloudflareR2AssetBuild && !modelAssetBaseUrl) {
    throw new Error("Set VITE_MODEL_ASSET_BASE_URL before running npm run build:cloudflare.");
  }

  return {
    plugins: [react(), ...(isCloudflareR2AssetBuild ? [pruneCloudflarePublicAssets()] : [])],
  };
});
