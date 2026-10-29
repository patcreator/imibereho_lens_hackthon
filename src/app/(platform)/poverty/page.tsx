import Link from "next/link";
import { MapPinned, Percent, ShieldCheck } from "lucide-react";
import { DistrictChart } from "@/components/charts/district-chart";
import { ProvincePovertyChart } from "@/components/charts/province-poverty-chart";
import { ResidenceChart } from "@/components/charts/residence-chart";
import { RwandaMapLoader } from "@/components/maps/rwanda-map-loader";
import { MetricCard } from "@/components/metric-card";
import { SourceNote } from "@/components/source-note";
import { ExportOfficialPovertyButton } from "@/components/export-official-poverty-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { eicv7 } from "@/lib/data/official";
import { sourceLinks } from "@/lib/data/sources";
import { formatNumber, formatPercent } from "@/lib/utils";

const national = eicv7.monetaryPovertyAreas.find((row) => row.level === "national");
const extreme = eicv7.extremePovertyAreas.find((row) => row.level === "national");
const highestDistrict = [...eicv7.districts].sort((a, b) => (b.monetaryPovertyRate ?? 0) - (a.monetaryPovertyRate ?? 0))[0];
const lowestDistrict = [...eicv7.districts].sort((a, b) => (a.monetaryPovertyRate ?? 0) - (b.monetaryPovertyRate ?? 0))[0];
const sortedDistricts = [...eicv7.districts].sort((a, b) => (b.monetaryPovertyRate ?? 0) - (a.monetaryPovertyRate ?? 0));

export default function PovertyPage() {
  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px]">EICV7 · 2023/24</Badge>
            <span className="text-[10px] font-medium text-muted-foreground">Official NISR published estimates</span>
          </div>
          <h2 className="mt-4 font-display text-[30px] font-semibold tracking-[-0.035em] sm:text-[36px]">Poverty, seen with context.</h2>
          <p className="mt-2 max-w-2xl text-[12px] leading-relaxed text-muted-foreground sm:text-[13px]">Explore the monetary-poverty headcount from national to district level. Point estimates are accompanied by NISR uncertainty measures; district ordering should not be read as a definitive league table.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportOfficialPovertyButton />
          <Link href="/methodology" className="inline-flex h-7 items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 text-[0.8rem] font-medium text-foreground transition hover:bg-muted"><ShieldCheck className="size-3.5" />Definitions & methods</Link>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Monetary poverty" value={national?.monetaryPovertyRate ?? 0} period="EICV7 · 2023/24" source="NISR · Table 9.1" icon={Percent} description={eicv7.methodology.monetaryPoverty} />
        <MetricCard label="Extreme poverty" value={extreme?.extremePovertyRate ?? 0} period="EICV7 · 2023/24" source="NISR · Table 9.2" tone="amber" icon={Percent} description={eicv7.methodology.extremePoverty} />
        <MetricCard label="Highest district estimate" value={highestDistrict?.monetaryPovertyRate ?? 0} period={highestDistrict?.area ?? "—"} source="NISR · Table A9.23" tone="rose" icon={MapPinned} description={`Published estimate for ${highestDistrict?.area ?? "the district"}; 95% CI ${formatPercent(highestDistrict?.confidenceInterval95.lower, 1)}–${formatPercent(highestDistrict?.confidenceInterval95.upper, 1)}. Compare with all districts and their intervals.`} />
        <MetricCard label="Lowest district estimate" value={lowestDistrict?.monetaryPovertyRate ?? 0} period={lowestDistrict?.area ?? "—"} source="NISR · Table A9.23" tone="blue" icon={MapPinned} description={`Published estimate for ${lowestDistrict?.area ?? "the district"}; 95% CI ${formatPercent(lowestDistrict?.confidenceInterval95.lower, 1)}–${formatPercent(lowestDistrict?.confidenceInterval95.upper, 1)}. Compare with all districts and their intervals.`} />
      </div>

      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 px-4 py-3.5 sm:px-5">
        <div className="flex gap-3">
          <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300"><ShieldCheck className="size-4" /></div>
          <div>
            <div className="text-[12px] font-semibold">A measure is not a mechanism.</div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">These are descriptive survey estimates, not evidence that a place or characteristic caused poverty. The monetary measure is distinct from the MPI. See the 95% confidence interval, sampling error and design effect for district estimates.</p>
          </div>
        </div>
      </div>

      <RwandaMapLoader height={460} />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,.9fr)]">
        <ProvincePovertyChart />
        <ResidenceChart />
      </section>

      <Card className="rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(20,30,22,.03)]">
        <CardHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">All 30 districts</div>
            <CardTitle className="mt-1.5 text-[16px]">Published monetary-poverty estimates</CardTitle>
            <p className="mt-1 text-[11px] text-muted-foreground">Ordered by point estimate · uncertainty should temper ranking claims.</p>
          </div>
          <Badge variant="secondary" className="w-fit rounded-full text-[10px]">95% confidence interval shown</Badge>
        </CardHeader>
        <CardContent className="px-3 pb-5 sm:px-5">
          <div className="mb-5 overflow-x-auto">
            <DistrictChart />
          </div>
          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="w-full min-w-[720px] border-collapse text-left text-[11px]">
              <thead className="bg-muted/65 text-[9px] font-bold uppercase tracking-[0.11em] text-muted-foreground">
                <tr><th className="px-3 py-3">District</th><th className="px-3 py-3 text-right">Poverty rate</th><th className="px-3 py-3 text-right">95% CI</th><th className="px-3 py-3 text-right">Std. error</th><th className="px-3 py-3 text-right">CV</th><th className="px-3 py-3 text-right">Design effect</th></tr>
              </thead>
              <tbody>
                {sortedDistricts.map((row, index) => (
                  <tr key={row.area} className="border-t border-border/65 hover:bg-muted/30">
                    <td className="px-3 py-2.5 font-medium"><span className="mr-2 inline-flex size-5 items-center justify-center rounded-md bg-muted text-[9px] text-muted-foreground">{index + 1}</span>{row.area}</td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{formatPercent(row.monetaryPovertyRate, 2)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{formatPercent(row.confidenceInterval95.lower, 2)} – {formatPercent(row.confidenceInterval95.upper, 2)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{formatNumber(row.standardError, 3)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{formatPercent(row.coefficientOfVariation, 2)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{formatNumber(row.designEffect, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">CV is shown as the coefficient of variation in percent; standard error is in percentage points. Values reproduced from NISR Table A9.23 without reweighting or recalculation. The ADM2 boundary file uses a 2012 vintage for visualization only.</p>
        </CardContent>
      </Card>

      <SourceNote title="EICV7 Main Indicators Report 2023/24" source="National Institute of Statistics of Rwanda (NISR)" href={sourceLinks.eicv7Main.url} period="Survey: October 2023–October 2024 · reporting period: 2023/24" note={`Table 9.1 reports the national monetary-poverty estimate of ${formatPercent(national?.monetaryPovertyRate, 1)} (95% CI ${formatPercent(national?.confidenceInterval95.lower, 1)}–${formatPercent(national?.confidenceInterval95.upper, 1)}). District estimates come from Table A9.23. This application reproduces the published aggregates.`} />
    </div>
  );
}
