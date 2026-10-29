"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { eicv7 } from "@/lib/data/official";
import { formatPercent } from "@/lib/utils";

export function ResidenceChart() {
  const data = ["Urban", "Rural"].map((area) => ({
    area,
    monetary: eicv7.monetaryPovertyAreas.find((row) => row.area === area)?.monetaryPovertyRate ?? 0,
    mpi: eicv7.mpiAreas.find((row) => row.area === area)?.mpiIncidence ?? 0,
  }));
  return (
    <Card className="rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(20,30,22,.03)]">
      <CardHeader className="pb-2">
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Rural / urban</div>
        <CardTitle className="mt-1.5 text-[15px] font-semibold">A sizeable reported gap</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-4 sm:px-4">
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 8, right: 20, left: 12, bottom: 2 }} barCategoryGap="33%">
              <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="4 5" />
              <XAxis type="number" domain={[0, 50]} axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} tickFormatter={(value) => `${value}%`} />
              <YAxis type="category" dataKey="area" axisLine={false} tickLine={false} tick={{ fill: "var(--foreground)", fontSize: 11, fontWeight: 600 }} width={54} />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.6 }}
                contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", fontSize: 11 }}
                formatter={(value, name) => [formatPercent(Number(value), 1), name === "monetary" ? "Monetary poverty" : "MPI incidence"]}
              />
              <Bar dataKey="monetary" name="Monetary poverty" fill="#207857" radius={[0, 6, 6, 0]} maxBarSize={16} />
              <Bar dataKey="mpi" name="MPI incidence" fill="#d49b43" radius={[0, 6, 6, 0]} maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-1 flex justify-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-[#207857]" />Monetary</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-[#d49b43]" />MPI incidence</span>
        </div>
        <p className="mt-3 px-2 text-[10px] leading-relaxed text-muted-foreground">EICV7 urban/rural categories use the report’s 2022 Census definition for current 2024 figures.</p>
      </CardContent>
    </Card>
  );
}
