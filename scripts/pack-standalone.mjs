#!/usr/bin/env node
/**
 * Packages a self-contained `dist/` folder ready to upload to Hostinger
 * (or any Node host) after `npm run build` has produced a standalone output.
 *
 * Why a script?
 *  - Next's standalone output lives at `.next/standalone/`, but it does NOT
 *    automatically copy `public/` or `.next/static/` next to it.
 *  - Hostinger's "Setup Node.js App" wizard runs `npm install` against the
 *    uploaded folder, so we also include `package.json` (with a tiny start
 *    script) and a fresh `.env.example` that mirrors what the app expects.
 *
 * Output layout (everything you need to upload):
 *
 *   dist/
 *   ├── server.js               ← Hostinger startup file
 *   ├── package.json            ← minimal manifest with `npm start`
 *   ├── .next/                  ← compiled app + static assets
 *   ├── public/                 ← static assets + uploads/
 *   ├── prisma/                 ← schema + raw SQL for phpMyAdmin
 *   ├── node_modules/           ← only the deps Next traced as needed
 *   └── .env.example
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const dist = path.join(root, "dist");

async function rmrf(target) {
  await fs.rm(target, { recursive: true, force: true });
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  for (const entry of await fs.readdir(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isSymbolicLink()) {
      const target = await fs.readlink(s);
      await fs.symlink(target, d).catch(() => fs.copyFile(s, d));
    } else if (entry.isDirectory()) {
      await copyDir(s, d);
    } else {
      await fs.copyFile(s, d);
    }
  }
}

async function main() {
  const standaloneDir = path.join(root, ".next", "standalone");
  try {
    await fs.access(standaloneDir);
  } catch {
    console.error(
      `[pack-standalone] ${standaloneDir} not found.\n` +
        `Run \`npm run build\` first; ensure next.config.ts has output: "standalone".`,
    );
    process.exit(1);
  }

  console.log("[pack-standalone] Resetting dist/...");
  await rmrf(dist);
  await fs.mkdir(dist, { recursive: true });

  console.log("[pack-standalone] Copying .next/standalone/* → dist/");
  await copyDir(standaloneDir, dist);

  console.log("[pack-standalone] Copying .next/static → dist/.next/static");
  await copyDir(
    path.join(root, ".next", "static"),
    path.join(dist, ".next", "static"),
  );

  console.log("[pack-standalone] Copying public/ → dist/public");
  await copyDir(path.join(root, "public"), path.join(dist, "public"));

  console.log("[pack-standalone] Copying prisma/ → dist/prisma");
  await copyDir(path.join(root, "prisma"), path.join(dist, "prisma"));

  // Replace the auto-generated package.json with a minimal one that Hostinger
  // can `npm install` quickly. Standalone bundles its deps under node_modules
  // already, so this manifest is essentially metadata + the start script.
  const minimalPkg = {
    name: "rono-lr-web",
    version: "1.0.0",
    private: true,
    scripts: {
      start: "node server.js",
    },
    engines: {
      node: ">=20.0.0 <21.0.0",
    },
  };
  await fs.writeFile(
    path.join(dist, "package.json"),
    JSON.stringify(minimalPkg, null, 2) + "\n",
  );

  // Drop a deploy-ready env example next to the bundle.
  await fs.copyFile(
    path.join(root, ".env.production.example"),
    path.join(dist, ".env.example"),
  );

  // Make sure uploads dir exists so first writes don't ENOENT.
  for (const kind of ["photos", "signatures", "logos", "stamps"]) {
    const dir = path.join(dist, "public", "uploads", kind);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, ".gitkeep"), "");
  }

  const bytes = await sizeBytes(dist);
  console.log(
    `[pack-standalone] ✓ dist/ ready (${(bytes / (1024 * 1024)).toFixed(1)} MB)`,
  );
  console.log("[pack-standalone] Upload the contents of dist/ to Hostinger.");
}

async function sizeBytes(dir) {
  let total = 0;
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) total += await sizeBytes(p);
    else total += (await fs.stat(p)).size;
  }
  return total;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
