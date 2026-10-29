"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Database,
  FileUp,
  Lock,
  MapPinned,
  Scale,
  ShieldCheck,
  Sparkles,
  WalletCards,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: MapPinned,
    title: "Poverty explorer",
    text: "District map of monetary poverty from EICV7 with published confidence intervals.",
    tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: WalletCards,
    title: "Financial inclusion",
    text: "Summary indicators for adults aged 16+.",
    tone: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  {
    icon: FileUp,
    title: "Your own data",
    text: "Import CSV, XLSX or Stata files and get descriptive summaries, right in your browser.",
    tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  {
    icon: Sparkles,
    title: "AI insights",
    text: "Optional AI that interprets selected aggregates. It never sees your uploaded rows.",
    tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
];

const sources = [
  { label: "EICV7 2023/24", detail: "Monetary & extreme poverty (NISR)", dot: "bg-emerald-500" },
  { label: "EICV7 MPI", detail: "Multidimensional poverty, Table B.5", dot: "bg-rose-500" },
  { label: "FinScope 2024", detail: "Published national summaries only", dot: "bg-sky-500" },
  { label: "geoBoundaries", detail: "30 district boundaries (display only)", dot: "bg-violet-500" },
];

export function AboutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="about-title">
      <button className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" aria-label="Close about" onClick={onClose} />

      <div className="relative z-10 flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="relative shrink-0 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent px-6 pb-5 pt-6">
          <Button size="icon" variant="ghost" aria-label="Close" onClick={onClose} className="absolute right-3 top-3">
            <X className="size-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Activity className="size-6" strokeWidth={2.2} />
            </div>
            <div>
              <h2 id="about-title" className="font-display text-xl font-semibold tracking-tight">Imibereho Lens</h2>
              <p className="text-xs font-medium text-muted-foreground">Rwanda poverty & development intelligence</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Explore Rwanda's published poverty and financial-inclusion data through maps and charts, and analyze your own datasets locally, with optional AI to help interpret the results.
          </p>
        </div>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {/* What it does */}
          <section>
            <h3 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              <BarChart3 className="size-3.5" /> What you can do
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {features.map(({ icon: Icon, title, text, tone }) => (
                <div key={title} className="rounded-2xl border border-border/70 bg-card p-4">
                  <div className={`mb-3 flex size-9 items-center justify-center rounded-xl ${tone}`}>
                    <Icon className="size-[18px]" strokeWidth={1.8} />
                  </div>
                  <div className="text-sm font-semibold">{title}</div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Sources */}
          <section>
            <h3 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              <Database className="size-3.5" /> Evidence sources
            </h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {sources.map((s) => (
                <li key={s.label} className="flex items-start gap-3 rounded-xl border border-border/70 bg-card px-3 py-2.5">
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${s.dot}`} />
                  <div>
                    <div className="text-[13px] font-semibold">{s.label}</div>
                    <div className="text-[11px] text-muted-foreground">{s.detail}</div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-card/50 px-6 py-3">
          <Link href="/methodology" onClick={onClose} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            Read full methodology <ArrowRight className="size-3" />
          </Link>
          <Button size="sm" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}