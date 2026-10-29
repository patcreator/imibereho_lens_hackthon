"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { eicv7 } from "@/lib/data/official";
import { formatPercent } from "@/lib/utils";

export function DistrictChart({ limit }: { limit?: number }) {
  const sorted = [...eicv7.districts].sort((a, b) => (b.monetaryPovertyRate ?? 0) - (a.monetaryPovertyRate ?? 0));
  const data = (limit ? sorted.slice(0, limit) : sorted).map((row) => ({
    area: row.area,
    rate: row.monetaryPovertyRate ?? 0,
    lower: row.confidenceInterval95.lower,
    upper: row.confidenceInterval95.upper,
  }));
  const height = Math.max(340, data.length * 25);
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 22, left: 4, bottom: 5 }} barCategoryGap="20%">
          <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="4 5" />
          <XAxis type="number" domain={[0, 60]} axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} tickFormatter={(value) => `${value}%`} />
          <YAxis type="category" dataKey="area" axisLine={false} tickLine={false} tick={{ fill: "var(--foreground)", fontSize: 10 }} width={94} />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.55 }}
            contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", fontSize: 11 }}
            formatter={(value, _name, item) => {
              const payload = item?.payload as { lower?: number | null; upper?: number | null } | undefined;
              const ci = payload?.lower !== null && payload?.upper !== null ? ` · 95% CI ${formatPercent(payload?.lower, 1)}–${formatPercent(payload?.upper, 1)}` : "";
              return [`${formatPercent(Number(value), 1)}${ci}`, "Monetary poverty"];
            }}
          />
          <Bar dataKey="rate" name="Monetary poverty" fill="#207857" radius={[0, 6, 6, 0]} maxBarSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
