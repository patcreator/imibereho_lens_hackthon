export const MAX_UPLOAD_BYTES = 60 * 1024 * 1024;
export const MAX_ROWS = 100_000;
export const MAX_ANALYSIS_COLUMNS = 24;

export type SupportedFormat = "csv" | "xlsx" | "dta";

export type FileValidationResult =
  | { ok: true; format: SupportedFormat }
  | { ok: false; message: string };

export function validateUploadFile(file: Pick<File, "name" | "size" | "type">): FileValidationResult {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension) return { ok: false, message: "The file must have a recognizable extension." };
  if (!["csv", "xlsx", "dta"].includes(extension)) {
    return {
      ok: false,
      message: extension === "xls"
        ? "Legacy .xls workbooks are not supported by the selected parser. Save the workbook as .xlsx or .csv, then upload it again."
        : "Unsupported file type. Upload a .csv, .xlsx, or .dta file.",
    };
  }
  if (!Number.isFinite(file.size) || file.size <= 0) return { ok: false, message: "The selected file is empty." };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, message: "This file is larger than the 60 MB prototype limit." };
  if (extension === "csv" && file.type && !["text/csv", "application/vnd.ms-excel", "text/plain", "application/csv"].includes(file.type)) {
    return { ok: false, message: "The selected file extension is .csv, but its content type does not look like CSV." };
  }
  return { ok: true, format: extension as SupportedFormat };
}

export function validateColumnMapping(mapping: Record<string, string | undefined>) {
  const errors: string[] = [];
  const mapped = Object.entries(mapping).filter(([, value]) => Boolean(value));
  const uniqueFields = new Set(mapped.map(([, value]) => value));
  if (uniqueFields.size !== mapped.length) errors.push("A column is assigned to more than one analytical role; confirm the mapping or use distinct columns.");
  if (mapping.value && mapping.value === mapping.weight) errors.push("The value and survey-weight roles must use different columns.");
  if (mapping.geography && mapping.geography === mapping.value) errors.push("The geography and value roles must use different columns.");
  return { valid: errors.length === 0, errors };
}
