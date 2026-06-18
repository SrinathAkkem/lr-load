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

const { createServer } = require("http");
const next = require("next");

const port = parseInt(process.env.PORT, 10) || 3000;
const hostname = process.env.HOSTNAME || "0.0.0.0";

const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => handle(req, res)).listen(port, hostname, () => {
      // eslint-disable-next-line no-console
      console.log(`Rono LR ready on http://${hostname}:${port}`);
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Failed to start Next.js server:", err);
    process.exit(1);
  });
