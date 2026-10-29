import type { ImportedDataset } from "@/lib/data-import/types";

const METADATA_KEY = "imibereho-lens:datasets:v1";

export function readDatasetIndex(): Array<Pick<ImportedDataset, "id" | "name" | "fileName" | "fileFormat" | "rowCount" | "importedAt" | "sourceOrganization" | "reportingPeriod">> {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(METADATA_KEY) ?? "[]");
    return Array.isArray(value) ? value as ReturnType<typeof readDatasetIndex> : [];
  } catch {
    return [];
  }
}

export function writeDatasetIndex(datasets: ImportedDataset[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(METADATA_KEY, JSON.stringify(datasets.map(({ id, name, fileName, fileFormat, rowCount, importedAt, sourceOrganization, reportingPeriod }) => ({
    id, name, fileName, fileFormat, rowCount, importedAt, sourceOrganization, reportingPeriod,
  }))));
}
