import { spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { basename, join } from "node:path";

const modelFiles = [
  "plant-cell-3d-model-tripo-v3.glb",
  "white-blood-cell-user.glb",
  "neuron-nih.glb",
  "bacteria-wall-nih.glb",
  "animal-cell-nih.glb",
  "muscle-cell-tripo-skeletal-fiber-textured-pbr.glb",
];

function getArg(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? "" : process.argv[index + 1] ?? "";
}

const bucket = getArg("--bucket") || process.env.CLOUDFLARE_R2_BUCKET;
const prefix = (getArg("--prefix") || process.env.CLOUDFLARE_R2_MODEL_PREFIX || "models").replace(/^\/+|\/+$/g, "");
const cacheAliasSuffix = getArg("--cache-alias-suffix") || process.env.CLOUDFLARE_R2_CACHE_ALIAS_SUFFIX || ".bin";

if (!bucket) {
  console.error("Usage: node scripts/upload-r2-models.mjs --bucket <r2-bucket> [--prefix models]");
  process.exit(1);
}

function uploadObject({ filePath, objectPath, size }) {
  console.log(`Uploading ${filePath} -> r2://${objectPath} (${size.toFixed(1)} MiB)`);

  const result = spawnSync(
    "npx",
    [
      "wrangler",
      "r2",
      "object",
      "put",
      objectPath,
      `--file=${filePath}`,
      "--content-type=model/gltf-binary",
      "--cache-control=public, max-age=31536000, immutable",
      "--remote",
    ],
    { stdio: "inherit" },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

for (const fileName of modelFiles) {
  const filePath = join("public", "models", fileName);
  if (!existsSync(filePath)) {
    console.error(`Missing model file: ${filePath}`);
    process.exit(1);
  }

  const objectPath = `${bucket}/${prefix}/${basename(fileName)}`;
  const size = statSync(filePath).size / 1024 / 1024;

  uploadObject({ filePath, objectPath, size });

  if (cacheAliasSuffix) {
    uploadObject({
      filePath,
      objectPath: `${objectPath}${cacheAliasSuffix}`,
      size,
    });
  }
}
