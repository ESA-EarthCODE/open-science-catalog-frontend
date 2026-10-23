import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

/**
 * ============================================================================
 * STAC BROWSER WEB COMPONENT ASSET BUILDER / RESOLVER
 * ============================================================================
 *
 * NOTE: Currently, this project uses the upstream STAC Browser draft PR #778
 * (`use-as-component` branch: https://github.com/radiantearth/stac-browser/pull/778)
 * as the source for the `<stac-browser>` web component.
 *
 * ONCE STAC BROWSER v6.0.0 IS OFFICIALLY RELEASED ON NPM (radiantearth/stac-browser#1034):
 * 1. Add `"@radiantearth/stac-browser": "^6.0.0"` to `dependencies` in `package.json`.
 * 2. This script will automatically detect `node_modules/@radiantearth/stac-browser`
 *    and copy the pre-built npm package directly into `public/stac-browser/`,
 *    eliminating the temporary git clone & build fallback below.
 * ============================================================================
 */

const STAC_BROWSER_REPO =
  process.env.STAC_BROWSER_REPO || "https://github.com/radiantearth/stac-browser.git";
const STAC_BROWSER_BRANCH = process.env.STAC_BROWSER_BRANCH || "use-as-component";

const targetDir = path.join(rootDir, "public", "stac-browser");
const targetEntry = path.join(targetDir, "stac-browser.js");
const npmPackageDir = path.join(rootDir, "node_modules", "@radiantearth", "stac-browser");
const npmPackageEntry = path.join(npmPackageDir, "stac-browser.js");

function copyDistFiles(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.endsWith(".map")) {
      continue;
    }
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDistFiles(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

let runningPromise = null;

export function run() {
  if (runningPromise) {
    return runningPromise;
  }

  runningPromise = (async () => {
    const force = process.argv.includes("--force");

    if (!force && fs.existsSync(targetEntry)) {
      console.log("STAC Browser web component bundle already cached in public/stac-browser/. Skipping build.");
      return;
    }

    // Path 1: Once STAC Browser v6.0.0 is installed from npm (@radiantearth/stac-browser)
    if (fs.existsSync(npmPackageEntry)) {
      console.log("Found @radiantearth/stac-browser in node_modules. Copying to public/stac-browser/...");
      fs.rmSync(targetDir, { recursive: true, force: true });
      copyDistFiles(npmPackageDir, targetDir);
      console.log("STAC Browser web component copied from node_modules/@radiantearth/stac-browser!");
      return;
    }

    // Path 2: Temporary fallback until STAC Browser v6.0.0 is published on npm —
    // clone & build upstream draft PR #778 (branch `use-as-component`)
    console.log(
      `Building <stac-browser> web component from ${STAC_BROWSER_REPO}#${STAC_BROWSER_BRANCH} (temporary until v6.0.0 npm release)...`
    );
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "stac-browser-wc-"));
    try {
      execSync(
        `git clone --depth=1 --branch ${STAC_BROWSER_BRANCH} ${STAC_BROWSER_REPO} "${tmpDir}"`,
        { stdio: "inherit" }
      );
      execSync("npm install --no-audit --no-fund", { cwd: tmpDir, stdio: "inherit" });
      execSync("npm run build:npm", { cwd: tmpDir, stdio: "inherit" });

      fs.rmSync(targetDir, { recursive: true, force: true });
      copyDistFiles(path.join(tmpDir, "dist"), targetDir);
      console.log("Successfully built and cached <stac-browser> in public/stac-browser/!");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  })();

  return runningPromise;
}

if (process.argv[1] && process.argv[1].endsWith("build-stac-browser.js")) {
  run();
}
