// Startup wrapper for Hostinger VPS.
//
// PM2 calls `npm start` which runs this file. It boots Next.js in production
// mode. All uploads are stored in MySQL (no disk file serving needed).
//
//   PORT      → from PM2 env or .env (default 3000)
//   HOSTNAME  → 0.0.0.0 so reverse proxy can reach us

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createServer } = require("http");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const next = require("next");

const port = parseInt(process.env.PORT, 10) || 3000;
const hostname = process.env.HOSTNAME || "0.0.0.0";

const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => {
      // Rewrite /uploads/* to /api/files?u=/uploads/* so MySQL-backed serving works
      if (req.url && req.url.startsWith("/uploads/")) {
        const clean = req.url.split("?")[0];
        req.url = `/api/files?u=${encodeURIComponent(clean)}`;
      }
      handle(req, res);
    }).listen(port, hostname, () => {
      console.log(`Rono LR ready on http://${hostname}:${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start Next.js server:", err);
    process.exit(1);
  });
