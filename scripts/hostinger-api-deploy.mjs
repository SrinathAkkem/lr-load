#!/usr/bin/env node
/**
 * Deploy lr-load-v2 to Hostinger shared hosting via API (no SSH/password).
 *
 * Usage:
 *   export HOSTINGER_API_TOKEN="your-token"
 *   node scripts/hostinger-api-deploy.mjs
 *
 * Optional env:
 *   HOSTINGER_DOMAIN=ronolr.com
 *   HOSTINGER_USERNAME=u767592127
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const API_BASE = "https://developers.hostinger.com";
const TOKEN = process.env.HOSTINGER_API_TOKEN;
const DOMAIN = process.env.HOSTINGER_DOMAIN ?? "ronolr.com";
const USERNAME = process.env.HOSTINGER_USERNAME ?? "u767592127";

if (!TOKEN) {
  console.error("Set HOSTINGER_API_TOKEN before running.");
  process.exit(1);
}

async function api(pathname, { method = "GET", body, headers = {} } = {}) {
  const res = await fetch(`${API_BASE}${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      ...headers,
    },
    body,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(`API ${method} ${pathname} -> ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

function createArchive() {
  const zipPath = path.join(ROOT, ".deploy-archive.zip");
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

  const excludes = [
    "node_modules/*",
    ".next/*",
    "dist/*",
    ".git/*",
    ".deploy-archive.zip",
    ".env",
    ".env.local",
    ".env.production",
    ".vercel/*",
    "public/homepage/extracted/*",
    "public/home-screen.svg",
  ];

  const excludeArgs = excludes.flatMap((e) => ["-x", e]);
  execSync(
    `zip -rq "${zipPath}" . ${excludeArgs.map((a) => `'${a}'`).join(" ")}`,
    { cwd: ROOT, stdio: "inherit" },
  );

  const sizeMb = fs.statSync(zipPath).size / (1024 * 1024);
  console.log(`Archive: ${zipPath} (${sizeMb.toFixed(1)} MB)`);
  if (sizeMb > 50) {
    throw new Error("Archive exceeds Hostinger 50MB limit — trim large assets.");
  }
  return zipPath;
}

async function deployFromArchive(zipPath) {
  const form = new FormData();
  const blob = new Blob([fs.readFileSync(zipPath)]);
  form.append("archive", blob, "lr-load-v2.zip");
  form.append("node_version", "20");
  form.append("build_script", "npm run build");
  form.append("entry_file", "server.js");
  form.append("package_manager", "npm");

  const url = `/api/hosting/v1/accounts/${USERNAME}/websites/${DOMAIN}/nodejs/builds/from-archive`;
  console.log(`Uploading and starting build on ${DOMAIN}...`);
  return api(url, { method: "POST", body: form });
}

async function pollBuild(uuid, maxMinutes = 20) {
  const deadline = Date.now() + maxMinutes * 60 * 1000;
  let fromLine = 0;

  while (Date.now() < deadline) {
    const builds = await api(
      `/api/hosting/v1/accounts/${USERNAME}/websites/${DOMAIN}/nodejs/builds?per_page=5`,
    );
    const build = builds?.data?.find((b) => b.uuid === uuid) ?? builds?.data?.[0];
    const state = build?.state ?? "unknown";
    console.log(`Build state: ${state}`);

    try {
      const logs = await api(
        `/api/hosting/v1/accounts/${USERNAME}/websites/${DOMAIN}/nodejs/builds/${uuid}/logs?from_line=${fromLine}`,
      );
      const lines = logs?.data ?? [];
      for (const line of lines) {
        if (line?.content) console.log(line.content);
        fromLine = Math.max(fromLine, (line?.line ?? fromLine) + 1);
      }
    } catch {
      // logs may not be ready yet
    }

    if (state === "completed") {
      console.log("Build completed.");
      await api(
        `/api/hosting/v1/accounts/${USERNAME}/websites/${DOMAIN}/nodejs/server/restart`,
        { method: "POST" },
      );
      console.log("Node.js server restarted.");
      return;
    }
    if (state === "failed") {
      throw new Error("Build failed — check logs above.");
    }

    await new Promise((r) => setTimeout(r, 15000));
  }

  throw new Error("Build timed out.");
}

async function main() {
  const zipPath = createArchive();
  const result = await deployFromArchive(zipPath);
  const uuid = result?.uuid ?? result?.data?.uuid;
  console.log("Build started:", JSON.stringify(result, null, 2));
  if (!uuid) {
    console.log("No build uuid returned — check hPanel Node.js builds.");
    return;
  }
  await pollBuild(uuid);
  console.log(`Done. Check https://${DOMAIN}/api/health`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
