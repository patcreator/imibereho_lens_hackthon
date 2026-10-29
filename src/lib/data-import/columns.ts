import type { ImportedColumn } from "@/lib/data-import/types";
import { isMissing, parseNumeric } from "@/lib/analytics/statistics";

export function inferColumns(headers: string[], rows: Array<Record<string, unknown>>, indexes?: Map<string, number>, labels?: Map<string, { label: string; valueLabelTable: string; valueLabels?: Map<number, string> }>): ImportedColumn[] {
  return headers.map((name) => {
    const values = rows.map((row) => row[name]);
    const present = values.filter((value) => !isMissing(value));
    const numericValues = present.map(parseNumeric).filter((value) => value !== null);
    const distinct = new Set(present.map((value) => String(value)));
    const labelInfo = labels?.get(name);
    const type: ImportedColumn["type"] = present.length === 0
      ? "unknown"
      : present.every((value) => typeof value === "boolean")
        ? "boolean"
        : present.every((value) => value instanceof Date)
          ? "date"
          : numericValues.length === present.length
            ? "numeric"
            : "categorical";
    return {
      name,
      label: labelInfo?.label,
      type,
      sourceIndex: indexes?.get(name),
      valueLabelTable: labelInfo?.valueLabelTable,
      valueLabels: labelInfo?.valueLabels ? Object.fromEntries([...labelInfo.valueLabels].map(([key, value]) => [String(key), value])) : undefined,
      missingCount: values.length - present.length,
      uniqueCount: distinct.size,
      sampleValues: [...distinct].slice(0, 6),
    };
  });
}
