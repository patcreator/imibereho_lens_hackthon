# Data dictionary and evidence notes

This document describes the bundled indicators and their boundaries. Exact source metadata and extraction checksums are maintained in `src/lib/data/eicv7-verified.json`, `src/lib/data/finscope-2024.ts`, and `src/lib/data/boundary-metadata.ts`.

## Official EICV7 aggregates

| Indicator | Period / denominator | Built-in coverage | Provenance and interpretation |
|---|---|---|---|
| Monetary poverty rate | EICV7 survey: October 2023–October 2024; population | National, residence, province, 30 districts | NISR EICV7 Main Indicators Report and official tables. National rate 27.362976%; 95% CI 26.3896–28.3363; SE 0.49625 percentage points. District Table A9.23 values include CI, SE, CV and design effect. |
| Extreme poverty rate | EICV7 survey: October 2023–October 2024; population | National and published area levels | NISR Main Indicators table 9.2. National rate 5.432908%; 95% CI 4.9118–5.9540. Distinct threshold/definition from the general monetary-poverty rate. |
| MPI incidence (H) | EICV7 survey: October 2023–October 2024; population | National, urban/rural, five provinces | NISR EICV7 Multidimensional Poverty report, Table B.5. National 30.5%; urban 14.8%; rural 36.7%. Incidence uses the report's k = 33.3% cutoff. Not interchangeable with monetary poverty. |
| MPI intensity (A) and M0 | Same as above | Published area aggregates | National intensity 44.6%; M0 0.136. These indices are shown with their own definitions; they are not percent monetary-poverty rates. No district MPI is inferred. |
| Modelled 2017 comparison | EICV7 revised method | Areas in NISR comparison table | This is a modelled comparator under the EICV7 methodology, not a directly observed EICV7 2017 estimate. It is not represented as a directly observed trend in the UI. |

### District examples

- Highest point estimate: Nyamagabe, 51.3941% (95% CI 45.0900–57.6982).
- Lowest point estimate: Nyarugenge, 6.7999% (95% CI 4.4409–9.1589).

These are survey estimates. Overlapping confidence intervals and design-based uncertainty mean small rank differences should not be overstated.

### District boundary join

The local `rwanda-adm2-geoboundaries.geojson` layer has 30 ADM2 features. Every `shapeName` exactly matches an EICV7 district label in the bundled data. Metadata identifies the geometry as geoBoundaries/Open Data Rwanda, CC BY 4.0, 2012 vintage. It is for visualization and lookup only; it does not change the statistical estimates or align the boundary year to the survey year.

## FinScope Rwanda 2024 published summaries

Source metadata: Access to Finance Rwanda (AFR) report page and NISR Microdata Catalog record `RWA-NISR-FINSCOPE-2024-v01`. Survey universe: eligible adults aged 16+ living in private households. The app reproduces aggregate summary values and does not compute them from respondent records. District-level FinScope estimates are not shown.

| Published measure | Value | Denominator / caution |
|---|---:|---|
| Financially included (broad report-defined access) | 96% | Adults 16+; includes the report's direct/indirect access definition. Not account ownership. |
| Registered mobile wallet in own name | 77% | Adults 16+; distinct from ever/current use. |
| Own or used mobile money | 86% | Adults 16+; distinct from registered wallet ownership. |
| Bank account uptake | 22% | Adults 16+; not equivalent to broad financial inclusion. |
| Formal savings product | 59% | Adults 16+. |
| Formal credit | 24% | Adults 16+. |
| Personal insurance product | 27% | Adults 16+. |
| Transactional-account uptake by sex | Women 73%, men 82% | Published summary breakdown; no district disaggregation or uncertainty estimate is calculated here. |
| Financial-health categories | Healthy 10%, coping 57%, vulnerable 31%, extremely vulnerable 3% | Rounded published categories sum to 101%; the UI retains that rounding rather than normalizing. |

FinScope's adult universe is not the same as EICV7's total-population denominator. Do not directly subtract, combine, or rank unlike denominators. Consult the full source report for exact wording and context before external reuse. The raw FinScope `.dta` is not included in `public/data/` or committed to this repository.

## User-imported data

- Formats: `.csv`, `.xlsx` (first worksheet), `.dta`. Legacy `.xls` is unsupported.
- Limits: 60 MB input; 100,000 rows; 24 selected analysis columns.
- The first CSV/XLSX row is treated as a header. DTA variable names, labels, and value labels are retained where possible.
- Only selected columns are persisted in IndexedDB in the local browser. They are not transmitted to the app backend or Neon.
- Validation reports missing values, duplicate rows, suspect weight/value fields, and possible proportion/percentage ambiguity. It does not repair values, infer official sources, or remove duplicates.
- Numeric means are descriptive. Variables with Stata value labels are treated as categorical to avoid averaging category codes. Complex-survey uncertainty is not calculated.

## Evidence labels used in the UI

- **Published / official-source value:** copied from a cited source table, with source period and definition.
- **App calculation:** a deterministic descriptive result computed from the current data selection. It is not an official estimate.
- **AI interpretation:** optional text generated from selected source-labeled aggregates; not a statistic, citation, policy instruction, or causal finding.
- **Synthetic data:** none is included in the current bundled snapshot. If added for a demonstration, it must be labeled and kept separate from published data.
