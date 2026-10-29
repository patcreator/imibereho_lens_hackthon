# Deployment guide

This guide deploys the Next.js prototype to Vercel. It assumes Node.js 20+ and a Git repository containing this project.

## 1. Verify locally

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

The app builds without Neon or Groq  credentials. Local file import, built-in dashboards, browser-local saved analyses, and descriptive analysis are available without external services.

## 2. Create a Vercel project

1. Push the project to the Git provider connected to your Vercel account.
2. In Vercel, import the repository and select **Next.js**.
3. Keep the detected commands (`npm run build`, `npm run start` for self-hosted Node deployments) and the repository root directory.
4. Use Node.js 20 or newer. Do not add a Python build step.
5. Deploy once without optional service variables to verify the static/non-AI experience.

## 3. Optional Neon setup

Neon is used only when a user explicitly publishes a saved aggregate note as a public link. Imported data rows are never stored in Neon.

1. Create a Neon Postgres database.
2. Add `DATABASE_URL` to the Vercel **server-side** environment variables. A Neon pooled URL is suitable for the serverless runtime.
3. Before the deployment that first needs shares, apply the checked-in migration from a trusted local/CI environment:

   ```bash
   DATABASE_URL='postgresql://…' npm run db:migrate
   ```

   If your Neon provider gives separate pooled and direct connection strings, set `MIGRATION_DATABASE_URL` to the direct URL for migration commands; `DATABASE_URL` remains the runtime URL. `drizzle.config.ts` prefers `MIGRATION_DATABASE_URL` and falls back to `DATABASE_URL`.

4. The current migration creates `shared_analyses`. It stores a user-approved note, source/evidence/limitations strings, a SHA-256 hash of a random revoke token, and an expiry timestamp. It does not contain user accounts, source files, or respondent-level rows.
5. Redeploy. Test create, open, and revoke with a non-sensitive note. A share link is public to anyone who has it; it is not an authenticated private workspace. Notes expire after 90 days. The current prototype removes expired rows opportunistically on share creation and expired-link reads; add a scheduled cleanup job for a production service.

Do not use `drizzle-kit push` as a substitute for reviewed production migrations. Generate future migrations with `npm run db:generate`, inspect the SQL, commit it, then apply using `npm run db:migrate`.

## 4. Optional Groq  configuration

Add these variables in Vercel **server-side** settings:

- `Groq _API_KEY` — secret Groq  API credential.
- `Groq _MODEL` — a model identifier enabled for that credential/account.
- `Groq _BASE_URL` — optional; defaults to `https://integrate.api.Groq .com/v1`.

Never use `NEXT_PUBLIC_Groq _API_KEY`. The route sends only a bounded question and selected aggregate indicators. It has a small per-process rate limit; for public scale, use a shared rate limiter and monitor upstream usage. If the upstream is unavailable, the app's other pages and local evidence-note generator continue to work.

## 5. Upload/storage posture

- CSV, `.xlsx`, and `.dta` are parsed in the visitor's browser. Selected rows are stored in that browser's IndexedDB. This local storage is not encrypted and is not an authentication boundary.
- Cloudflare R2 is deliberately not connected. Without user authentication and tenant authorization, remote “private” file storage would be misleading. Do not add object-storage secrets or a raw-file upload route without first designing identity, authorization, retention, deletion, and consent.
- Keep secrets in server-side environment configuration. Do not commit `.env.local` or include secrets in browser code.

## 6. Pre-release checklist

- [ ] `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` pass.
- [ ] Compare displayed EICV7 and FinScope values, periods, definitions, CIs, and source-table references against the official source workbooks/reports.
- [ ] Confirm all 30 district names still join one-to-one to the ADM2 layer if either file changes.
- [ ] Verify the database migration against a non-production Neon database.
- [ ] Verify AI with a server-side key and an enabled model; ensure invalid or oversized requests are rejected and the key is absent from client bundles.
- [ ] Test file import with non-sensitive CSV, XLSX, and DTA samples; check browser storage and deletion behavior.
- [ ] Use a mobile-width browser and keyboard-only navigation; verify labels, focus, color contrast, and map alternatives.
- [ ] Confirm third-party licenses, NISR attribution, data-use terms, and the GPL-3.0 DTA parser obligations before redistribution.
- [ ] Do not publish a share note with confidential content. Anyone with a public share URL can view it until expiry or revocation.
