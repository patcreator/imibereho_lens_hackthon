import Papa from "papaparse";
import { parse_metadata, parse_value_labels, read_rows_from_buffer, type DtaMetadata, type RowCell } from "@jbearak/dta-parser";
import { readSheet } from "read-excel-file/browser";
import { inferColumns } from "@/lib/data-import/columns";
import { MAX_ANALYSIS_COLUMNS, MAX_ROWS, validateUploadFile } from "@/lib/analytics/file-validation";
import type { ImportedColumn, ParsedFilePreview } from "@/lib/data-import/types";

const PREVIEW_ROWS = 30;

function toHeader(value: unknown, index: number) {
  const raw = String(value ?? "").trim();
  return raw || `column_${index + 1}`;
}

function makeUniqueHeaders(values: unknown[]) {
  const used = new Map<string, number>();
  return values.map((value, index) => {
    const base = toHeader(value, index);
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    return count ? `${base}_${count + 1}` : base;
  });
}

function rowsToObjects(matrix: unknown[][], headers?: string[]) {
  const names = headers ?? makeUniqueHeaders(matrix[0] ?? []);
  const body = matrix.slice(1);
  const rows = body.filter((cells) => cells.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== ""));
  return { headers: names, rows: rows.map((cells) => Object.fromEntries(names.map((name, index) => [name, cells[index] ?? null]))) };
}

async function parseCsv(file: File) {
  const text = await file.text();
  const result = Papa.parse<unknown[]>(text, { skipEmptyLines: "greedy", dynamicTyping: false, comments: "" });
  if (result.errors.length) throw new Error(`CSV parsing stopped: ${result.errors[0]?.message ?? "invalid CSV"}`);
  if (!result.data.length) throw new Error("The CSV contains no rows.");
  const firstRow = result.data[0] ?? [];
  const { headers, rows } = rowsToObjects(result.data, makeUniqueHeaders(firstRow));
  if (rows.length > MAX_ROWS) throw new Error(`The file has ${rows.length.toLocaleString()} rows; the prototype limit is ${MAX_ROWS.toLocaleString()}.`);
  return { headers, rows, parserWarnings: result.meta.aborted ? ["CSV parsing was aborted by the parser."] : [] };
}

async function parseXlsx(file: File) {
  const matrix = await readSheet(file);
  if (!matrix.length) throw new Error("The workbook's first worksheet is empty.");
  const { headers, rows } = rowsToObjects(matrix);
  if (rows.length > MAX_ROWS) throw new Error(`The worksheet has ${rows.length.toLocaleString()} rows; the prototype limit is ${MAX_ROWS.toLocaleString()}.`);
  return { headers, rows, parserWarnings: ["Only the first worksheet was read. Use a smaller single-sheet workbook if this is not the intended sheet."] };
}

function isDtaMissing(value: RowCell): boolean {
  return typeof value === "object" && value !== null && "kind" in value && value.kind === "missing";
}

function cleanDtaValue(value: RowCell | undefined) {
  return value === undefined || isDtaMissing(value) ? null : value;
}

function makeDtaRows(buffer: ArrayBuffer, metadata: DtaMetadata, start: number, count: number, columnIndexes: number[]) {
  const sorted = [...new Set(columnIndexes)].sort((a, b) => a - b);
  const ranges: Array<{ start: number; end: number }> = [];
  for (const columnIndex of sorted) {
    const last = ranges[ranges.length - 1];
    if (last && columnIndex === last.end) last.end += 1;
    else ranges.push({ start: columnIndex, end: columnIndex + 1 });
  }
  const rows = Array.from({ length: count }, () => ({} as Record<string, unknown>));
  for (const range of ranges) {
    const matrix = read_rows_from_buffer(buffer, metadata, start, count, range.start, range.end);
    matrix.forEach((row, rowIndex) => {
      for (let offset = 0; offset < range.end - range.start; offset += 1) {
        const columnIndex = range.start + offset;
        const name = metadata.variables[columnIndex]?.name ?? `column_${columnIndex + 1}`;
        rows[rowIndex][name] = cleanDtaValue(row[offset]);
      }
    });
  }
  return rows;
}

async function parseDtaPreview(file: File) {
  const buffer = await file.arrayBuffer();
  const metadata = parse_metadata(buffer);
  if (metadata.nobs > MAX_ROWS) throw new Error(`This Stata file has ${metadata.nobs.toLocaleString()} observations; the prototype limit is ${MAX_ROWS.toLocaleString()}.`);
  const sampleCount = Math.min(PREVIEW_ROWS, metadata.nobs);
  const columnIndexes = Array.from({ length: metadata.nvar }, (_, index) => index);
  const previewRows = makeDtaRows(buffer, metadata, 0, sampleCount, columnIndexes);
  let labelTables = new Map<string, Map<number, string>>();
  let labelWarning: string | undefined;
  try {
    labelTables = parse_value_labels(buffer, metadata);
  } catch {
    labelWarning = "Value-label metadata could not be decoded; numeric codes are shown without labels.";
  }
  const labels = new Map<string, { label: string; valueLabelTable: string; valueLabels?: Map<number, string> }>();
  metadata.variables.forEach((variable) => {
    const table = labelTables.get(variable.value_label_name);
    labels.set(variable.name, {
      label: variable.label,
      valueLabelTable: variable.value_label_name,
      valueLabels: table,
    });
  });
  const indexes = new Map(metadata.variables.map((variable, index) => [variable.name, index]));
  const likelyFinScope = /finscope/i.test(file.name) || metadata.variables.some(({ name }) => name === "pop_wt" || name === "hh_wt");
  const columns = inferColumns(
    metadata.variables.map((variable) => variable.name),
    previewRows,
    indexes,
    labels,
  );
  return {
    format: "dta" as const,
    fileName: file.name,
    fileSizeBytes: file.size,
    rowCount: metadata.nobs,
    columns,
    previewRows,
    sourceVariableCount: metadata.nvar,
    parserWarnings: [
      ...(likelyFinScope && metadata.nvar !== 2500
        ? [`This FinScope-like file reports ${metadata.nvar.toLocaleString()} variables; the attached FinScope DDI reference lists 2,500. Confirm that this is the intended release.`]
        : []),
      ...(labelWarning ? [labelWarning] : []),
    ],
    labelMaps: Object.fromEntries([...labelTables.entries()].map(([tableName, table]) => [tableName, Object.fromEntries([...table.entries()].map(([key, value]) => [String(key), value]))])),
  } satisfies ParsedFilePreview;
}

export async function inspectFile(file: File): Promise<ParsedFilePreview> {
  const validation = validateUploadFile(file);
  if (!validation.ok) throw new Error(validation.message);
  if (validation.format === "dta") return parseDtaPreview(file);
  const result = validation.format === "csv" ? await parseCsv(file) : await parseXlsx(file);
  const columns = inferColumns(result.headers, result.rows.slice(0, 250));
  return {
    format: validation.format,
    fileName: file.name,
    fileSizeBytes: file.size,
    rowCount: result.rows.length,
    columns,
    previewRows: result.rows.slice(0, PREVIEW_ROWS),
    parserWarnings: result.parserWarnings,
    labelMaps: {},
  };
}

export async function readSelectedRows(file: File, selectedColumnNames: string[]) {
  const validation = validateUploadFile(file);
  if (!validation.ok) throw new Error(validation.message);
  if (!selectedColumnNames.length) throw new Error("Select at least one column for analysis.");
  if (selectedColumnNames.length > MAX_ANALYSIS_COLUMNS) throw new Error(`Select no more than ${MAX_ANALYSIS_COLUMNS} columns for this import.`);

  if (validation.format === "dta") {
    const buffer = await file.arrayBuffer();
    const metadata = parse_metadata(buffer);
    const indexes = new Map(metadata.variables.map((variable, index) => [variable.name, index]));
    const unknown = selectedColumnNames.filter((name) => !indexes.has(name));
    if (unknown.length) throw new Error(`Selected DTA variable(s) not found: ${unknown.join(", ")}`);
    const selectedIndexes = selectedColumnNames.map((name) => indexes.get(name)!);
    const rawRows = makeDtaRows(buffer, metadata, 0, metadata.nobs, selectedIndexes);
    const rows = rawRows.map((row) => Object.fromEntries(selectedColumnNames.map((name) => [name, row[name] ?? null])));
    return rows;
  }

  const result = validation.format === "csv" ? await parseCsv(file) : await parseXlsx(file);
  const notFound = selectedColumnNames.filter((name) => !result.headers.includes(name));
  if (notFound.length) throw new Error(`Selected column(s) not found: ${notFound.join(", ")}`);
  return result.rows.map((row) => Object.fromEntries(selectedColumnNames.map((name) => [name, row[name] ?? null])));
}

export function previewColumnLabels(columns: ImportedColumn[]) {
  return columns.map((column) => ({ name: column.name, label: column.label ?? column.name, type: column.type }));
}
