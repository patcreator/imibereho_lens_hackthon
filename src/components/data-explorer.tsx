"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Database,
  Download,
  Info,
  Save,
  ShieldCheck,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { deleteImportedDataset, getImportedDataset, listImportedDatasets } from "@/lib/data-import/storage";
import { writeDatasetIndex } from "@/lib/data-import/persisted";
import { displayCellValue } from "@/lib/data-import/display";
import { frequencyDistribution, isMissing, parseNumeric, summarizeNumeric, weightedMean } from "@/lib/analytics/statistics";
import { saveAnalysis } from "@/lib/data/saved-analyses";
import { downloadCsv, formatNumber, formatPercent } from "@/lib/utils";
import type { ImportedColumn, ImportedDataset } from "@/lib/data-import/types";

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function effectiveType(column?: ImportedColumn) {
  if (!column) return "unknown";
  return column.type === "numeric" && !column.valueLabels ? "numeric" : "categorical";
}

function Histogram({ values, weights }: { values: unknown[]; weights?: unknown[] }) {
  const numbers = values.map(parseNumeric).filter((value): value is number => value !== null);
  if (!numbers.length) return <div className="py-8 text-center text-[11px] text-muted-foreground">No numeric values to plot.</div>;
  const min = numbers.reduce((minimum, value) => Math.min(minimum, value), Number.POSITIVE_INFINITY);
  const max = numbers.reduce((maximum, value) => Math.max(maximum, value), Number.NEGATIVE_INFINITY);
  const binsCount = min === max ? 1 : Math.min(12, Math.max(5, Math.ceil(Math.sqrt(numbers.length))));
  const bins = Array.from({ length: binsCount }, (_, index) => ({
    from: min + ((max - min) * index) / binsCount,
    to: min + ((max - min) * (index + 1)) / binsCount,
    weight: 0,
  }));
  values.forEach((value, index) => {
    const parsed = parseNumeric(value);
    const weight = weights ? parseNumeric(weights[index]) : 1;
    if (parsed === null || weight === null || weight <= 0) return;
    const binIndex = min === max ? 0 : Math.min(binsCount - 1, Math.floor(((parsed - min) / (max - min)) * binsCount));
    bins[binIndex].weight += weight;
  });
  const maxWeight = Math.max(...bins.map((bin) => bin.weight), 1);
  const total = bins.reduce((sum, bin) => sum + bin.weight, 0);
  const digits = max - min < 10 ? 1 : 0;
  return (
    <div className="flex h-48 items-end gap-2 border-b border-border/70 px-2 pb-1 pt-5">
      {bins.map((bin, index) => {
        const height = Math.max(2, (bin.weight / maxWeight) * 100);
        const label = min === max ? formatNumber(min, digits) : `${formatNumber(bin.from, digits)}–${formatNumber(bin.to, digits)}`;
        return <div key={index} className="group relative flex h-full min-w-0 flex-1 flex-col justify-end">
          <div className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-card px-2 py-1 text-[9px] shadow-md group-hover:block">{label}<br />{formatNumber(bin.weight, 1)} weighted count · {formatPercent(total ? bin.weight / total * 100 : 0, 1)}</div>
          <div className="rounded-t-md bg-primary/80 transition-colors group-hover:bg-primary" style={{ height: `${height}%` }} />
        </div>;
      })}
    </div>
  );
}

function Kpi({ label, value, foot }: { label: string; value: string; foot: string }) {
  return <div className="rounded-xl border border-border/70 bg-card p-4"><div className="text-[10px] font-medium text-muted-foreground">{label}</div><div className="mt-2 font-display text-[24px] font-semibold tracking-tight">{value}</div><div className="mt-1 text-[9px] text-muted-foreground">{foot}</div></div>;
}

export function DataExplorer({ datasetId }: { datasetId: string }) {
  const router = useRouter();
  const [dataset, setDataset] = useState<ImportedDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [variable, setVariable] = useState("");
  const [groupBy, setGroupBy] = useState("");
  const [useWeights, setUseWeights] = useState(true);
  const [filter, setFilter] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let current = true;
    void getImportedDataset(datasetId).then((result) => {
      if (!current) return;
      if (!result) { setError("This dataset is not available in the current browser. It may have been deleted, or you may be using another device/browser."); return; }
      setDataset(result);
      setVariable(result.mapping.value && result.selectedColumns.includes(result.mapping.value) ? result.mapping.value : result.selectedColumns[0] ?? "");
      const suggestion = result.mapping.group && result.mapping.group !== result.mapping.value ? result.mapping.group : result.mapping.geography;
      setGroupBy(suggestion && suggestion !== result.mapping.value ? suggestion : "");
      setUseWeights(Boolean(result.mapping.weight));
    }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not read local dataset storage.")).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [datasetId]);

  const column = dataset?.columns.find((item) => item.name === variable);
  const numeric = effectiveType(column) === "numeric";
  const weightColumn = useWeights ? dataset?.mapping.weight : undefined;
  const weights = weightColumn ? dataset?.rows.map((row) => row[weightColumn]) : undefined;
  const values = dataset?.rows.map((row) => row[variable]) ?? [];

  const analysis = useMemo(() => {
    if (!dataset || !variable) return null;
    const allValues = dataset.rows.map((row) => row[variable]);
    const allWeights = useWeights && dataset.mapping.weight ? dataset.rows.map((row) => row[dataset.mapping.weight!]) : undefined;
    const distribution = frequencyDistribution(allValues, allWeights);
    const numericSummary = summarizeNumeric(allValues);
    const weightedAvg = allWeights ? weightedMean(allValues, allWeights) : null;
    const grouped = groupBy && groupBy !== variable ? [...new Set(dataset.rows.map((row) => row[groupBy]).filter((value) => !isMissing(value)).map(String))].slice(0, 30).map((group) => {
      const subset = dataset.rows.filter((row) => String(row[groupBy]) === group);
      const groupValues = subset.map((row) => row[variable]);
      const groupWeights = allWeights ? subset.map((row) => row[dataset.mapping.weight!]) : undefined;
      const numericMean = numeric ? (groupWeights ? weightedMean(groupValues, groupWeights) : summarizeNumeric(groupValues).mean) : null;
      const top = frequencyDistribution(groupValues, groupWeights)[0];
      const validCount = groupValues.filter((value) => !isMissing(value)).length;
      return { group, rows: subset.length, validCount, mean: numericMean, topValue: top?.value ?? "—", topPercent: top?.percent ?? null };
    }).sort((a, b) => b.rows - a.rows) : [];
    const missing = allValues.filter(isMissing).length;
    const unique = new Set(allValues.filter((value) => !isMissing(value)).map(String)).size;
    return { distribution, numericSummary, weightedAvg, grouped, missing, unique, valid: allValues.length - missing };
  }, [dataset, variable, groupBy, useWeights, numeric]);

  const filteredDistribution = useMemo(() => {
    const query = filter.trim().toLowerCase();
    const list = analysis?.distribution ?? [];
    return list.filter((item) => !query || `${item.value} ${column?.valueLabels?.[item.value] ?? ""}`.toLowerCase().includes(query)).slice(0, 40);
  }, [analysis, filter, column]);

  const saveCurrentAnalysis = () => {
    if (!dataset || !analysis) return;
    const typeLabel = numeric ? "numeric summary" : "category distribution";
    const summary = numeric
      ? `${variable}: mean ${formatNumber(analysis.numericSummary.mean, 3)}, median ${formatNumber(analysis.numericSummary.median, 3)}, range ${formatNumber(analysis.numericSummary.min, 2)}–${formatNumber(analysis.numericSummary.max, 2)} across ${analysis.numericSummary.validCount.toLocaleString()} non-missing records${weightColumn ? `; weighted mean ${formatNumber(analysis.weightedAvg, 3)}` : " (unweighted)"}.`
      : `${variable}: ${analysis.unique.toLocaleString()} distinct non-missing categories among ${analysis.valid.toLocaleString()} valid records${weightColumn ? "; distribution uses the selected weight column" : " (unweighted)"}.`;
    saveAnalysis({
      title: `${dataset.name} · ${variable}`,
      datasetName: dataset.name,
      source: dataset.sourceOrganization,
      reportingPeriod: dataset.reportingPeriod || "Not specified",
      summary,
      evidence: [
        `Dataset: ${dataset.name} · ${dataset.rowCount.toLocaleString()} records · ${dataset.fileFormat.toUpperCase()}`,
        `Selected variable: ${variable}${column?.label ? ` — ${column.label}` : ""}`,
        `Analysis type: ${typeLabel}${weightColumn ? ` · weight: ${weightColumn}` : " · unweighted"}`,
        `Missing selected-variable values: ${analysis.missing.toLocaleString()} (${formatPercent(dataset.rowCount ? analysis.missing / dataset.rowCount * 100 : 0, 1)})`,
        groupBy ? `Grouped by ${groupBy}; groups over 30 are truncated for this summary.` : "No grouping variable selected.",
      ],
      limitations: [
        "User-uploaded data; the app has not verified that the file is an official source.",
        weightColumn ? "A weight column does not by itself reproduce a complex-survey estimator or design-based uncertainty." : "No survey weights used; estimates are unweighted descriptive summaries.",
        numeric && column?.valueLabels ? "Numeric codes may represent categories; inspect value labels before interpreting the numeric mean." : "Descriptive association is not evidence of causation.",
        ...dataset.metadataNotes,
      ],
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  const exportDistribution = () => {
    if (!analysis || !column || !dataset) return;
    const rows = analysis.distribution.map((item) => ({
      category_code_or_value: item.value,
      category_label: column.valueLabels?.[item.value] ?? item.value,
      count_or_weighted_total: item.count,
      share_percent: item.percent,
      dataset: dataset.name,
      source: dataset.sourceOrganization,
      reporting_period: dataset.reportingPeriod,
      variable: variable,
      weight_column: weightColumn ?? "unweighted",
    }));
    downloadCsv(`${dataset.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${variable}-summary.csv`, rows);
  };

  const removeDataset = async () => {
    if (!dataset || !window.confirm(`Delete “${dataset.name}” and all of its browser-local rows?`)) return;
    await deleteImportedDataset(dataset.id);
    writeDatasetIndex(await listImportedDatasets());
    router.push("/datasets");
  };

  if (loading) return <div className="rounded-2xl border border-border bg-card p-8 text-center text-[12px] text-muted-foreground">Opening the browser-local dataset…</div>;
  if (error || !dataset) return <div className="space-y-4"><div role="alert" className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5 text-[12px] leading-relaxed">{error || "Dataset not found."}</div><Link href="/datasets" className="inline-flex items-center gap-2 text-[11px] font-semibold text-primary hover:underline"><ArrowLeft className="size-4" />Back to datasets</Link></div>;

  const formatDate = new Date(dataset.importedAt).toLocaleString();
  const groupOptions = dataset.selectedColumns.filter((name) => name !== variable);
  const validWeights = weightColumn ? dataset.rows.filter((row) => { const value = parseNumeric(row[weightColumn]); return value !== null && value > 0; }).length : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/datasets" className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground hover:text-primary"><ArrowLeft className="size-3.5" />All datasets</Link>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={saveCurrentAnalysis} className="rounded-xl">{saved ? <ShieldCheck className="mr-1.5 size-3.5 text-primary" /> : <Save className="mr-1.5 size-3.5" />}{saved ? "Saved locally" : "Save analysis"}</Button>
          <Button variant="outline" size="sm" onClick={exportDistribution} className="rounded-xl"><Download className="mr-1.5 size-3.5" />Export summary</Button>
          <Button variant="outline" size="icon" aria-label="Delete dataset" title="Delete dataset" onClick={() => void removeDataset()} className="size-8 rounded-xl text-destructive hover:bg-destructive/5"><Trash2 className="size-3.5" /></Button>
        </div>
      </div>

      <section className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-card p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2"><Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[9px]">User-uploaded · browser-local</Badge><span className="text-[10px] text-muted-foreground">{dataset.fileFormat.toUpperCase()} · {formatBytes(dataset.fileSizeBytes)}</span><Badge variant={dataset.validation.status === "valid" ? "secondary" : "outline"} className="rounded-full text-[9px]">Validation: {dataset.validation.status}</Badge></div>
          <h2 className="mt-3 font-display text-[26px] font-semibold tracking-[-0.03em] sm:text-[31px]">{dataset.name}</h2>
          {dataset.description && <p className="mt-1 text-[11px] text-muted-foreground">{dataset.description}</p>}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground"><span><strong className="font-semibold text-foreground">Source:</strong> {dataset.sourceOrganization}</span><span><strong className="font-semibold text-foreground">Reporting period:</strong> {dataset.reportingPeriod || "Not specified"}</span><span><strong className="font-semibold text-foreground">Imported:</strong> {formatDate}</span></div>
          {dataset.sourceUrl && <a href={dataset.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 break-all text-[10px] font-semibold text-primary hover:underline">Source documentation <ArrowRight className="size-3" /></a>}
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/40 px-3 py-2 text-[10px] font-medium text-muted-foreground"><Database className="size-4 text-primary" />Not transmitted to server</div>
      </section>

      {dataset.validation.issues.length > 0 && <div className="space-y-2">{dataset.validation.issues.map((issue, index) => <div key={`${issue.code}-${index}`} className={`flex gap-2 rounded-xl border p-3 text-[10px] leading-relaxed ${issue.severity === "error" ? "border-destructive/25 bg-destructive/5 text-destructive" : issue.severity === "warning" ? "border-amber-500/25 bg-amber-500/5 text-amber-900 dark:text-amber-200" : "border-border bg-muted/40 text-muted-foreground"}`}><Info className="mt-0.5 size-3.5 shrink-0" />{issue.message}</div>)}</div>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Rows loaded" value={dataset.rowCount.toLocaleString()} foot={`Original file: ${dataset.fileName}`} />
        <Kpi label="Selected columns" value={String(dataset.selectedColumns.length)} foot={`${dataset.sourceVariableCount ? `${dataset.sourceVariableCount.toLocaleString()} source variables · ` : ""}analysis limited to selected fields`} />
        <Kpi label="Missing values" value={dataset.validation.missingCells.toLocaleString()} foot="Across selected columns; not imputed" />
        <Kpi label="Duplicate rows" value={dataset.validation.duplicateRows.toLocaleString()} foot="Detected only; never removed automatically" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,.7fr)]">
        <Card className="rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(20,30,22,.03)]">
          <CardHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-end sm:justify-between">
            <div><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Descriptive analysis</div><CardTitle className="mt-1.5 text-[16px]">Explore a variable</CardTitle></div>
            <div className="flex flex-wrap gap-2">
              <label className="space-y-1 text-[8px] font-semibold text-muted-foreground"><span>Variable</span><select value={variable} onChange={(event) => { setVariable(event.target.value); setSaved(false); }} className="block h-8 max-w-[250px] rounded-lg border border-input bg-background px-2 text-[10px] text-foreground">{dataset.columns.map((item) => <option key={item.name} value={item.name}>{item.name}{item.label ? ` · ${item.label}` : ""}</option>)}</select></label>
              <label className="space-y-1 text-[8px] font-semibold text-muted-foreground"><span>Group by</span><select value={groupBy} onChange={(event) => setGroupBy(event.target.value)} className="block h-8 max-w-[200px] rounded-lg border border-input bg-background px-2 text-[10px] text-foreground"><option value="">No grouping</option>{groupOptions.map((name) => { const item = dataset.columns.find((column) => column.name === name); return <option key={name} value={name}>{name}{item?.label ? ` · ${item.label}` : ""}</option>; })}</select></label>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {column?.label && <p className="text-[10px] text-muted-foreground"><span className="font-semibold text-foreground">Variable label:</span> {column.label}</p>}
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <Kpi label="Valid records" value={(analysis?.valid ?? 0).toLocaleString()} foot={`${formatPercent(dataset.rowCount ? (analysis?.valid ?? 0) / dataset.rowCount * 100 : 0, 1)} of rows`} />
              <Kpi label="Missing" value={(analysis?.missing ?? 0).toLocaleString()} foot="No values imputed" />
              <Kpi label="Distinct values" value={(analysis?.unique ?? 0).toLocaleString()} foot={numeric ? "Numeric variable" : "Categorical distribution"} />
              <Kpi label={numeric ? "Mean" : "Top category"} value={numeric ? formatNumber(analysis?.numericSummary.mean, 3) : displayCellValue(analysis?.distribution[0]?.value ?? "—", column)} foot={numeric ? `Median ${formatNumber(analysis?.numericSummary.median, 3)}` : (column?.valueLabels?.[analysis?.distribution[0]?.value ?? ""] ?? "Most frequent value")} />
            </div>
            {numeric ? (
              <div className="rounded-xl border border-border/70 bg-muted/15 p-4">
                <div className="mb-1 flex items-center justify-between"><div><div className="text-[11px] font-semibold">Numeric distribution</div><p className="mt-0.5 text-[9px] text-muted-foreground">Equal-width bins · descriptive only</p></div><span className="text-[9px] text-muted-foreground">Min {formatNumber(analysis?.numericSummary.min, 2)} · Max {formatNumber(analysis?.numericSummary.max, 2)}</span></div>
                <Histogram values={values} weights={weights} />
                <div className="mt-2 flex justify-between text-[9px] text-muted-foreground"><span>{formatNumber(analysis?.numericSummary.min, 2)}</span><span>{formatNumber(analysis?.numericSummary.max, 2)}</span></div>
                {weightColumn && <div className="mt-3 rounded-lg bg-primary/[0.06] px-3 py-2 text-[9px] text-muted-foreground">Weighted mean: <strong className="text-foreground">{formatNumber(analysis?.weightedAvg, 3)}</strong> · using {weightColumn} · {validWeights.toLocaleString()} positive, numeric weights. This does not reproduce complex-survey variance estimates.</div>}
              </div>
            ) : (
              <div className="rounded-xl border border-border/70 bg-muted/15 p-4">
                <div className="mb-3 flex flex-wrap items-end justify-between gap-2"><div><div className="text-[11px] font-semibold">Category distribution</div><p className="mt-0.5 text-[9px] text-muted-foreground">{weightColumn ? `Weighted using ${weightColumn}` : "Unweighted record count"} · top values shown</p></div><div className="relative"><Input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter categories" className="h-7 w-40 rounded-lg pl-2.5 text-[9px]" /></div></div>
                <div className="max-h-[400px] space-y-2 overflow-y-auto pr-1">
                  {filteredDistribution.map((item) => {
                    const share = item.percent ?? 0;
                    const label = column?.valueLabels?.[item.value] ?? item.value;
                    return <div key={item.value} className="grid grid-cols-[minmax(110px,1fr)_minmax(100px,1.5fr)_70px] items-center gap-3 text-[9px]"><div className="truncate font-medium" title={`${label} (${item.value})`}>{label}</div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary/80" style={{ width: `${Math.min(100, share)}%` }} /></div><div className="text-right tabular-nums text-muted-foreground">{formatPercent(share, 1)}</div></div>;
                  })}
                  {!filteredDistribution.length && <div className="py-8 text-center text-[10px] text-muted-foreground">No categories match this filter.</div>}
                </div>
              </div>
            )}
            {groupBy && analysis?.grouped.length ? (
              <div>
                <div className="mb-2 text-[11px] font-semibold">Summary by {groupBy}</div>
                <div className="overflow-x-auto rounded-xl border border-border/70"><table className="w-full min-w-[510px] border-collapse text-left text-[10px]"><thead className="bg-muted/60 text-[8px] font-bold uppercase tracking-[0.1em] text-muted-foreground"><tr><th className="px-3 py-2.5">Group</th><th className="px-3 py-2.5 text-right">Rows</th><th className="px-3 py-2.5 text-right">Valid</th><th className="px-3 py-2.5 text-right">{numeric ? (weightColumn ? "Weighted mean" : "Mean") : "Most common value"}</th><th className="px-3 py-2.5 text-right">{numeric ? "" : "Share"}</th></tr></thead><tbody>{analysis.grouped.map((row) => { const groupColumnMeta = dataset.columns.find((item) => item.name === groupBy); return <tr key={row.group} className="border-t border-border/60"><td className="px-3 py-2.5 font-medium">{displayCellValue(row.group, groupColumnMeta)}</td><td className="px-3 py-2.5 text-right tabular-nums">{row.rows.toLocaleString()}</td><td className="px-3 py-2.5 text-right tabular-nums">{row.validCount.toLocaleString()}</td><td className="px-3 py-2.5 text-right tabular-nums">{numeric ? formatNumber(row.mean, 3) : displayCellValue(row.topValue, column)}</td><td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{numeric ? "" : formatPercent(row.topPercent, 1)}</td></tr>; })}</tbody></table></div>
                {analysis.grouped.length >= 30 && <p className="mt-2 text-[9px] text-muted-foreground">Showing the 30 largest groups by row count.</p>}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-2xl border-border/80 shadow-none"><CardHeader className="pb-2"><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Mapping & quality</div><CardTitle className="mt-1.5 text-[14px]">What this summary uses</CardTitle></CardHeader><CardContent className="space-y-3 text-[10px] leading-relaxed text-muted-foreground">
            <div><span className="font-semibold text-foreground">Geography:</span> {dataset.mapping.geography ?? "Not mapped"}</div>
            <div><span className="font-semibold text-foreground">Value:</span> {variable || "Not selected"}</div>
            <div><span className="font-semibold text-foreground">Weight:</span> {weightColumn ?? "None; unweighted"}</div>
            <div><span className="font-semibold text-foreground">Comparison group:</span> {groupBy || "Not selected"}</div>
            <div><span className="font-semibold text-foreground">Survey period:</span> {dataset.surveyPeriod || "Not specified"}</div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.045] p-3 text-amber-900 dark:text-amber-200"><TriangleAlert className="mr-1.5 inline size-3.5" />Weights alone are not enough to calculate design-based standard errors, confidence intervals or nationally representative estimates. Consult the source’s strata, cluster and weighting documentation.</div>
            {column?.valueLabels && <div className="rounded-lg bg-muted/45 p-3"><Info className="mr-1.5 inline size-3.5" />Stata value labels are shown where available. Numeric codes with labels are treated as categories to avoid averaging codes.</div>}
            <div className="rounded-lg bg-muted/45 p-3"><ShieldCheck className="mr-1.5 inline size-3.5" />Descriptive association does not establish causation. No missing values are imputed.</div>
          </CardContent></Card>
          <Card className="rounded-2xl border-border/80 shadow-none"><CardContent className="space-y-3 p-4"><div className="flex items-center gap-2 text-[11px] font-semibold"><BarChart3 className="size-4 text-primary" />Validation and provenance</div><div className="text-[10px] leading-relaxed text-muted-foreground">{dataset.validation.issues.length ? `${dataset.validation.issues.length} validation issue(s) recorded; see the notices above.` : "No missing cells or duplicate rows were detected in the selected fields."}</div><div className="text-[9px] leading-relaxed text-muted-foreground">{dataset.metadataNotes.join(" ")}</div>{dataset.sourceUrl && <a href={dataset.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline">Open source documentation <ArrowRight className="size-3" /></a>}</CardContent></Card>
        </div>
      </div>

      <Card className="rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(20,30,22,.03)]"><CardHeader className="pb-2"><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Data preview</div><CardTitle className="mt-1.5 text-[14px]">First 20 stored rows</CardTitle><p className="mt-1 text-[10px] text-muted-foreground">Only selected columns are stored. Value labels are displayed when provided.</p></CardHeader><CardContent className="px-3 pb-4 sm:px-5"><div className="overflow-x-auto rounded-xl border border-border/70"><table className="w-full min-w-[620px] border-collapse text-left text-[9px]"><thead className="bg-muted/60 text-[8px] font-bold uppercase tracking-[0.1em] text-muted-foreground"><tr>{dataset.columns.map((item) => <th key={item.name} className="max-w-[220px] px-2.5 py-2.5"><span className="block truncate" title={item.label}>{item.name}</span>{item.label && <span className="mt-0.5 block truncate font-normal normal-case tracking-normal" title={item.label}>{item.label}</span>}</th>)}</tr></thead><tbody>{dataset.previewRows.map((row, index) => <tr key={index} className="border-t border-border/50 hover:bg-muted/25">{dataset.columns.map((item) => <td key={item.name} className="max-w-[220px] truncate px-2.5 py-2.5" title={displayCellValue(row[item.name], item)}>{displayCellValue(row[item.name], item)}</td>)}</tr>)}</tbody></table></div></CardContent></Card>
    </div>
  );
}
