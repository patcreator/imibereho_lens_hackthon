import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES, validateColumnMapping, validateUploadFile } from "@/lib/analytics/file-validation";
import { normalizeAreaLabel, validateDatasetRows } from "@/lib/data-import/validate-dataset";
import type { ImportedColumn } from "@/lib/data-import/types";

const column = (name: string, type: ImportedColumn["type"] = "numeric"): ImportedColumn => ({
  name, type, missingCount: 0, uniqueCount: 2, sampleValues: [0, 1],
});

describe("upload and dataset validation", () => {
  it("accepts supported CSV/XLSX/DTA files and rejects legacy Excel", () => {
    expect(validateUploadFile({ name: "data.csv", size: 25, type: "text/csv" })).toEqual({ ok: true, format: "csv" });
    expect(validateUploadFile({ name: "data.xlsx", size: 25, type: "application/octet-stream" })).toEqual({ ok: true, format: "xlsx" });
    expect(validateUploadFile({ name: "survey.dta", size: 25, type: "application/octet-stream" })).toEqual({ ok: true, format: "dta" });
    expect(validateUploadFile({ name: "old.xls", size: 25, type: "application/vnd.ms-excel" }).ok).toBe(false);
    expect(validateUploadFile({ name: "too-large.csv", size: MAX_UPLOAD_BYTES + 1, type: "text/csv" }).ok).toBe(false);
  });

  it("normalizes only documented area aliases", () => {
    expect(normalizeAreaLabel("kigali city")).toBe("City of Kigali");
    expect(normalizeAreaLabel("North")).toBe("Northern");
    expect(normalizeAreaLabel("Nyamagabe")).toBe("Nyamagabe");
  });

  it("detects duplicate role assignments and warns about missing data/weights", () => {
    expect(validateColumnMapping({ value: "x", geography: "x" }).valid).toBe(false);
    expect(validateColumnMapping({ value: "x", geography: "district" }).valid).toBe(true);
    const result = validateDatasetRows(
      [{ rate: 0.5, weight: 2 }, { rate: null, weight: 0 }, { rate: 1.2, weight: 3 }],
      [column("rate"), column("weight")],
      { value: "rate", weight: "weight" },
    );
    expect(result.status).toBe("warnings");
    expect(result.issues.some((issue) => issue.code === "missing_values")).toBe(true);
    expect(result.issues.some((issue) => issue.code === "invalid_weights")).toBe(true);
    expect(result.issues.some((issue) => issue.code === "survey_design")).toBe(true);
    const proportion = validateDatasetRows([{ rate: 0.5 }, { rate: 0.75 }], [column("rate")], { value: "rate" });
    expect(proportion.issues.some((issue) => issue.code === "possible_fraction")).toBe(true);
  });
});
