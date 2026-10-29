"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarClock, CircleHelp, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SharedNote = {
  id: string;
  title: string;
  datasetName: string;
  source: string;
  reportingPeriod: string;
  question: string | null;
  summary: string;
  evidence: string[];
  limitations: string[];
  createdAt: string;
  expiresAt: string;
};

export function SharedAnalysisViewer({ id }: { id: string }) {
  const [note, setNote] = useState<SharedNote | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let current = true;
    void fetch(`/api/shared-analyses/${id}`, { cache: "no-store" }).then(async (response) => {
      const payload = await response.json() as SharedNote & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Shared note unavailable.");
      if (current) setNote(payload);
    }).catch((cause: unknown) => { if (current) setError(cause instanceof Error ? cause.message : "Shared note unavailable."); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [id]);

  if (loading) return <div className="rounded-2xl border border-border bg-card p-8 text-center text-[11px] text-muted-foreground">Loading public note…</div>;
  if (error || !note) return <div className="space-y-4"><div role="alert" className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5 text-[11px] leading-relaxed text-muted-foreground">{error || "Shared note not found."}</div><Link href="/saved-analyses" className="inline-flex items-center gap-2 text-[10px] font-semibold text-primary hover:underline"><ArrowLeft className="size-3.5" />Saved analyses</Link></div>;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground hover:text-primary"><ArrowLeft className="size-3.5" />Imibereho Lens</Link>
      <Card className="rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(20,30,22,.03)]">
        <CardHeader className="pb-3"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="rounded-full text-[9px]">Public, opt-in aggregate note</Badge><Badge variant="secondary" className="rounded-full text-[9px]">No raw rows</Badge></div><CardTitle className="mt-2 text-[20px]">{note.title}</CardTitle><div className="mt-1 text-[10px] text-muted-foreground">{note.datasetName} · {note.source} · {note.reportingPeriod}</div></CardHeader>
        <CardContent className="space-y-4">
          {note.question && <div className="rounded-xl bg-muted/40 p-3 text-[10px] leading-relaxed"><span className="font-semibold">Question:</span> {note.question}</div>}
          <div className="whitespace-pre-wrap rounded-xl border border-border/70 bg-card p-4 text-[11px] leading-relaxed">{note.summary}</div>
          <div className="grid gap-3 md:grid-cols-2"><div className="rounded-xl bg-muted/45 p-4"><div className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Evidence & provenance</div><ul className="mt-2 space-y-1.5">{note.evidence.map((item, index) => <li key={index} className="text-[9px] leading-relaxed text-muted-foreground">• {item}</li>)}</ul></div><div className="rounded-xl bg-amber-500/[0.05] p-4"><div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-amber-800 dark:text-amber-300"><CircleHelp className="size-3" />Limitations</div><ul className="mt-2 space-y-1.5">{note.limitations.map((item, index) => <li key={index} className="text-[9px] leading-relaxed text-muted-foreground">• {item}</li>)}</ul></div></div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3 text-[9px] text-muted-foreground"><span className="inline-flex items-center gap-1.5"><CalendarClock className="size-3.5" />Created {new Date(note.createdAt).toLocaleString()} · expires {new Date(note.expiresAt).toLocaleDateString()}</span><span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-primary" />Anyone with this link can view this note.</span></div>
        </CardContent>
      </Card>
    </div>
  );
}
