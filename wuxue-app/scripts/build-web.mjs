import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appDir = path.resolve(__dirname, "..");
const repoRoot = path.resolve(appDir, "..");
const outputDir = path.join(appDir, "www");

const itemsToCopy = [
  "index.html",
  "calc.html",
  "yinmai.html",
  "css",
  "data",
  "extern",
  "js",
  "static"
];

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

for (const item of itemsToCopy) {
  const source = path.join(repoRoot, item);
  const destination = path.join(outputDir, item);

  if (!existsSync(source)) {
    throw new Error(`Missing required source path: ${source}`);
  }

  cpSync(source, destination, { recursive: true });
}

const dataDir = path.join(outputDir, "data");
for (const entry of readdirSync(dataDir)) {
  if (!entry.endsWith(".json.gz")) {
    continue;
  }

  const gzPath = path.join(dataDir, entry);
  const jsonPath = path.join(dataDir, entry.replace(/\.gz$/, ""));
  const jsonContent = gunzipSync(readFileSync(gzPath));
  writeFileSync(jsonPath, jsonContent);
}

const copiedEntries = readdirSync(outputDir).sort();
console.log(`Built Capacitor web assets into ${outputDir}`);
console.log(`Copied: ${copiedEntries.join(", ")}`);
