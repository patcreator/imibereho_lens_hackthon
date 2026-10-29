import type { DatasetMapping, ImportedColumn, ValidationIssue } from "@/lib/data-import/types";
import { isMissing, parseNumeric, summarizeRows } from "@/lib/analytics/statistics";

const AREA_ALIASES = new Map([
  ["kigali city", "City of Kigali"],
  ["kigali", "City of Kigali"],
  ["north", "Northern"],
  ["south", "Southern"],
  ["east", "Eastern"],
  ["west", "Western"],
]);

export function normalizeAreaLabel(value: unknown): string {
  const raw = String(value ?? "").trim();
  return AREA_ALIASES.get(raw.toLowerCase()) ?? raw;
}

export function validateDatasetRows(rows: Record<string, unknown>[], columns: ImportedColumn[], mapping: DatasetMapping) {
  const issues: ValidationIssue[] = [];
  if (!rows.length) issues.push({ severity: "error", code: "no_rows", message: "No data rows were found after the header row." });

  const summary = summarizeRows(rows);
  if (summary.duplicateRows) issues.push({ severity: "warning", code: "duplicate_rows", message: `${summary.duplicateRows} duplicate row(s) were detected. They are not removed automatically.` });

  const missingCells = summary.columns.reduce((sum, column) => sum + column.missingCount, 0);
  if (missingCells) issues.push({ severity: "warning", code: "missing_values", message: `${missingCells.toLocaleString()} missing cell(s) were detected across the selected columns.` });

  if (mapping.value) {
    const values = rows.map((row) => row[mapping.value!]).filter((value) => !isMissing(value));
    const numericValues = values.map(parseNumeric).filter((value) => value !== null);
    if (values.length && numericValues.length < values.length) {
      issues.push({ severity: "warning", code: "non_numeric_values", column: mapping.value, message: `${values.length - numericValues.length} non-empty value(s) in the mapped value column are not numeric.` });
    }
    if (numericValues.some((value) => value! < 0 || value! > 100) && /(percent|rate|poverty|inclusion|share)/i.test(mapping.value)) {
      issues.push({ severity: "warning", code: "possible_percent_range", column: mapping.value, message: "Some values fall outside 0–100. Confirm whether this column is a percentage, a proportion, a code, or a different unit." });
    }
    if (numericValues.length && numericValues.every((value) => value! >= 0 && value! <= 1) && /(percent|rate|poverty|inclusion|share)/i.test(mapping.value)) {
      issues.push({ severity: "info", code: "possible_fraction", column: mapping.value, message: "Values are between 0 and 1. Confirm whether they are proportions before formatting them as percentages." });
    }
  }

  if (mapping.weight) {
    const invalidWeights = rows.filter((row) => {
      const weight = parseNumeric(row[mapping.weight!]);
      return weight === null || weight <= 0;
    }).length;
    if (invalidWeights) issues.push({ severity: "warning", code: "invalid_weights", column: mapping.weight, message: `${invalidWeights} row(s) have a missing, non-numeric, or non-positive weight. Weighted estimates will exclude those rows.` });
    issues.push({ severity: "info", code: "survey_design", column: mapping.weight, message: "A weight column alone does not reproduce a complex-survey estimate. Standard errors require the documented strata, clusters and estimator." });
  }

  if (mapping.geography) {
    const distinctAreas = [...new Set(rows.map((row) => normalizeAreaLabel(row[mapping.geography!])).filter(Boolean))];
    if (distinctAreas.length > 1000) issues.push({ severity: "warning", code: "many_geographies", column: mapping.geography, message: "More than 1,000 distinct labels were found. Confirm that the mapped column is a geographical field." });
    const inconsistent = distinctAreas.filter((area) => /\s{2,}/.test(area) || area !== area.trim());
    if (inconsistent.length) issues.push({ severity: "warning", code: "inconsistent_labels", column: mapping.geography, message: "Possible inconsistent whitespace in geographic labels was found." });
  }

  const errors = issues.filter((issue) => issue.severity === "error");
  const status = errors.length ? "invalid" : issues.some((issue) => issue.severity === "warning") ? "warnings" : "valid";
  return { status: status as "valid" | "warnings" | "invalid", issues, duplicateRows: summary.duplicateRows, missingCells };
}
