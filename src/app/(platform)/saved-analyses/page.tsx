"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Bookmark, Download, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { deleteSavedAnalysis, readSavedAnalyses, type SavedAnalysis } from "@/lib/data/saved-analyses";
import { downloadCsv } from "@/lib/utils";
import { ShareSavedAnalysis } from "@/components/share-saved-analysis";

export default function SavedAnalysesPage() {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const handle = window.setTimeout(() => {
      setAnalyses(readSavedAnalyses());
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(handle);
  }, []);

  const remove = (id: string) => setAnalyses(deleteSavedAnalysis(id));
  const exportAll = () => downloadCsv("imibereho-lens-saved-analyses.csv", analyses.map((analysis) => ({
    title: analysis.title,
    created_at: analysis.createdAt,
    dataset: analysis.datasetName,
    source: analysis.source,
    reporting_period: analysis.reportingPeriod,
    summary: analysis.summary,
    evidence: analysis.evidence.join(" | "),
    limitations: analysis.limitations.join(" | "),
  })));

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl"><Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px]">Stored on this browser</Badge><h2 className="mt-4 font-display text-[30px] font-semibold tracking-[-0.035em]">Saved analyses</h2><p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">Short descriptive summaries saved locally for this browser profile. They are not synced to an account or sent to the app server.</p></div>
        {analyses.length > 0 && <Button variant="outline" size="sm" onClick={exportAll} className="w-fit rounded-xl"><Download className="mr-1.5 size-3.5" />Export notes</Button>}
      </section>
      {!loaded ? <div className="rounded-xl border border-border bg-card p-6 text-center text-[11px] text-muted-foreground">Loading local notes…</div> : analyses.length === 0 ? (
        <Card className="rounded-2xl border-dashed border-border shadow-none"><CardContent className="flex flex-col items-center px-5 py-12 text-center"><div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Bookmark className="size-5" /></div><div className="mt-4 text-[14px] font-semibold">Nothing saved yet</div><p className="mt-1 max-w-md text-[11px] leading-relaxed text-muted-foreground">Run a descriptive summary in the dataset explorer or generate an evidence brief, then use “Save analysis” to keep its context and limitations here.</p><Link href="/datasets" className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-3.5 text-[11px] font-semibold text-primary-foreground hover:bg-primary/80">Browse datasets <ArrowRight className="size-3.5" /></Link></CardContent></Card>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {analyses.map((analysis) => (
            <Card key={analysis.id} className="rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(20,30,22,.03)]"><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><FileText className="size-4" /></div><div className="min-w-0"><div className="truncate text-[13px] font-semibold" title={analysis.title}>{analysis.title}</div><div className="mt-1 text-[10px] text-muted-foreground">{analysis.datasetName} · {analysis.source} · {analysis.reportingPeriod}</div></div></div><Button size="icon" variant="ghost" className="size-8 shrink-0 rounded-lg text-muted-foreground hover:text-destructive" aria-label={`Delete ${analysis.title}`} onClick={() => remove(analysis.id)}><Trash2 className="size-3.5" /></Button></div><p className="mt-4 text-[11px] leading-relaxed text-foreground">{analysis.summary}</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-muted/45 p-3"><div className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Evidence context</div><ul className="mt-2 space-y-1.5">{analysis.evidence.slice(0, 4).map((item, index) => <li key={index} className="text-[9px] leading-relaxed text-muted-foreground">• {item}</li>)}</ul></div><div className="rounded-xl bg-amber-500/[0.05] p-3"><div className="text-[9px] font-bold uppercase tracking-[0.12em] text-amber-800 dark:text-amber-300">Limitations</div><ul className="mt-2 space-y-1.5">{analysis.limitations.slice(0, 4).map((item, index) => <li key={index} className="text-[9px] leading-relaxed text-muted-foreground">• {item}</li>)}</ul></div></div><div className="mt-3 text-[9px] text-muted-foreground">Saved {new Date(analysis.createdAt).toLocaleString()}</div><ShareSavedAnalysis analysis={analysis} /></CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}
