import type { ImportedColumn } from "@/lib/data-import/types";

export function displayCellValue(value: unknown, column?: Pick<ImportedColumn, "valueLabels">) {
  if (value === null || value === undefined || (typeof value === "string" && !value.trim())) return "—";
  const label = column?.valueLabels?.[String(value)];
  return label ? `${label} (${String(value)})` : String(value);
}
