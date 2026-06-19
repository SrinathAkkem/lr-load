// Startup wrapper for Hostinger Node.js applications.
//
// Hostinger's hPanel "Node.js Application" panel requires a JS file as its
// "Application startup file". This file boots Next.js' built-in server in
// production mode using the env vars exposed by Hostinger:
//
//   PORT      → assigned by Hostinger (Passenger). Falls back to 3000 locally.
//   HOSTNAME  → 0.0.0.0 so Passenger can reach us inside the container.
//
// Build artefacts must already exist (run `npm run build` either via the
// hPanel "Build" tab or locally before uploading).

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createServer } = require("http");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const next = require("next");

const port = parseInt(process.env.PORT, 10) || 3000;
const hostname = process.env.HOSTNAME || "0.0.0.0";

const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

// Determine the public directory based on whether we're in standalone or dev mode
const publicDir = path.join(__dirname, "public");
const hasPublicDir = fs.existsSync(publicDir);

app
  .prepare()
  .then(() => {
    createServer((req, res) => {
      // Serve public folder files for static assets
      if (hasPublicDir && req.url.startsWith("/uploads/")) {
        const filePath = path.join(publicDir, req.url);

        // Security: prevent directory traversal attacks
        const realPath = path.resolve(filePath);
        if (!realPath.startsWith(path.resolve(publicDir))) {
          res.statusCode = 403;
          res.end("Forbidden");
          return;
        }

        // Check if file exists
        if (fs.existsSync(realPath) && fs.statSync(realPath).isFile()) {
          // Set proper cache headers for static assets
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

          // Set content type based on file extension
          const ext = path.extname(realPath).toLowerCase();
          const contentTypes = {
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".gif": "image/gif",
            ".svg": "image/svg+xml",
            ".webp": "image/webp",
            ".pdf": "application/pdf",
          };

          if (contentTypes[ext]) {
            res.setHeader("Content-Type", contentTypes[ext]);
          }

          const stream = fs.createReadStream(realPath);
          stream.pipe(res);
          stream.on("error", () => {
            res.statusCode = 500;
            res.end("Internal Server Error");
          });
          return;
        }
      }

      // Handle all other requests through Next.js
      handle(req, res);
    }).listen(port, hostname, () => {
      console.log(`Rono LR ready on http://${hostname}:${port}`);
      if (hasPublicDir) {
        console.log(`Serving static files from ${publicDir}`);
      }
    });
  })
  .catch((err) => {
    console.error("Failed to start Next.js server:", err);
    process.exit(1);
  });
