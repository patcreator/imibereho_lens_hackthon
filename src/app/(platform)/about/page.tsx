import Link from "next/link";
import { ArrowUpRight, BookOpen, Compass, HeartHandshake, Leaf, Target, WalletCards } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SourceNote } from "@/components/source-note";
import { sourceLinks } from "@/lib/data/sources";

const alignment = [
  {
    title: "Poverty reduction & human development",
    icon: Target,
    tag: "SDG 1 · No Poverty",
    source: "EICV7 monetary poverty and MPI aggregates",
    use: "Descriptive welfare and deprivation context. These statistics are not an assessment of NST2 target achievement or programme impact.",
    tone: "text-primary",
  },
  {
    title: "Financial resilience & livelihoods",
    icon: WalletCards,
    tag: "NST2 · Economic Transformation",
    source: "FinScope 2024 national indicators",
    use: "Access, usage and financial-health context for adults aged 16+. The indicators do not measure employment, productivity or a particular intervention’s effect.",
    tone: "text-amber-700 dark:text-amber-300",
  },
  {
    title: "Equity & gender-aware questions",
    icon: HeartHandshake,
    tag: "SDG 5 / SDG 10 · conceptual alignment",
    source: "Geography and selected published breakdowns",
    use: "A starting point for asking distributional questions. A reported gap is not evidence of discrimination, cause, or individual experience.",
    tone: "text-rose-700 dark:text-rose-300",
  },
  {
    title: "Climate and place-based context",
    icon: Leaf,
    tag: "NST2 · cross-cutting context",
    source: "Not currently measured by the bundled poverty / inclusion indicators",
    use: "The platform does not assert a climate-development relationship from the available snapshot. Add a source and documented method before making such a comparison.",
    tone: "text-emerald-700 dark:text-emerald-300",
  },
];

export default function AboutPage() {
  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[26px] border border-border/80 bg-card p-6 sm:p-8 lg:p-9">
        <div className="absolute -right-10 -top-20 size-64 rounded-full bg-primary/5 blur-2xl" />
        <div className="relative max-w-3xl">
          <h2 className="mt-4 font-display text-[31px] font-semibold leading-[1.1] tracking-[-0.04em] sm:text-[40px]">Imibereho Lens makes development evidence easier to navigate.</h2>
          <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground sm:text-[13px]">An independent, source-led prototype to help analysts, researchers and decision-makers explore published Rwanda poverty and financial-inclusion data—with definitions, uncertainty and limitations visible alongside the chart.</p>
          <div className="mt-5 flex flex-wrap gap-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"><span className="rounded-full border border-border bg-muted/40 px-3 py-1.5">Not an official NISR product</span><span className="rounded-full border border-border bg-muted/40 px-3 py-1.5">No causal claims</span><span className="rounded-full border border-border bg-muted/40 px-3 py-1.5">No microdata redistribution</span></div>
        </div>
      </section>

      <section>
        <div className="mb-3"><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Why this prototype exists</div><h2 className="mt-1.5 text-[18px] font-semibold">Build a clearer path from data to questions</h2></div>
        <div className="grid gap-3 md:grid-cols-3">
          {[{ icon: Compass, title: "Explore without flattening", text: "Separate monetary poverty, multidimensional poverty and financial inclusion rather than treating them as one measure." }, { icon: BookOpen, title: "Keep provenance visible", text: "Carry source title, table, reporting period, denominator, method and limitations into visualizations and exports." }, { icon: Target, title: "Ask the next question", text: "Use descriptive summaries and optional AI interpretation to generate hypotheses—not to replace field knowledge, official methods or careful evaluation." }].map((item) => { const Icon = item.icon; return <Card key={item.title} className="rounded-2xl border-border/80 shadow-none"><CardContent className="p-5"><div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4" /></div><div className="mt-3 text-[12px] font-semibold">{item.title}</div><p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">{item.text}</p></CardContent></Card>; })}
        </div>
      </section>

      <section>
        <div className="mb-3"><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Policy context, not endorsement</div><h2 className="mt-1.5 text-[18px] font-semibold">Indicative alignment with national and global priorities</h2><p className="mt-1 text-[10px] text-muted-foreground">The following is an editorial mapping of topics, not official monitoring or an approved indicator crosswalk.</p></div>
        <div className="grid gap-3 md:grid-cols-2">
          {alignment.map((item) => { const Icon = item.icon; return <Card key={item.title} className="rounded-2xl border-border/80 shadow-none"><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div className={`flex size-9 items-center justify-center rounded-xl bg-muted ${item.tone}`}><Icon className="size-4" /></div><Badge variant="outline" className="max-w-[60%] rounded-full text-[8px]">{item.tag}</Badge></div><h3 className="mt-3 text-[12px] font-semibold">{item.title}</h3><div className="mt-2 text-[9px] font-semibold text-muted-foreground">Evidence available: {item.source}</div><p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">{item.use}</p></CardContent></Card>; })}
        </div>
      </section>

      <Card className="rounded-2xl border-border/80 shadow-none"><CardContent className="grid gap-5 p-5 md:grid-cols-2"><div><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">NST2 2024–2029</div><h3 className="mt-2 text-[14px] font-semibold">Three pillars, broader context</h3><p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">The official NST2 programme is organized under Economic Transformation, Social Transformation and Transformational Governance, with cross-cutting priorities. Imibereho Lens offers limited published poverty and financial-access context; it does not score NST2 pillars or evaluate progress.</p><Link href={sourceLinks.nst2.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-semibold text-primary hover:underline">Read the official NST2 programme <ArrowUpRight className="size-3" /></Link></div><div className="rounded-xl bg-muted/45 p-4"><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">UN Sustainable Development Goals</div><p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">SDG 1, 5, 8 and 10 are useful thematic reference points for poverty, gender, livelihoods and inequality. The prototype does not claim that its survey indicators are official SDG series or direct measures of SDG target progress.</p><Link href="https://sdgs.un.org/goals" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-semibold text-primary hover:underline">UN SDG framework <ArrowUpRight className="size-3" /></Link></div></CardContent></Card>

      <SourceNote title="National Strategy for Transformation (NST2), 2024–2029" source="Ministry of Finance and Economic Planning (MINECOFIN)" href={sourceLinks.nst2.url} period="Policy framework · 2024–2029" badge="Policy context" note="Alignment described here is editorial and thematic. No official indicator crosswalk, evaluation, target score or intervention endorsement is implied." />
    </div>
  );
}
