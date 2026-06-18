# Rono LR — Deployment Guide

This Next.js + Prisma app is deliberately portable: a single `DATABASE_URL`
swaps the database, a single `npm run build` produces the artifact, and the
same codebase runs on **Hostinger** (shared hosting Node.js App or VPS) and
**AWS** (EC2 + RDS, or ECS Fargate + RDS).

The mobile app (`1/lr-mobile`) does **not** talk to MySQL directly. It calls
the same REST APIs this server exposes — set its `EXPO_PUBLIC_API_URL` to the
deployed URL of this app.

---

## Quickstart — recommended paths

| You want…                                              | Use section                                            |
|--------------------------------------------------------|--------------------------------------------------------|
| Free, fastest path. Hosts on Vercel, MySQL on Hostinger | **§2 Vercel + Hostinger MySQL**                       |
| Stay on Hostinger end-to-end                            | **§3 Hostinger Premium / Business (Node.js App)**      |
| Full control, single $5–10/mo box                       | **§4 Hostinger VPS**                                   |
| AWS production setup                                    | **§5 AWS RDS + EC2 / ECS Fargate**                     |
| Mobile app config                                       | **§6 Mobile app**                                      |
| Final pre-launch sanity                                 | **§7 Production checklist**                            |

---

## 0. Required information

Before you deploy, gather these values. The first three are already provisioned
on this account:

| What                  | Where to get it                                                                                  | This account's value                                  |
|-----------------------|--------------------------------------------------------------------------------------------------|-------------------------------------------------------|
| MySQL DB name         | hPanel → Databases → MySQL Databases                                                             | `u767592127_LRLoad`                                   |
| MySQL user            | same                                                                                             | `u767592127_rayudugroup`                              |
| MySQL password        | hPanel → Databases → click the **eye icon** next to the user                                     | _(reveal in hPanel — never paste in chat)_            |
| App public URL        | hPanel → Websites → temporary domain (or a real domain you point later)                          | `https://lightblue-partridge-337209.hostingersite.com` |
| `AUTH_SECRET`         | Run locally: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`    | _(generate once and keep it)_                          |
| Hostinger plan tier   | Premium / Business / Cloud (must include **Node.js Apps**). Single Web Hosting **does not** support Node. | _(check hPanel → Hosting → Manage)_                |

If your plan does **not** include Node.js Apps, you have to upgrade to a plan
that does, or move to the **VPS** option in §3.

---

## 1. Local development

```bash
cd 1/lr-load
cp .env.example .env
npm install --legacy-peer-deps
npm run db:up           # MySQL 8 in Docker on :3306
npm run db:migrate -- --name init   # first time only
npm run db:seed         # demo companies, users, LRs
npm run dev             # http://localhost:3000
```

Helper scripts:

| Command                | What it does                                                            |
|------------------------|-------------------------------------------------------------------------|
| `npm run db:up`        | Starts the MySQL container defined in `docker-compose.yml`.             |
| `npm run db:down`      | Stops and removes the container.                                        |
| `npm run db:migrate`   | Creates a SQL migration from schema changes (Prisma Migrate).           |
| `npm run db:deploy`    | Applies pending migrations on a server (use this in CI / on prod).      |
| `npm run db:seed`      | Resets and seeds demo data.                                             |
| `npm run db:reset`     | Drops everything, re-runs migrations, re-seeds.                         |
| `npm run db:studio`    | Opens Prisma Studio — visual DB browser at :5555.                       |
| `npm run build`        | Production build (`.next/` + standalone bundle in `.next/standalone/`). |
| `npm run build:standalone` | Build + assemble a self-contained `dist/` folder for upload.        |
| `npm run start`        | Run the built app locally on `:3000`.                                   |
| `npm run start:standalone` | Run the standalone bundle locally to verify before upload.          |

A built-in health check lives at `GET /api/health` and reports DB latency +
company count. Always hit it after a deploy.

---

## 2. Vercel + Hostinger MySQL (recommended free path)

**TL;DR**: deploy the Next.js app to Vercel (free), keep your existing
Hostinger MySQL (`u767592127_LRLoad`), and use Vercel Blob for file uploads.
Total cost: ₹0/month for the app, only the Hostinger MySQL plan you already
have.

### 2A. Open Hostinger MySQL to remote connections

Vercel's serverless functions run from rotating IPs in our chosen region
(`bom1` / Mumbai by default). They cannot reach `localhost` on Hostinger.

1. hPanel → **Databases** → **Remote MySQL** → **+ Create**.
2. Database: `u767592127_LRLoad`.
3. Connection from: `%` (any host). This is the only practical setting unless
   you upgrade to a Vercel Pro static-egress add-on. The MySQL user already
   needs a strong password (it does — it's the Hostinger-generated one), so
   exposing port 3306 with username/password auth is acceptable for a pilot.
4. After saving, hPanel reveals the **remote MySQL hostname** (looks like
   `srvNNN.hstgr.io`). Note it down — you'll need it in §2C.

### 2B. Load the schema (same as before)

Open <https://auth-db1387.hstgr.io/index.php?db=u767592127_LRLoad>, click the
**SQL** tab, paste the entire contents of
[`prisma/sql/01-schema.sql`](./prisma/sql/01-schema.sql), click **Go**.
Optional: also paste `02-seed.sql` if you want demo data.

### 2C. Push the repo to GitHub

Vercel deploys from a Git provider (GitHub / GitLab / Bitbucket).

```bash
cd /path/to/syntarica         # repo root
git add 1/lr-load
git commit -m "feat: deploy lr-load to Vercel"
git push origin <branch>
```

If this isn't on GitHub yet, create a private repo named `syntarica` (or
similar), add it as origin, and push.

### 2D. Create the Vercel project

1. Go to <https://vercel.com/new>, sign in with GitHub.
2. Click **Import Project** → pick the repo containing `1/lr-load`.
3. **Root Directory**: set this to `1/lr-load` (very important — the
   monorepo holds the mobile app at the same level).
4. Framework preset: **Next.js** (auto-detected).
5. Build / install commands: leave defaults — `vercel.json` already pins
   them to `prisma generate && next build` and `npm install --legacy-peer-deps`.
6. Don't deploy yet — click **Environment Variables** and add the four below
   first (otherwise the first build will fail because Prisma needs a
   `DATABASE_URL`).

**Environment variables** (add to all environments — Production, Preview, Development):

```
DATABASE_URL          mysql://u767592127_rayudugroup:<DB_PASSWORD>@<REMOTE_HOST_FROM_2A>:3306/u767592127_LRLoad?connection_limit=5
NEXT_PUBLIC_APP_URL   https://<your-vercel-project>.vercel.app
AUTH_SECRET           <run: node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))">
```

> ⚠ **Do not** set `NODE_ENV=production` on Vercel. Vercel sets it
> automatically at runtime; setting it manually as a build-time env makes
> `npm install` skip `devDependencies` (Tailwind, PostCSS, TypeScript types,
> ESLint), which then makes the Next.js build fail with cryptic
> "Module not found" errors. This is a documented Vercel foot-gun.
>
> The `?connection_limit=5` query is important. Each cold-started serverless
> function opens its own pool; without a low cap they'll exhaust Hostinger's
> shared MySQL connection limit (typically 25). 5 × `bom1` instances ≈ safe.

You can fill `NEXT_PUBLIC_APP_URL` with a placeholder for the first deploy and
update it once Vercel assigns a real URL — it's only used for QR landing
deep-links and PDF footers.

### 2E. Enable Vercel Blob (for file uploads)

Without this step, every `/api/upload/*` call will fail with `BLOB_READ_WRITE_TOKEN
is required` because Vercel's filesystem is read-only and our storage
adapter falls back to disk only when no Blob token is present.

1. Project page → **Storage** tab → **Create database** → **Blob**.
2. Pick a name (e.g. `lr-uploads`) → **Create**.
3. Click **Connect to Project** → confirm. Vercel injects
   `BLOB_READ_WRITE_TOKEN` into all environments automatically.

### 2F. Deploy

Click **Deploy** on the project page (or push another commit — Vercel
auto-deploys). The first build runs ~3 minutes. When it finishes:

```
https://<your-project>.vercel.app/api/health     ← should return ok:true with db.latency_ms
https://<your-project>.vercel.app/super-admin/login
https://<your-project>.vercel.app/company/login
```

### 2G. Post-deploy

- Update `NEXT_PUBLIC_APP_URL` to the actual Vercel URL → **Redeploy** (Project
  → Deployments → ⋯ → Redeploy without cache).
- Custom domain: Project → **Settings → Domains** → add the domain you own
  (Vercel walks you through the DNS records). Update
  `NEXT_PUBLIC_APP_URL` again.
- Mobile app: set `EXPO_PUBLIC_API_URL` in `1/lr-mobile/.env` to the Vercel
  URL, then rebuild the APK with `eas build`.

### 2H. Rebuild flow

Every push to your default branch triggers an auto-deploy. Schema changes
still require a one-time SQL paste in phpMyAdmin (Vercel doesn't run
migrations against Hostinger automatically). Generate the diff locally:

```bash
node node_modules/prisma/build/index.js migrate diff \
  --from-url "$DATABASE_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/sql/03-change.sql
```

Paste `03-change.sql` into phpMyAdmin → push your code change → Vercel builds.

### 2I. Limits to know about

| Limit                     | Hobby / free                       | Workaround                                                          |
|---------------------------|------------------------------------|---------------------------------------------------------------------|
| Function request body     | 4.5 MB                             | We cap photos at 4 MB; signatures/logos/stamps are well below.      |
| Function duration         | 10s default, 30s in `vercel.json`  | PDF + reports already pinned to 30s in `vercel.json`.               |
| Blob storage              | 1 GB total, 1 M reads, 100k writes | Plenty for hundreds of LRs. Move to S3 later if you outgrow it.     |
| Concurrent DB connections | Shared MySQL caps at ~25           | `connection_limit=5` in URL keeps headroom.                         |

---

## 3. Hostinger — shared hosting (Premium / Business / Cloud)

You will:

1. Load the schema into the existing MySQL database via phpMyAdmin.
2. Build the app **on your laptop** (Hostinger shared can't reliably run
   `next build`'s memory peak).
3. Upload the resulting `dist/` folder.
4. Wire it up via the **Setup Node.js App** wizard in hPanel.

### 2A. Create the schema in phpMyAdmin (one-time)

1. Open <https://auth-db1387.hstgr.io/index.php?db=u767592127_LRLoad> →
   select `u767592127_LRLoad` on the left.
2. Click the **SQL** tab.
3. Open `prisma/sql/01-schema.sql` from this repo, copy all of it, paste into
   the SQL tab, click **Go**. Six tables get created (`Company`, `Branch`,
   `User`, `LRRequest`, `LRSerial`, `Otp`, `Notification`).
4. *(Optional)* Repeat with `prisma/sql/02-seed.sql` if you want the demo
   companies, branches, users, and LRs to play with. **Skip in production.**

### 2B. Build the deploy bundle locally

```bash
cd 1/lr-load
cp .env.production.example .env.production
# edit .env.production: paste the real DATABASE_URL password and AUTH_SECRET
npm install --legacy-peer-deps
npm run build:standalone
```

After this you have a `dist/` folder with everything Hostinger needs:

```
dist/
├── server.js               ← Hostinger startup file
├── package.json            ← minimal manifest with `npm start`
├── .next/                  ← compiled app + static assets
├── public/                 ← static assets + uploads/
├── prisma/                 ← schema + raw SQL for phpMyAdmin
├── node_modules/           ← only what Next traced as needed (~50 MB)
└── .env.example
```

Smoke-test it before uploading:

```bash
DATABASE_URL="mysql://u767592127_rayudugroup:PASS@HOST:3306/u767592127_LRLoad" \
NEXT_PUBLIC_APP_URL="http://localhost:3000" \
AUTH_SECRET="..." \
node dist/server.js
# in another shell:  curl http://localhost:3000/api/health
```

### 2C. Upload to Hostinger

You can use either the **File Manager** (browser) or **SFTP** (faster).

1. hPanel → **File Manager** → `domains/lightblue-partridge-337209.hostingersite.com/`.
2. Create a new folder `lr-app` (sibling of `public_html`). This keeps the app
   files separate from the public web root.
3. Zip your local `dist/` folder, upload `dist.zip` into `~/domains/.../lr-app/`,
   and use **Extract** → contents go directly into `lr-app/`.
4. Verify the structure on the server matches the layout above (i.e. `lr-app/server.js`
   and `lr-app/.next/` exist).

### 2D. Set up the Node.js App in hPanel

hPanel → **Websites** → choose the temporary domain → **Advanced** →
**Setup Node.js App** → **Create application**.

| Field                           | Value                                                                |
|---------------------------------|----------------------------------------------------------------------|
| Node.js version                 | **20.x** (LTS — required by `package.json` engines field)            |
| Application root                | `domains/lightblue-partridge-337209.hostingersite.com/lr-app`        |
| Application URL                 | the temporary domain (root path)                                     |
| Application startup file        | `server.js`                                                          |
| Run NPM Install (button)        | **Yes** — let it install once                                        |
| Environment variables           | (add the four below)                                                 |

Click **+ Add Variable** four times:

```
DATABASE_URL=mysql://u767592127_rayudugroup:YOUR_DB_PASSWORD@localhost:3306/u767592127_LRLoad
NEXT_PUBLIC_APP_URL=https://lightblue-partridge-337209.hostingersite.com
AUTH_SECRET=YOUR_GENERATED_SECRET
NODE_ENV=production
```

> If `localhost` doesn't connect (hPanel will tell you on startup), open
> hPanel → Databases → **Remote MySQL** → add the access host shown there
> (looks like `srvNNN.hstgr.io`) and use that hostname in `DATABASE_URL`
> instead. Do **not** use `auth-db1387.hstgr.io` — that's only for
> phpMyAdmin's web UI.

Click **Start application**. Watch the log panel — within ~10 seconds you
should see `▲ Next.js 15.x ready - Local: http://localhost:<PORT>`.

### 2E. Verify

Open these URLs in a browser:

```
https://lightblue-partridge-337209.hostingersite.com/api/health
https://lightblue-partridge-337209.hostingersite.com/super-admin/login
https://lightblue-partridge-337209.hostingersite.com/company/login
```

`/api/health` should return JSON with `"ok": true` and a sub-100ms DB latency.

> Demo super-admin (only present if you ran `02-seed.sql`):
> email `super@rono.app`, password `super123`. The login route auto-rehashes
> the password to bcrypt on first successful login.

### 2F. Persisting uploads across redeploys (recommended)

By default, uploads are written to `lr-app/public/uploads/`. If you re-extract
a fresh `dist.zip` over the top, those files survive — but only if you don't
delete `public/uploads/` first.

To make this bullet-proof, move uploads outside the bundle:

1. In File Manager, create `~/persistent/uploads/`.
2. Add `UPLOAD_DIR=/home/u767592127/persistent/uploads` to your Node.js App
   environment variables, then **Restart application**.
3. Hostinger doesn't allow shell symlinks from the panel — the easiest way to
   serve them at `/uploads/*` is to use the panel's **File Manager → Right
   click → Symlink** option, or open SSH (Premium and above) and run:
   ```
   ln -sfn /home/u767592127/persistent/uploads \
           /home/u767592127/domains/lightblue-partridge-337209.hostingersite.com/lr-app/public/uploads
   ```
4. Verify by uploading a logo from `/company/profile`. The file should land in
   `~/persistent/uploads/logos/...` and the URL `/uploads/logos/<file>` should
   open it.

### 2G. Re-deploys

Every code change repeats §2B–§2D quickly:

```bash
cd 1/lr-load
npm run build:standalone
zip -r dist.zip dist
# upload dist.zip to lr-app/, Extract → overwrite, then in hPanel:
# Setup Node.js App → Restart application
```

If you changed `prisma/schema.prisma`, generate the diff SQL locally and
paste it into phpMyAdmin:

```bash
node node_modules/prisma/build/index.js migrate diff \
  --from-url "mysql://USER:PASS@HOST:3306/u767592127_LRLoad" \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/sql/03-change.sql
```

---

## 4. Hostinger — VPS (recommended for production)

Buy any KVM VPS (≥1 vCPU, ≥2 GB RAM). Ubuntu 22.04 image.

```bash
# 1. SSH in
ssh root@<vps-ip>

# 2. Install runtime
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
apt update && apt install -y nodejs git nginx mysql-server
npm i -g pm2

# 3. Configure MySQL
mysql_secure_installation
mysql -uroot -p <<'SQL'
CREATE DATABASE rono_lr CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'rono'@'localhost' IDENTIFIED BY 'CHANGE_ME';
GRANT ALL ON rono_lr.* TO 'rono'@'localhost';
FLUSH PRIVILEGES;
SQL

# 4. Clone + install
git clone <repo> /opt/rono && cd /opt/rono/1/lr-load
cat > .env <<'EOF'
DATABASE_URL=mysql://rono:CHANGE_ME@127.0.0.1:3306/rono_lr
NEXT_PUBLIC_APP_URL=https://lr.example.com
AUTH_SECRET=GENERATE_A_REAL_ONE
UPLOAD_DIR=/var/lib/rono/uploads
NODE_ENV=production
EOF
mkdir -p /var/lib/rono/uploads
ln -sfn /var/lib/rono/uploads public/uploads
npm install --legacy-peer-deps
npx prisma migrate deploy
npm run db:seed   # only on first deploy
npm run build

# 5. Run with PM2
pm2 start "npm run start" --name rono-lr
pm2 save && pm2 startup systemd

# 6. Reverse-proxy via Nginx + free TLS
cat >/etc/nginx/sites-available/rono <<'NGINX'
server {
  server_name lr.example.com;
  client_max_body_size 20m;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
  }
}
NGINX
ln -s /etc/nginx/sites-available/rono /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
apt install -y certbot python3-certbot-nginx
certbot --nginx -d lr.example.com
```

To deploy a new version:
`git pull && npm install --legacy-peer-deps && npx prisma migrate deploy && npm run build && pm2 restart rono-lr`.

---

## 5. AWS — RDS MySQL + EC2 (or ECS Fargate)

Same `DATABASE_URL` env var works against AWS RDS.

1. **RDS**: create MySQL 8. Allow inbound from the app's security group only.
2. **App host**:
   - **EC2**: same steps as the VPS section, just use the RDS endpoint in
     `DATABASE_URL`. Use an Elastic IP / ALB for stable DNS.
   - **ECS Fargate**: build a container with `npm run build` baked in, set
     env vars as task env. Health check on `/api/health` (returns 200 with DB
     latency).
3. **Migrations**: run `npx prisma migrate deploy` as a one-shot job each
   release (an ECS run-task or a CodeBuild step).
4. **Uploads**: swap `src/lib/storage/local-storage.ts` for an S3 client and
   keep public URLs in `LRRequest.photos` / `signatureUrl` / company `logoUrl`
   / `stampUrl` columns. Everything else continues working untouched.
5. **TLS / DNS**: Route 53 → ACM cert → ALB or CloudFront in front of the app.

`DATABASE_URL` for RDS:

```
mysql://USER:PASS@<rds-endpoint>:3306/rono_lr?sslaccept=strict
```

---

## 6. Mobile app (`1/lr-mobile`)

The Expo project consumes the deployed website's REST API. Set:

```
EXPO_PUBLIC_API_URL=https://lightblue-partridge-337209.hostingersite.com
```

in `1/lr-mobile/.env` and rebuild the APK / TestFlight build with EAS:

```bash
cd 1/lr-mobile
eas build --platform android   # APK
eas build --platform ios       # TestFlight / App Store
```

There is **no** mobile-specific database. Native clients hit the same Prisma
backend as the website, so authentication, business rules, and data are
single-source-of-truth.

---

## 7. Production checklist

- [ ] `DATABASE_URL` points to a real DB (not local Docker).
- [ ] `NEXT_PUBLIC_APP_URL` set to the public HTTPS domain.
- [ ] `AUTH_SECRET` generated with `crypto.randomBytes(48)` and never reused.
- [ ] Hashed super-admin password (already enforced — `bcryptjs`).
- [ ] Replace the demo `123456` OTP backdoor in `verify-otp/route.ts` with an
      SMS provider (MSG91 / Twilio / AWS SNS) before public launch.
- [ ] `UPLOAD_DIR` outside the deploy artifact, or an external bucket (S3).
- [ ] `npm run build` succeeds in CI; reject otherwise.
- [ ] `prisma migrate deploy` (or paste the diff SQL) is part of every release.
- [ ] `/api/health` returns 200 from outside the network.
