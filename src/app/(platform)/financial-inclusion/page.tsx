import Link from "next/link";
import { ArrowUpRight, CreditCard, HeartPulse, ShieldCheck, Smartphone, WalletCards } from "lucide-react";
import { FinancialHealthChart } from "@/components/charts/financial-health-chart";
import { FinancialInclusionChart } from "@/components/charts/financial-inclusion-chart";
import { MetricCard } from "@/components/metric-card";
import { SourceNote } from "@/components/source-note";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { finscopeIndicators, finscopeSource } from "@/lib/data/finscope-2024";
import { sourceLinks } from "@/lib/data/sources";

const indicator = (id: string) => finscopeIndicators.find((item) => item.id === id)?.value ?? 0;

export default function FinancialInclusionPage() {
  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2"><Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px]">FinScope Rwanda · 2024</Badge><span className="text-[10px] font-medium text-muted-foreground">Published national summaries</span></div>
          <h2 className="mt-4 font-display text-[30px] font-semibold tracking-[-0.035em] sm:text-[36px]">Access is more than an account.</h2>
          <p className="mt-2 max-w-2xl text-[12px] leading-relaxed text-muted-foreground sm:text-[13px]">Explore a small set of published indicators about financial access, use and reported financial health. Each has its own definition; these percentages are not components of a single additive total.</p>
        </div>
        <Link href={sourceLinks.finscopeCatalog.url} target="_blank" rel="noreferrer" className="inline-flex h-9 w-fit items-center gap-2 rounded-xl border border-border bg-card px-3 text-[11px] font-semibold transition hover:bg-muted">NISR microdata catalog <ArrowUpRight className="size-3.5" /></Link>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Financially included" value={indicator("finscope-any-inclusion")} denominator="of adults aged 16+" digits={0} period="FinScope · 2024" source="AFR · published summary" icon={WalletCards} description="Report-defined broad financial inclusion, including direct or indirect access. This is not the same as individual bank-account ownership." />
        <MetricCard label="Own or used mobile money" value={indicator("finscope-mobile-money-use")} denominator="of adults aged 16+" digits={0} period="FinScope · 2024" source="AFR · published summary" tone="blue" icon={Smartphone} description="Published share of eligible adults who own or have used mobile money. This differs from having a registered wallet in one’s own name." />
        <MetricCard label="Bank account uptake" value={indicator("finscope-bank-account")} denominator="of adults aged 16+" digits={0} period="FinScope · 2024" source="AFR · published summary" tone="amber" icon={CreditCard} description="Published share of eligible adults reported as having a bank account; separate from broad financial inclusion." />
        <MetricCard label="Financially healthy" value={10} denominator="of adults aged 16+" digits={0} period="FinScope · 2024" source="AFR · published summary" tone="rose" icon={HeartPulse} description="One published category in the report’s financial-health classification. Other rounded shares are 57% coping, 31% vulnerable and 3% extremely vulnerable; due to rounding, the categories sum to 101%." />
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/[0.045] px-4 py-4 sm:px-5">
        <div className="flex gap-3"><div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><ShieldCheck className="size-4" /></div><div><div className="text-[12px] font-semibold">Survey universe and scope matter.</div><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">FinScope 2024 covers eligible adults aged 16+ living in private households. These are national summary indicators—not district-representative estimates. This app does not bundle or redistribute the respondent-level file. See the NISR catalog for access terms and metadata.</p></div></div>
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,.85fr)]">
        <FinancialInclusionChart />
        <FinancialHealthChart />
      </section>

      <Card className="rounded-2xl border-border/80 shadow-none">
        <CardContent className="p-4 sm:p-5">
          <SourceNote
            title={finscopeSource.name}
            source="Access to Finance Rwanda (AFR); metadata record in the NISR Microdata Catalog"
            href={sourceLinks.finscope.url}
            period="2024 · national survey · adults aged 16+"
            badge="Published summary indicator"
            note="Figures are reproduced as published summary values and were not recalculated from respondent-level microdata. FinScope is separate from EICV7; its adult denominator differs from population-level poverty estimates. The project does not contain the raw FinScope file."
          />
        </CardContent>
      </Card>
      <div className="text-[10px] leading-relaxed text-muted-foreground">Report and catalog: <Link className="font-semibold text-primary hover:underline" href={sourceLinks.finscope.url} target="_blank" rel="noreferrer">AFR FinScope 2024 page</Link> · <Link className="font-semibold text-primary hover:underline" href={sourceLinks.finscopeCatalog.url} target="_blank" rel="noreferrer">NISR Microdata Catalog</Link>. Summary values should be checked against the full report for exact wording and context before external use.</div>
    </div>
  );
}
