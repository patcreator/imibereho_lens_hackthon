"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  FileText,
  Info,
  LockKeyhole,
  Search,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SourceNote } from "@/components/source-note";
import { MAX_ANALYSIS_COLUMNS, validateColumnMapping, validateUploadFile } from "@/lib/analytics/file-validation";
import { inspectFile, readSelectedRows } from "@/lib/data-import/parse-file";
import { displayCellValue } from "@/lib/data-import/display";
import { validateDatasetRows } from "@/lib/data-import/validate-dataset";
import { deleteImportedDataset, listImportedDatasets, putImportedDataset } from "@/lib/data-import/storage";
import { writeDatasetIndex } from "@/lib/data-import/persisted";
import { finscopeSource } from "@/lib/data/finscope-2024";
import { sourceLinks } from "@/lib/data/sources";
import type { DatasetMapping, ImportedColumn, ImportedDataset, ParsedFilePreview } from "@/lib/data-import/types";

const roleLabels: Array<{ key: keyof DatasetMapping; label: string; help: string }> = [
  { key: "geography", label: "Geography", help: "District, province, region or other area" },
  { key: "value", label: "Measure / outcome", help: "Numeric field for summaries" },
  { key: "weight", label: "Survey weight", help: "A documented weight; not a substitute for full survey design" },
  { key: "group", label: "Comparison group", help: "Sex, residence or another grouping field" },
  { key: "indicator", label: "Indicator", help: "A variable or indicator name" },
  { key: "period", label: "Time period", help: "Year, round or reporting period" },
];

function guessMapping(columns: ImportedColumn[], selected: string[]): DatasetMapping {
  const eligible = columns.filter((column) => selected.includes(column.name));
  const find = (predicate: (column: ImportedColumn) => boolean) => eligible.find(predicate)?.name;
  return {
    geography: find((column) => /district|province|region|urban.?rural|geograph|area/i.test(`${column.name} ${column.label ?? ""}`)),
    weight: find((column) => /(^pop_wt$|weight|_wt$)/i.test(`${column.name} ${column.label ?? ""}`)),
    group: find((column) => /sex|gender|urban.?rural|residence/i.test(`${column.name} ${column.label ?? ""}`)),
    period: find((column) => /year|period|round|wave/i.test(`${column.name} ${column.label ?? ""}`)),
    indicator: undefined,
    value: undefined,
  };
}

function getInitialColumns(preview: ParsedFilePreview) {
  const preferredDta = ["a1", "a2", "a6", "pop_wt", "b1", "b2"];
  if (preview.format === "dta") {
    const available = preferredDta.filter((name) => preview.columns.some((column) => column.name === name));
    return available.slice(0, MAX_ANALYSIS_COLUMNS);
  }
  return preview.columns.slice(0, MAX_ANALYSIS_COLUMNS).map((column) => column.name);
}

function getInitialSource(fileName: string) {
  if (fileName.toLowerCase().includes("finscope")) {
    return { sourceOrganization: "Access to Finance Rwanda", sourceUrl: finscopeSource.catalogUrl, surveyPeriod: "2024", reportingPeriod: "2024" };
  }
  return { sourceOrganization: "User-supplied source", sourceUrl: "", surveyPeriod: "", reportingPeriod: "" };
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DatasetsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedFilePreview | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<DatasetMapping>({});
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyMessage, setBusyMessage] = useState("");
  const [error, setError] = useState("");
  const [validation, setValidation] = useState<ReturnType<typeof validateDatasetRows> | null>(null);
  const [consent, setConsent] = useState(false);
  const [listRefresh, setListRefresh] = useState(0);
  const [form, setForm] = useState({ name: "", description: "", sourceOrganization: "User-supplied source", sourceUrl: "", surveyPeriod: "", reportingPeriod: "" });

  const visibleColumns = useMemo(() => {
    if (!preview) return [];
    const query = search.trim().toLowerCase();
    return preview.columns.filter((column) => !query || `${column.name} ${column.label ?? ""}`.toLowerCase().includes(query)).slice(0, 60);
  }, [preview, search]);

  const selectedMeta = useMemo(() => preview?.columns.filter((column) => selectedColumns.includes(column.name)) ?? [], [preview, selectedColumns]);
  const selectedCount = selectedColumns.length;

  const handleFile = async (selectedFile?: File) => {
    if (!selectedFile) return;
    setError(""); setValidation(null); setPreview(null); setFile(null); setBusy(true); setBusyMessage("Inspecting the file in this browser…");
    try {
      const valid = validateUploadFile(selectedFile);
      if (!valid.ok) throw new Error(valid.message);
      const result = await inspectFile(selectedFile);
      const initial = getInitialColumns(result);
      const suggestedMapping = guessMapping(result.columns, initial);
      const source = getInitialSource(selectedFile.name);
      const fileStem = selectedFile.name.replace(/\.[^.]+$/, "");
      setPreview(result);
      setFile(selectedFile);
      setSelectedColumns(initial);
      setMapping(suggestedMapping);
      setForm({ name: fileStem, description: "", ...source });
      setConsent(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The file could not be inspected.");
    } finally {
      setBusy(false); setBusyMessage("");
    }
  };

  const updateRole = (key: keyof DatasetMapping, value: string) => setMapping((current) => ({ ...current, [key]: value || undefined }));

  const toggleColumn = (name: string) => {
    const removing = selectedColumns.includes(name);
    setSelectedColumns((current) => removing
      ? current.filter((column) => column !== name)
      : current.length < MAX_ANALYSIS_COLUMNS ? [...current, name] : current);
    if (removing) {
      setMapping((current) => Object.fromEntries(Object.entries(current).map(([role, column]) => [role, column === name ? undefined : column])) as DatasetMapping);
    }
    setValidation(null);
  };

  const removeDataset = async (dataset: ImportedDataset) => {
    if (!window.confirm(`Delete “${dataset.name}” and its browser-local rows from this device?`)) return;
    await deleteImportedDataset(dataset.id);
    writeDatasetIndex(await listImportedDatasets());
    setListRefresh((current) => current + 1);
  };

  const saveDataset = async () => {
    if (!preview || !file) return;
    setError(""); setValidation(null);
    if (!form.name.trim()) { setError("Enter a dataset name."); return; }
    if (!consent) { setError("Confirm that you have permission to use this data and want to store the selected rows locally in this browser."); return; }
    if (!selectedColumns.length) { setError("Select at least one variable."); return; }
    const mappingCheck = validateColumnMapping(mapping as Record<string, string | undefined>);
    if (!mappingCheck.valid) { setError(mappingCheck.errors.join(" ")); return; }
    setBusy(true); setBusyMessage("Reading selected columns and checking values locally…");
    try {
      const rows = await readSelectedRows(file, selectedColumns);
      const selectedColumnsMeta = preview.columns.filter((column) => selectedColumns.includes(column.name));
      const result = validateDatasetRows(rows, selectedColumnsMeta, mapping);
      setValidation(result);
      if (result.status === "invalid") throw new Error(result.issues.filter((issue) => issue.severity === "error").map((issue) => issue.message).join(" "));
      const dataset: ImportedDataset = {
        id: crypto.randomUUID(),
        name: form.name.trim(),
        description: form.description.trim(),
        sourceOrganization: form.sourceOrganization.trim() || "User-supplied source",
        sourceUrl: form.sourceUrl.trim(),
        surveyPeriod: form.surveyPeriod.trim(),
        reportingPeriod: form.reportingPeriod.trim(),
        fileName: preview.fileName,
        fileFormat: preview.format,
        fileSizeBytes: preview.fileSizeBytes,
        accessClassification: "user-upload",
        importedAt: new Date().toISOString(),
        rowCount: rows.length,
        sourceVariableCount: preview.sourceVariableCount,
        columns: selectedColumnsMeta,
        selectedColumns,
        mapping,
        rows,
        previewRows: rows.slice(0, 20),
        validation: result,
        metadataNotes: [
          "User-supplied file; not an official NISR estimate unless the user-provided source says so.",
          "Rows are stored in IndexedDB on this browser/device. They are not uploaded to the app server.",
          ...preview.parserWarnings,
        ],
      };
      await putImportedDataset(dataset);
      writeDatasetIndex(await listImportedDatasets());
      router.push(`/datasets/${dataset.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The dataset could not be saved locally.");
    } finally {
      setBusy(false); setBusyMessage("");
    }
  };

  const maxVisible = preview ? preview.columns.filter((column) => !search.trim() || `${column.name} ${column.label ?? ""}`.toLowerCase().includes(search.trim().toLowerCase())).length : 0;

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2"><Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px]">Browser-local workspace</Badge><span className="text-[10px] text-muted-foreground">CSV · XLSX · Stata DTA</span></div>
          <h2 className="mt-4 font-display text-[30px] font-semibold tracking-[-0.035em] sm:text-[36px]">Bring data. Keep its story.</h2>
          <p className="mt-2 max-w-2xl text-[12px] leading-relaxed text-muted-foreground sm:text-[13px]">Import a supported file, document its source and period, validate selected columns, then explore descriptive summaries. The file is read in your browser; selected rows stay in this browser’s IndexedDB.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-[10px] font-medium text-muted-foreground"><LockKeyhole className="size-4 text-primary" />No raw rows sent to the app server</div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.75fr)]">
        <Card className="rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(20,30,22,.03)]">
          <CardHeader className="pb-3"><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Step 1 · Choose a file</div><CardTitle className="mt-1.5 text-[16px]">Inspect a dataset</CardTitle><p className="mt-1 text-[11px] text-muted-foreground">Maximum 60 MB · 100,000 rows · 24 selected analysis columns</p></CardHeader>
          <CardContent className="space-y-4">
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.dta,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream" className="sr-only" onChange={(event) => void handleFile(event.target.files?.[0])} aria-label="Select a CSV, XLSX or DTA file" />
            <button type="button" onClick={() => fileInputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void handleFile(event.dataTransfer.files?.[0]); }} className="group flex min-h-36 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-primary/35 bg-primary/[0.035] px-4 py-6 text-center transition hover:border-primary/60 hover:bg-primary/[0.06]">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Upload className="size-5" /></span>
              <span className="mt-3 text-[12px] font-semibold">{file ? file.name : "Drop a dataset here or browse"}</span>
              <span className="mt-1 text-[10px] text-muted-foreground">{file ? `${formatBytes(file.size)} · ${preview?.format.toUpperCase()} · ${preview?.rowCount.toLocaleString()} rows` : "CSV, Excel (.xlsx), or Stata (.dta) · 60 MB max"}</span>
            </button>
            {busy && <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-[11px] text-muted-foreground"><span className="size-2 animate-pulse rounded-full bg-primary" />{busyMessage || "Working…"}</div>}
            {error && <div role="alert" className="flex gap-2 rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-[11px] leading-relaxed text-destructive"><AlertCircle className="mt-0.5 size-4 shrink-0" />{error}</div>}
            {preview && !error && <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/20 bg-primary/[0.04] p-3 text-[11px]"><CheckCircle2 className="size-4 text-primary" /><span className="font-semibold">File inspected</span><span className="text-muted-foreground">{preview.rowCount.toLocaleString()} rows · {preview.columns.length.toLocaleString()} variables · {preview.format.toUpperCase()}</span><button type="button" onClick={() => { setPreview(null); setFile(null); setSelectedColumns([]); setValidation(null); setError(""); }} className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Clear selected file"><X className="size-4" /></button></div>}
            {preview?.parserWarnings.map((warning) => <p key={warning} className="rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-3 text-[10px] leading-relaxed text-amber-900 dark:text-amber-200"><Info className="mr-1.5 inline size-3.5" />{warning}</p>)}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(20,30,22,.03)]">
            <CardHeader className="pb-3"><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Before you begin</div><CardTitle className="mt-1.5 text-[15px]">Data handling promise</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-[11px] leading-relaxed text-muted-foreground">
              <div className="flex gap-2"><Check className="mt-0.5 size-3.5 shrink-0 text-primary" />Parsing and validation run in the current browser tab.</div>
              <div className="flex gap-2"><Check className="mt-0.5 size-3.5 shrink-0 text-primary" />Only selected columns are stored in browser-local IndexedDB.</div>
              <div className="flex gap-2"><Check className="mt-0.5 size-3.5 shrink-0 text-primary" />Deleting a dataset removes its local rows and metadata index.</div>
              <div className="flex gap-2"><AlertCircle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />Do not upload data you are not permitted to use, or sensitive/personal records.</div>
              <div className="flex gap-2"><AlertCircle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />A weight column alone cannot recreate survey-design estimates or confidence intervals.</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/80 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-[11px] font-semibold"><FileSpreadsheet className="size-4 text-primary" />File formats</div>
              <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">.xls is not supported. Convert it to .xlsx or CSV before import. Excel import reads the first worksheet only. DTA metadata is retained; code labels are displayed where available.</p>
              <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">DTA parsing uses <code className="rounded bg-muted px-1">@jbearak/dta-parser</code> (GPL-3.0). See the README license notice before redistribution.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {preview && (
        <>
          <Card className="rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(20,30,22,.03)]">
            <CardHeader className="pb-3"><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Step 2 · Describe the source</div><CardTitle className="mt-1.5 text-[16px]">Provenance and reporting context</CardTitle><p className="mt-1 text-[11px] text-muted-foreground">These details stay with the imported dataset and appear in its analysis.</p></CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <label className="space-y-1.5 text-[10px] font-semibold">Dataset name <span className="text-destructive">*</span><Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} maxLength={100} placeholder="e.g. EICV7 table extract" className="h-9 rounded-xl text-[11px]" /></label>
                <label className="space-y-1.5 text-[10px] font-semibold">Source organization<Input value={form.sourceOrganization} onChange={(event) => setForm((current) => ({ ...current, sourceOrganization: event.target.value }))} maxLength={120} className="h-9 rounded-xl text-[11px]" /></label>
                <label className="space-y-1.5 text-[10px] font-semibold">Source URL<Input value={form.sourceUrl} onChange={(event) => setForm((current) => ({ ...current, sourceUrl: event.target.value }))} maxLength={500} placeholder="https://…" type="url" className="h-9 rounded-xl text-[11px]" /></label>
                <label className="space-y-1.5 text-[10px] font-semibold">Survey period<Input value={form.surveyPeriod} onChange={(event) => setForm((current) => ({ ...current, surveyPeriod: event.target.value }))} maxLength={80} placeholder="e.g. 2024" className="h-9 rounded-xl text-[11px]" /></label>
                <label className="space-y-1.5 text-[10px] font-semibold">Reporting period<Input value={form.reportingPeriod} onChange={(event) => setForm((current) => ({ ...current, reportingPeriod: event.target.value }))} maxLength={80} placeholder="e.g. 2023/24" className="h-9 rounded-xl text-[11px]" /></label>
                <label className="space-y-1.5 text-[10px] font-semibold md:col-span-2 xl:col-span-1">Description<Input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} maxLength={300} placeholder="Optional note about this extract" className="h-9 rounded-xl text-[11px]" /></label>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(20,30,22,.03)]">
            <CardHeader className="pb-3"><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Step 3 · Select and map variables</div><CardTitle className="mt-1.5 text-[16px]">Choose up to {MAX_ANALYSIS_COLUMNS} analysis columns</CardTitle><p className="mt-1 text-[11px] text-muted-foreground">Search by variable name or label. Suggested roles are only hints—confirm them against the source documentation.</p></CardHeader>
            <CardContent className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,.8fr)]">
              <div>
                <div className="mb-2 flex items-center justify-between gap-3"><div className="text-[10px] font-semibold text-muted-foreground">{selectedCount} selected · {maxVisible.toLocaleString()} match{maxVisible === 1 ? "" : "es"}{maxVisible > 60 ? " · showing first 60" : ""}</div><Button type="button" size="xs" variant="outline" className="rounded-lg" onClick={() => setSelectedColumns([])}>Clear</Button></div>
                <div className="relative mb-3"><Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search variable or label" className="h-9 rounded-xl pl-9 text-[11px]" /></div>
                <div className="max-h-[340px] overflow-y-auto rounded-xl border border-border/70">
                  {visibleColumns.map((column) => {
                    const checked = selectedColumns.includes(column.name);
                    const disabled = !checked && selectedCount >= MAX_ANALYSIS_COLUMNS;
                    const likelyId = /(^key$|identifier|record.?id|household.?id|respondent.?id)/i.test(`${column.name} ${column.label ?? ""}`);
                    return (
                      <label key={column.name} className={`flex cursor-pointer items-start gap-2.5 border-b border-border/50 px-3 py-2.5 last:border-b-0 hover:bg-muted/35 ${disabled ? "cursor-not-allowed opacity-50" : ""}`}>
                        <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggleColumn(column.name)} className="mt-0.5 accent-[var(--primary)]" />
                        <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold"><code className="rounded bg-muted px-1.5 py-0.5">{column.name}</code><span className="rounded-full bg-secondary px-1.5 py-0.5 text-[8px] font-medium text-secondary-foreground">{column.type}</span>{likelyId && <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-semibold text-amber-700 dark:text-amber-300">identifier-like</span>}</span><span className="mt-1 block truncate text-[10px] text-muted-foreground" title={column.label}>{column.label || "No variable label"}</span></span>
                        <span className="shrink-0 text-[9px] tabular-nums text-muted-foreground">{column.uniqueCount.toLocaleString()} unique</span>
                      </label>
                    );
                  })}
                  {!visibleColumns.length && <p className="p-5 text-center text-[11px] text-muted-foreground">No variables match that search.</p>}
                </div>
                {selectedCount >= MAX_ANALYSIS_COLUMNS && <p className="mt-2 text-[9px] text-amber-700 dark:text-amber-300">Column limit reached. Remove a variable before selecting another.</p>}
              </div>
              <div className="space-y-4">
                <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4">
                  <div><div className="text-[11px] font-semibold">Map analytical roles</div><p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">These roles help the explorer choose summaries. You can leave a role unmapped.</p></div>
                  {roleLabels.map((role) => (
                    <label key={role.key} className="block space-y-1 text-[9px] font-semibold text-muted-foreground"><span className="flex items-center justify-between gap-2"><span>{role.label}</span><span className="font-normal">{role.help}</span></span><select value={mapping[role.key] ?? ""} onChange={(event) => updateRole(role.key, event.target.value)} className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-[10px] font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="">Not mapped</option>{selectedMeta.map((column) => <option key={column.name} value={column.name}>{column.name}{column.label ? ` · ${column.label}` : ""}</option>)}</select></label>
                  ))}
                </div>
                {preview.previewRows.length > 0 && selectedColumns.length > 0 && (
                  <div className="rounded-xl border border-border/70 p-3">
                    <div className="mb-2 text-[10px] font-semibold">Data preview <span className="font-normal text-muted-foreground">· first {Math.min(6, preview.previewRows.length)} rows</span></div>
                    <div className="overflow-x-auto"><table className="w-full min-w-[430px] border-collapse text-[9px]"><thead><tr className="border-b border-border/60 text-left text-muted-foreground">{selectedMeta.slice(0, 6).map((column) => <th className="max-w-32 px-2 py-2 font-semibold" key={column.name}>{column.name}</th>)}</tr></thead><tbody>{preview.previewRows.slice(0, 6).map((row, index) => <tr key={index} className="border-b border-border/45 last:border-0">{selectedMeta.slice(0, 6).map((column) => <td key={column.name} className="max-w-32 truncate px-2 py-2" title={displayCellValue(row[column.name], column)}>{displayCellValue(row[column.name], column)}</td>)}</tr>)}</tbody></table></div>
                  </div>
                )}
                <label className="flex items-start gap-2.5 rounded-xl border border-border/70 bg-muted/35 p-3 text-[10px] leading-relaxed text-muted-foreground"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 accent-[var(--primary)]" /><span>I have permission to use this data, understand that selected rows are saved in this browser’s IndexedDB, and will not upload personal or restricted records.</span></label>
                <Button onClick={() => void saveDataset()} disabled={busy || !selectedCount} className="h-10 w-full rounded-xl text-[11px] font-semibold"><Database className="mr-2 size-4" />{busy ? "Validating and saving…" : "Validate & open dataset"}<ArrowRight className="ml-auto size-4" /></Button>
                {validation && <div className="rounded-xl border border-border/70 bg-muted/30 p-3"><div className="flex items-center gap-2 text-[10px] font-semibold"><CheckCircle2 className="size-4 text-primary" />Validation: {validation.status}</div><div className="mt-1 text-[9px] text-muted-foreground">{validation.duplicateRows} duplicate rows · {validation.missingCells.toLocaleString()} missing cells</div></div>}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <SourceNote title="Official starter data is already available" source="NISR EICV7 Main Indicators and MPI tables" href={sourceLinks.eicv7Main.url} period="EICV7 · 2023/24 · built-in source snapshot" note="Use the poverty and development explorers for verified published aggregates. The import workflow is for user-provided files and does not convert them into official estimates." badge="Built-in official source" />

      <ImportedDatasetList onDelete={removeDataset} refreshToken={listRefresh} />
    </div>
  );
}

function ImportedDatasetList({ onDelete, refreshToken }: { onDelete: (dataset: ImportedDataset) => void; refreshToken: number }) {
  const [datasets, setDatasets] = useState<ImportedDataset[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let current = true;
    void listImportedDatasets().then((items) => {
      if (!current) return;
      setDatasets(items);
      writeDatasetIndex(items);
    }).finally(() => { if (current) setLoaded(true); });
    return () => { current = false; };
  }, [refreshToken]);
  if (!loaded) return null;
  if (!datasets.length) return <div className="rounded-xl border border-dashed border-border/80 p-5 text-center text-[11px] text-muted-foreground">No browser-local datasets yet. Imported files will appear here.</div>;
  return (
    <section className="space-y-3">
      <div><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">This browser only</div><h2 className="mt-1 text-[16px] font-semibold">Imported datasets</h2></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {datasets.map((dataset) => (
          <Card key={dataset.id} className="rounded-2xl border-border/80 shadow-none"><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">{dataset.fileFormat === "csv" ? <FileText className="size-4" /> : <FileSpreadsheet className="size-4" />}</div><Badge variant={dataset.validation.status === "valid" ? "secondary" : "outline"} className="rounded-full text-[9px]">{dataset.validation.status}</Badge></div><div className="mt-3 text-[12px] font-semibold">{dataset.name}</div><div className="mt-1 truncate text-[10px] text-muted-foreground">{dataset.sourceOrganization} · {dataset.reportingPeriod || "period not specified"}</div><div className="mt-2 text-[9px] text-muted-foreground">{dataset.rowCount.toLocaleString()} rows · {dataset.selectedColumns.length} variables · {new Date(dataset.importedAt).toLocaleDateString()}</div><div className="mt-4 flex items-center gap-2"><Link href={`/datasets/${dataset.id}`} className="inline-flex h-8 flex-1 items-center justify-between rounded-lg bg-primary px-2.5 text-[10px] font-medium text-primary-foreground transition hover:bg-primary/80">Open explorer <ArrowRight className="size-3.5" /></Link><Button type="button" variant="outline" size="icon" className="size-8 rounded-lg" aria-label={`Delete ${dataset.name}`} onClick={() => void onDelete(dataset)}><X className="size-3.5" /></Button></div></CardContent></Card>
        ))}
      </div>
    </section>
  );
}
