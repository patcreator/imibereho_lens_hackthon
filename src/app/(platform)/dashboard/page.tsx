import Link from "next/link";
import { Activity, ArrowRight, ArrowUpRight, BookOpen, Database, MapPinned, Sparkles, WalletCards } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { ProvincePovertyChart } from "@/components/charts/province-poverty-chart";
import { ResidenceChart } from "@/components/charts/residence-chart";
import { SourceNote } from "@/components/source-note";
import { Card, CardContent } from "@/components/ui/card";
import { eicv7, finscopeIndicators } from "@/lib/data/official";
import { sourceLinks } from "@/lib/data/sources";
import { formatPercent } from "@/lib/utils";

const poverty = eicv7.monetaryPovertyAreas.find((row) => row.level === "national");
const extreme = eicv7.extremePovertyAreas.find((row) => row.level === "national");
const mpi = eicv7.mpiAreas.find((row) => row.area === "National");
const rural = eicv7.monetaryPovertyAreas.find((row) => row.area === "Rural");
const inclusion = finscopeIndicators.find((row) => row.id === "finscope-any-inclusion");

const quickLinks = [
  { href: "/poverty", title: "Explore poverty", description: "Map district estimates with survey uncertainty.", icon: MapPinned, tag: "EICV7 · 30 districts" },
  { href: "/financial-inclusion", title: "Financial inclusion", description: "Explore access, use and financial health indicators.", icon: WalletCards, tag: "FinScope · 2024" },
  { href: "/datasets", title: "Bring a dataset", description: "Validate a local CSV or Excel file in your browser.", icon: Database, tag: "CSV · XLSX · DTA" },
  { href: "/methodology", title: "Understand the evidence", description: "Definitions, sources, limitations and licence.", icon: BookOpen, tag: "Methods & provenance" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[26px] border border-emerald-950/15 bg-[#173d30] p-6 text-white shadow-[0_12px_40px_rgba(18,61,45,.12)] sm:p-8 lg:p-9">
        <div aria-hidden className="pointer-events-none absolute -right-14 -top-24 size-80 rounded-full border border-white/10" />
        <div aria-hidden className="pointer-events-none absolute -right-4 -top-14 size-56 rounded-full border border-white/10" />
        <div aria-hidden className="pointer-events-none absolute bottom-[-95px] right-[26%] size-56 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(260px,.7fr)] lg:items-end">
          <div>
            <h2 className="mt-6 max-w-3xl font-display text-[34px] font-semibold leading-[1.06] tracking-[-0.04em] sm:text-[43px] lg:text-[50px]">
              See the lived realities behind the numbers.
            </h2>
            <p className="mt-4 max-w-2xl text-[13px] leading-relaxed text-white/75 sm:text-[14px]">
              A transparent starting point for exploring poverty, welfare and financial inclusion in Rwanda. Every published figure keeps its source, period and limitations close at hand.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link href="/poverty" className="inline-flex h-10 items-center rounded-xl bg-[#e7c577] px-4 text-[12px] font-semibold text-[#183629] shadow-none transition hover:bg-[#f0d18b]">
                Explore poverty data <ArrowRight className="ml-2 size-4" />
              </Link>
              <Link href="/methodology" className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/20 px-4 text-[12px] font-semibold text-white hover:bg-white/10">
                How to read this evidence <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </div>
          <div className="relative rounded-2xl border border-white/15 bg-white/[0.07] p-5 backdrop-blur-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/60">National monetary poverty</span>
              <span className="rounded-full bg-emerald-300/15 px-2.5 py-1 text-[9px] font-semibold text-emerald-100">EICV7 · 2023/24</span>
            </div>
            <div className="mt-3 font-display text-[64px] font-semibold leading-none tracking-[-0.055em] sm:text-[72px]">{formatPercent(poverty?.monetaryPovertyRate, 1)}</div>
            <div className="mt-2 text-[11px] text-white/65">Published estimate · 95% CI {formatPercent(poverty?.confidenceInterval95.lower, 1)}–{formatPercent(poverty?.confidenceInterval95.upper, 1)}</div>
            <div className="mt-5 flex items-start gap-3 border-t border-white/15 pt-4">
              <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#e7c577]/15 text-[#f0d18b]"><Activity className="size-4" /></div>
              <p className="text-[11px] leading-relaxed text-white/70">This is a monetary-poverty estimate. Multidimensional poverty is a separate measure—not an alternate label for the same statistic.</p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="snapshot-heading">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">The national snapshot</div>
            <h2 id="snapshot-heading" className="mt-1.5 text-[19px] font-semibold tracking-tight">Five signals</h2>
          </div>
          <span className="text-[10px] text-muted-foreground">Different universes and definitions. Read each source note.</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Monetary poverty" value={poverty?.monetaryPovertyRate ?? 0} period="EICV7 · 2023/24" source="NISR · Table 9.1" icon={Activity} description={eicv7.methodology.monetaryPoverty} />
          <MetricCard label="Extreme poverty" value={extreme?.extremePovertyRate ?? 0} period="EICV7 · 2023/24" source="NISR · Table 9.2" tone="amber" icon={Activity} description={eicv7.methodology.extremePoverty} />
          <MetricCard label="MPI incidence (H)" value={mpi?.mpiIncidence ?? 0} period="EICV7 · 2023/24" source="NISR · Table B.5" tone="blue" icon={Activity} description={eicv7.methodology.mpi} />
          <MetricCard label="Rural monetary poverty" value={rural?.monetaryPovertyRate ?? 0} period="EICV7 · 2023/24" source="NISR · Table 9.1" tone="rose" icon={MapPinned} description="Rural monetary-poverty rate, calculated by NISR as a survey estimate. The confidence interval is available in the poverty explorer." />
          <MetricCard label="Financially included" value={inclusion?.value ?? 0} denominator="of adults aged 16+" digits={0} period="FinScope · 2024" source="AFR · published summary" tone="green" icon={WalletCards} description={inclusion?.definition ?? "FinScope published aggregate. Not equivalent to account ownership."} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,.85fr)]">
        <ProvincePovertyChart />
        <ResidenceChart />
      </section>

      <section aria-labelledby="next-heading">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Continue exploring</div>
            <h2 id="next-heading" className="mt-1.5 text-[19px] font-semibold tracking-tight">From evidence to questions</h2>
          </div>
          <Link href="/ai-insights" className="hidden items-center gap-1.5 text-[11px] font-semibold text-primary hover:underline sm:inline-flex">Try an evidence brief <Sparkles className="size-3.5" /></Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="group block rounded-2xl border border-border/80 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_10px_28px_rgba(20,30,22,.06)] sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-[17px]" /></div>
                  <ArrowUpRight className="size-4 text-muted-foreground transition group-hover:text-primary" />
                </div>
                <div className="mt-4 text-[13px] font-semibold">{item.title}</div>
                <p className="mt-1.5 min-h-9 text-[11px] leading-relaxed text-muted-foreground">{item.description}</p>
                <div className="mt-3 text-[9px] font-semibold uppercase tracking-[0.12em] text-primary/85">{item.tag}</div>
              </Link>
            );
          })}
        </div>
      </section>

      <Card className="rounded-2xl border-border/80 shadow-none">
        <CardContent className="p-4 sm:p-5">
          <SourceNote
            title="EICV7 Main Indicators Report 2023/24 and EICV7 Multidimensional Poverty tables"
            source="National Institute of Statistics of Rwanda (NISR)"
            href={sourceLinks.eicv7Main.url}
            period="Survey: October 2023–October 2024 · reporting period: 2023/24"
            note="Official published aggregates reproduced for this prototype. Values are not re-estimated here. Estimates should be read with their survey design, definitions and confidence intervals. FinScope summary values come from a separate adult survey."
          />
        </CardContent>
      </Card>
    </div>
  );
}
