import type { NextConfig } from "next";

/**
 * Production-ready config for two deploy targets:
 *
 *  • Hostinger shared hosting (Node.js App)
 *  • Hostinger VPS / AWS EC2 / ECS Fargate
 *
 * Notes:
 *  - `images.unoptimized: true` keeps Next's built-in image optimizer (which
 *    also uses sharp internally) off the `/uploads/*` route — those images
 *    are already small and pre-validated, so the optimizer doesn't add
 *    value there. We still use `sharp` directly (server-side only, in
 *    `src/lib/storage/image-normalize.ts`) to normalize uploaded photos —
 *    it's guarded with a try/catch fallback so a missing/broken native
 *    binary on a constrained host degrades gracefully instead of failing
 *    uploads.
 *  - `output: "standalone"` produces `.next/standalone/server.js`, a
 *    self-contained server with the minimal `node_modules` it needs. Hostinger's
 *    Node.js App can target that file to keep memory/disk usage low.
 *  - `outputFileTracingIncludes` makes sure Prisma's query engine binary is
 *    copied into the standalone bundle (Next's tracer otherwise misses it).
 *  - `serverExternalPackages` keeps native modules (Prisma, bcryptjs, sharp)
 *    as runtime requires rather than bundled.
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

  serverExternalPackages: ["@prisma/client", "prisma", "bcryptjs", "sharp"],

  async redirects() {
    return [];
  },

  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: "/api/files?u=/uploads/:path*",
      },
    ];
  },

  staticPageGenerationTimeout: 1000,
};

export default nextConfig;
