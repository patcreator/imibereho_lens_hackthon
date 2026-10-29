import { ArrowUpRight, Layers3, Scale } from "lucide-react";
import { ProvincePovertyChart } from "@/components/charts/province-poverty-chart";
import { ResidenceChart } from "@/components/charts/residence-chart";
import { SourceNote } from "@/components/source-note";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { eicv7 } from "@/lib/data/official";
import { sourceLinks } from "@/lib/data/sources";
import { formatPercent } from "@/lib/utils";

const areas = ["Rwanda", "Urban", "Rural", "City of Kigali", "Southern", "Western", "Northern", "Eastern"];
const monetary = new Map(eicv7.monetaryPovertyAreas.map((row) => [row.area, row]));
const mpi = new Map(eicv7.mpiAreas.map((row) => [row.area, row]));

export default function DevelopmentGapsPage() {
  return (
    <div className="space-y-7">
      <section className="max-w-3xl">
        <div className="flex flex-wrap items-center gap-2"><Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px]">Descriptive comparison</Badge><span className="text-[10px] text-muted-foreground">Not causal analysis</span></div>
        <h2 className="mt-4 font-display text-[30px] font-semibold tracking-[-0.035em] sm:text-[36px]">Look across measures, carefully.</h2>
        <p className="mt-2 max-w-2xl text-[12px] leading-relaxed text-muted-foreground sm:text-[13px]">Compare the EICV7 monetary-poverty headcount with multidimensional poverty incidence across available geographies. They capture different concepts, use separate methods, and should not be collapsed into a single score.</p>
      </section>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-primary/20 bg-primary/[0.045] p-5">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-primary"><Scale className="size-4" /> Monetary poverty</div>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">NISR’s monetary measure classifies people against the national poverty line based on household consumption. See the poverty profile for the detailed line, welfare aggregate and estimation method.</p>
          <div className="mt-3 text-[10px] text-muted-foreground">EICV7 Main Indicators Report · 2023/24</div>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.045] p-5">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-amber-800 dark:text-amber-300"><Layers3 className="size-4" /> Multidimensional poverty (MPI)</div>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">MPI incidence (H) uses a deprivation-based measure and the report’s k = 33.3% poverty cutoff. It is not interchangeable with the monetary headcount; the report also publishes intensity (A) and M0.</p>
          <div className="mt-3 text-[10px] text-muted-foreground">EICV7 Multidimensional Poverty Report · 2023/24</div>
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(350px,.9fr)]">
        <ProvincePovertyChart />
        <ResidenceChart />
      </section>

      <Card className="rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(20,30,22,.03)]">
        <CardHeader className="pb-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Side-by-side published values</div>
          <CardTitle className="mt-1.5 text-[16px]">Same geography, different definitions</CardTitle>
          <p className="mt-1 text-[11px] text-muted-foreground">No subtraction or ranking is implied by this table.</p>
        </CardHeader>
        <CardContent className="px-3 pb-5 sm:px-5">
          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="w-full min-w-[620px] border-collapse text-left text-[11px]">
              <thead className="bg-muted/65 text-[9px] font-bold uppercase tracking-[0.11em] text-muted-foreground">
                <tr><th className="px-3 py-3">Geography</th><th className="px-3 py-3 text-right">Monetary poverty</th><th className="px-3 py-3 text-right">MPI incidence (H)</th><th className="px-3 py-3 text-right">MPI intensity (A)</th><th className="px-3 py-3 text-right">MPI M0</th></tr>
              </thead>
              <tbody>
                {areas.map((area) => {
                  const monetaryRow = monetary.get(area);
                  const mpiRow = mpi.get(area) ?? mpi.get(area === "Rwanda" ? "National" : area);
                  return <tr key={area} className="border-t border-border/65 hover:bg-muted/30"><td className="px-3 py-3 font-medium">{area}</td><td className="px-3 py-3 text-right font-semibold tabular-nums">{formatPercent(monetaryRow?.monetaryPovertyRate, 1)}</td><td className="px-3 py-3 text-right tabular-nums">{formatPercent(mpiRow?.mpiIncidence, 1)}</td><td className="px-3 py-3 text-right tabular-nums">{formatPercent(mpiRow?.mpiIntensity, 1)}</td><td className="px-3 py-3 text-right tabular-nums">{mpiRow?.mpiM0 === null || mpiRow?.mpiM0 === undefined ? "—" : mpiRow.mpiM0.toFixed(3)}</td></tr>;
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-muted/55 p-4"><div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">How to interpret</div><p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">These indicators describe different dimensions of welfare and are estimated using different constructs. A shared geographic label does not make their denominators or classification rules identical.</p></div>
            <div className="rounded-xl bg-muted/55 p-4"><div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">What this does not show</div><p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">The table does not establish that one deprivation causes another, nor does it rank provinces on a combined welfare score. No district-level MPI value is inferred or imputed.</p></div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.045] px-4 py-4 sm:px-5">
        <div className="flex gap-3"><div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-300"><ArrowUpRight className="size-4" /></div><div><div className="text-[12px] font-semibold">Evidence and national priorities</div><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">NST2 (2024–2029) and Vision 2050 provide policy context; this prototype’s descriptive indicators are not official progress assessments, target values, or endorsements of any intervention. Read the underlying sources and methodology before drawing programme conclusions.</p></div></div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <SourceNote title="EICV7 Main Indicators Report 2023/24" source="NISR" href={sourceLinks.eicv7Main.url} period="Monetary and extreme poverty · Tables 9.1 and 9.2" note="Survey estimates reproduced from official tables; reported uncertainty is available for monetary poverty." />
        <SourceNote title="EICV7 Multidimensional Poverty Thematic Report" source="NISR" href={sourceLinks.eicv7Mpi.url} period="MPI · Table B.5" note="MPI incidence, intensity and M0 are kept distinct from monetary poverty. The district level is not supplied in this prototype." />
      </div>
    </div>
  );
}
