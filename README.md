

# Imibereho Lens

## LINKS
 - [live hot link](https://imibereholenshackthon.vercel.app)
 - [GitHub link](https://github.com/patcreator/imibereho_lens_hackthon)
 - demo video => [https://youtu.be/fYH7GVtly3M](https://youtu.be/fYH7GVtly3M)
 

A source-led Rwanda poverty and development intelligence prototype for the NISR 2026 Big Data Hackathon, Track 2. It brings together published EICV7 poverty and MPI aggregates, a small set of FinScope 2024 financial-inclusion summaries, district boundaries for visualization, and browser-local descriptive analysis of user-provided files.

> **Prototype status:** This is an independent hackathon prototype, not an official NISR product or policy assessment. It presents descriptive evidence; it does not establish causation, estimate programme impact, or turn survey weights into design-based uncertainty estimates.

## What works

- Responsive Next.js App Router / React / strict TypeScript / Tailwind application with light/dark themes.
- Overview dashboard, poverty explorer with district map and uncertainty table, financial-inclusion explorer, poverty/MPI comparison, methodology, policy-context/about, optional AI page, dataset import and local analysis, saved notes, and public share-note pages.
- Built-in EICV7 data extracted from the official NISR workbooks into `src/lib/data/eicv7-verified.json`. Source tables, source URLs, survey/reporting periods, definitions, confidence intervals, standard errors, coefficients of variation, design effects, workbook SHA-256 hashes, and limitations are recorded.
- FinScope 2024 is represented only by published summary indicators in `src/lib/data/finscope-2024.ts`. **The raw FinScope microdata is not included or hosted.**
- CSV, `.xlsx` and Stata `.dta` import. `.xls` is unsupported; Excel import reads the first worksheet. The importer runs in the browser, validates selected columns, retains Stata labels, and stores selected rows in IndexedDB on that device.
- Descriptive summaries, category shares, local CSV export, saved analyses, and data provenance. A supplied weight can be used for descriptive weighted means/shares, but the app does not estimate complex-survey standard errors or confidence intervals.
- Optional Groq -compatible chat-completions route. Only a question and selected source-labeled aggregates are sent; uploaded row-level data is not accepted by this endpoint. The rest of the application works without AI credentials.
- Optional Neon + Drizzle persistence for **explicitly published, public, aggregate-only share notes**. Local saves work without Neon. Public notes expire after 90 days and can be revoked with a token stored in the creator's browser.
- Vitest unit and parser tests, a Drizzle schema/migration, and deployment guidance below.

## Quick start

Requirements: Node.js 20 or later and npm. No Python runtime or Python deployment dependency is used.

```bash
npm ci
cp .env.example .env.local   # optional; the app works without secrets
npm run dev
```

Open `http://localhost:3000`.

Useful commands:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run start
npm run extract:eicv7       # re-extract the checked-in aggregate snapshot from the source workbooks
npm run db:generate         # generate Drizzle SQL after a schema change
npm run db:migrate          # apply migrations; requires DATABASE_URL
```

`npm ci` installs exactly the lockfile. The bundled static pages work without a database, Groq  key, or object-storage credentials.

## Evidence and data policy

### Built-in sources

- **Monetary and extreme poverty:** NISR EICV7 Main Indicators Report 2023/24 and its official table workbook. National monetary poverty is 27.362976% (95% CI 26.3896–28.3363); extreme poverty is 5.432908%. District monetary-poverty estimates come from Table A9.23 and retain the published 95% confidence intervals and other reported precision fields.
- **Multidimensional poverty:** NISR EICV7 Multidimensional Poverty report, Table B.5. National MPI incidence (H) is 30.5%, intensity (A) is 44.6%, and M0 is 0.136. MPI and monetary poverty are different constructs and are never combined into one score. District MPI estimates are not inferred.
- **Financial inclusion:** FinScope Rwanda 2024 published national summaries. Their denominator is eligible adults aged 16+; they are not directly comparable to EICV7 total-population poverty rates. District-level FinScope rates are not shown.
- **Map geometry:** geoBoundaries / Open Data Rwanda ADM2 layer, 30 districts, boundary vintage 2012. All 30 `shapeName` values match the bundled EICV7 district labels. The geometry is a display/join layer only; it does not alter the estimates.

Official values are reproduced from cited aggregate sources; the app does not recreate NISR's complex survey estimators from microdata. The 2017 comparator under EICV7's updated method is modelled, not a directly observed EICV7 estimate. Survey methodology and boundary changes matter for comparisons across rounds.

### User uploads

- Files are inspected and parsed in the browser. Selected columns and rows are saved to that browser's IndexedDB; the app does not upload the original file or row-level data to its server.
- Browser storage is not encrypted or an access-control boundary. Use only data you are permitted to use; avoid identifiable, sensitive, or restricted records. Delete local datasets when no longer needed.
- User-supplied data is not treated as official. The user must enter source, reporting period, and definitions. No missing values are imputed; duplicate rows are flagged, not removed.
- A weight column by itself is not enough to reproduce complex survey estimates or design-based uncertainty. Review the source's strata, clusters, and estimator documentation.

### Interpretation and AI

Published observations, app calculations, AI text, and any future synthetic examples must remain clearly distinguished. Descriptive differences or correlations do not demonstrate cause and effect. AI text is an interpretation, not evidence, a citation, or an official recommendation. The Groq  route accepts only a bounded aggregate schema and is disabled unless configured on the server.

For exact definitions, workbook checksums, source citations, uncertainty notes, and license details, see [Methodology](src/app/%28platform%29/methodology/page.tsx) in the app.

## Optional services

### Neon + Drizzle public share notes

Set `DATABASE_URL` to a Neon Postgres connection string in `.env.local` or the deployment environment, then run:

```bash
npm run db:migrate
```

The share button appears for a locally saved note. It asks for confirmation before publishing. The table contains only the note, source metadata, evidence strings, limitations, token hash, and expiry—not uploaded files or row-level records. **Anyone with the resulting link can view it**; links are not account-private. They expire after 90 days. The revoke token is stored only in the creator's browser; if that browser storage is cleared, the link will still expire, but the owner may lose the ability to revoke it early. Expired rows are opportunistically cleaned on new share creation; production deployments should also schedule database cleanup.

The prototype has no user accounts or authentication. Do not use public share links for confidential content. Local saved notes remain available if Neon is not configured.

### Groq  (optional)

Set the following **server-only** variables to enable the AI button:

```dotenv
GROQ_API_KEY=your_server_side_key
GROQ_MODEL=your-enabled-model-id
```

The model is explicit rather than hard-coded so the deployment owner can choose a currently enabled Groq  model. Never prefix the key with `NEXT_PUBLIC_`. Requests are validated and rate-limited per server process; for a high-traffic public deployment, replace the in-memory limit with a shared rate limiter. If the service is unavailable or unconfigured, the local deterministic evidence note and all non-AI features continue to work.

### Cloudflare R2

R2 is intentionally **not wired into this prototype**. Uploads remain browser-local because there is no authentication/tenant boundary in this hackathon build. Adding private object storage without identity and authorization would create an unsafe expectation of privacy. If a future version adds authenticated private file storage, implement private buckets, short-lived signed requests, access control, retention/deletion rules, malware/format checks, and documented consent before enabling any R2 credentials.

## Licensing and attribution

- NISR statistics and analysis are available under CC BY 4.0 unless a third-party term supersedes them. Attribute NISR and cite the report/table when reusing figures. See [NISR Terms of Use](https://statistics.gov.rw/terms-use).
- The bundled district boundary layer is identified as CC BY 4.0 in its geoBoundaries metadata; retain source attribution.
- FinScope report and microdata access terms are governed by AFR/NISR source materials; this app does not distribute the raw respondent file.
- The `.dta` parser dependency `@jbearak/dta-parser` is GPL-3.0. To retain DTA import, this project is licensed GPL-3.0-only; see `LICENSE`. If a permissive downstream license is required, remove DTA support or replace that parser with a suitably licensed implementation before redistribution.
- Third-party packages keep their own licenses. Review them before redistribution.

## Project map

```text
src/app/                 App Router pages and API routes
src/components/          Responsive shell, maps, charts, import and analysis UI
src/lib/analytics/       Descriptive statistics, file and dataset validation
src/lib/data/            Official EICV7 snapshot, FinScope indicators, provenance
src/lib/data-import/     CSV/XLSX/DTA parsing and browser-local IndexedDB storage
src/lib/db/              Drizzle schema and Neon server-side connection helper
drizzle/                 Generated SQL migrations and Drizzle metadata
scripts/                 TypeScript/Node EICV7 extraction script
public/data/             NISR aggregate workbooks and district GeoJSON
```

## Deployment

See [Deployment guide](docs/deployment.md) for Vercel setup, environment variables, Neon migrations, Groq  configuration, and a pre-release checklist.

## LINKS
 - [live hot link](https://imibereholenshackthon.vercel.app)
 - [GitHub link](https://github.com/patcreator/imibereho_lens_hackthon)
 - demo video => [https://youtu.be/fYH7GVtly3M](https://youtu.be/fYH7GVtly3M)
