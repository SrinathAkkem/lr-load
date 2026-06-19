import type { NextConfig } from "next";

/**
 * Production-ready config for two deploy targets:
 *
 *  • Hostinger shared hosting (Node.js App)
 *  • Hostinger VPS / AWS EC2 / ECS Fargate
 *
 * Notes:
 *  - `images.unoptimized: true` keeps us off `sharp`, which is finicky on
 *    Hostinger shared hosting. The `/uploads/*` images we serve (logo, stamp,
 *    signatures, goods photos) are already small and pre-validated, so the
 *    optimizer doesn't add value here.
 *  - `output: "standalone"` produces `.next/standalone/server.js`, a
 *    self-contained server with the minimal `node_modules` it needs. Hostinger's
 *    Node.js App can target that file to keep memory/disk usage low.
 *  - `outputFileTracingIncludes` makes sure Prisma's query engine binary is
 *    copied into the standalone bundle (Next's tracer otherwise misses it).
 *  - `serverExternalPackages` keeps native modules (Prisma, bcryptjs) as
 *    runtime requires rather than bundled.
 */
const nextConfig: NextConfig = {
  output: "standalone",

  images: {
    unoptimized: true,
  },

  outputFileTracingIncludes: {
    "/api/**/*": [
      "./node_modules/.prisma/client/**/*",
      "./node_modules/@prisma/client/**/*",
      "./prisma/**/*",
    ],
    "/qr/**/*": [
      "./node_modules/.prisma/client/**/*",
      "./node_modules/@prisma/client/**/*",
    ],
  },

  outputFileTracingExcludes: {
    "/**/*": [
      "node_modules/@swc/core-*",
      "node_modules/esbuild",
    ],
  },

  serverExternalPackages: ["@prisma/client", "prisma", "bcryptjs"],

  // Ensure public folder assets are properly served
  staticPageGenerationTimeout: 1000,
};

export default nextConfig;
