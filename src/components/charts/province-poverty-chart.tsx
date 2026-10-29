"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { provinces, eicv7 } from "@/lib/data/official";
import { formatPercent } from "@/lib/utils";

const chartColors = { monetary: "#207857", mpi: "#d49b43" };

export function ProvincePovertyChart({ compact = false }: { compact?: boolean }) {
  const data = useMemo(() => provinces.map((area) => {
    const monetary = eicv7.monetaryPovertyAreas.find((row) => row.area === area)?.monetaryPovertyRate ?? null;
    const mpi = eicv7.mpiAreas.find((row) => row.area === area)?.mpiIncidence ?? null;
    return {
      area: area === "City of Kigali" ? "Kigali" : area,
      monetary,
      mpi,
    };
  }), []);

  return (
    <Card className="h-full rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(20,30,22,.03)]">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Across Rwanda</div>
          <CardTitle className="mt-1.5 text-[15px] font-semibold">Poverty, by province</CardTitle>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Two official measures · EICV7, 2023/24</p>
        </div>
        <div className="hidden items-center gap-3 pt-1 sm:flex">
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className="size-2 rounded-sm" style={{ backgroundColor: chartColors.monetary }} />Monetary</span>
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className="size-2 rounded-sm" style={{ backgroundColor: chartColors.mpi }} />MPI incidence</span>
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-3 sm:px-4">
        <div className={compact ? "h-[245px]" : "h-[330px]"}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 18, right: 8, left: -12, bottom: 2 }} barGap={4} barCategoryGap="28%">
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 5" />
              <XAxis dataKey="area" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} dy={8} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} domain={[0, 50]} tickFormatter={(value) => `${value}%`} />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.55 }}
                contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", fontSize: 11, boxShadow: "0 8px 24px rgba(0,0,0,.1)" }}
                formatter={(value, name) => [formatPercent(Number(value), 1), name === "monetary" ? "Monetary poverty" : "MPI incidence"]}
                labelStyle={{ color: "var(--foreground)", fontWeight: 600, marginBottom: 4 }}
              />
              <Legend content={() => null} />
              <Bar dataKey="monetary" name="Monetary poverty" fill={chartColors.monetary} radius={[5, 5, 0, 0]} maxBarSize={30} />
              <Bar dataKey="mpi" name="MPI incidence" fill={chartColors.mpi} radius={[5, 5, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pb-2 text-[10px] text-muted-foreground sm:hidden">
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm" style={{ backgroundColor: chartColors.monetary }} />Monetary poverty</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm" style={{ backgroundColor: chartColors.mpi }} />MPI incidence</span>
        </div>
        <p className="px-3 text-[10px] leading-relaxed text-muted-foreground">MPI incidence uses k = 33.3% and is not the same measure as monetary poverty. See definitions and sources.</p>
      </CardContent>
    </Card>
  );
}
