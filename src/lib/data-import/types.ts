export type ImportedColumn = {
  name: string;
  label?: string;
  type: "numeric" | "categorical" | "date" | "boolean" | "unknown";
  sourceIndex?: number;
  valueLabelTable?: string;
  valueLabels?: Record<string, string>;
  missingCount: number;
  uniqueCount: number;
  sampleValues: unknown[];
};

export type DatasetMapping = {
  geography?: string;
  value?: string;
  period?: string;
  weight?: string;
  group?: string;
  indicator?: string;
  denominator?: string;
};

export type ValidationIssue = {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  column?: string;
};

export type ImportedDataset = {
  id: string;
  name: string;
  description: string;
  sourceOrganization: string;
  sourceUrl: string;
  surveyPeriod: string;
  reportingPeriod: string;
  fileName: string;
  fileFormat: "csv" | "xlsx" | "dta";
  fileSizeBytes: number;
  checksumSha256?: string;
  accessClassification: "user-upload";
  importedAt: string;
  rowCount: number;
  sourceVariableCount?: number;
  columns: ImportedColumn[];
  selectedColumns: string[];
  mapping: DatasetMapping;
  rows: Record<string, unknown>[];
  previewRows: Record<string, unknown>[];
  validation: {
    status: "valid" | "warnings" | "invalid";
    issues: ValidationIssue[];
    duplicateRows: number;
    missingCells: number;
  };
  metadataNotes: string[];
};

export type ParsedFilePreview = {
  format: "csv" | "xlsx" | "dta";
  fileName: string;
  fileSizeBytes: number;
  rowCount: number;
  columns: ImportedColumn[];
  previewRows: Record<string, unknown>[];
  sourceVariableCount?: number;
  parserWarnings: string[];
  labelMaps: Record<string, Record<string, string>>;
};
