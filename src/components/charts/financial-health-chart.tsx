"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { financialHealth, transactionalAccountBySex } from "@/lib/data/finscope-2024";
import { formatPercent } from "@/lib/utils";

const healthColors = ["#207857", "#9bb47c", "#d49b43", "#b86e55"];

export function FinancialHealthChart() {
  return (
    <Card className="rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(20,30,22,.03)]">
      <CardHeader className="pb-2">
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Financial health</div>
        <CardTitle className="mt-1.5 text-[15px] font-semibold">Published national categories</CardTitle>
        <p className="mt-1 text-[11px] text-muted-foreground">FinScope 2024 · adults aged 16+</p>
      </CardHeader>
      <CardContent className="px-2 pb-4 sm:px-4">
        <div className="h-[228px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={financialHealth} layout="vertical" margin={{ top: 4, right: 25, left: 8, bottom: 4 }} barCategoryGap="32%">
              <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="4 5" />
              <XAxis type="number" domain={[0, 65]} axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} tickFormatter={(value) => `${value}%`} />
              <YAxis type="category" dataKey="group" axisLine={false} tickLine={false} tick={{ fill: "var(--foreground)", fontSize: 10 }} width={128} />
              <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.5 }} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", fontSize: 11 }} formatter={(value) => [formatPercent(Number(value), 0), "Published share"]} />
              <Bar dataKey="value" name="Share" radius={[0, 6, 6, 0]} maxBarSize={15}>
                {financialHealth.map((item, index) => <Cell key={item.group} fill={healthColors[index]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="px-2 text-[10px] leading-relaxed text-muted-foreground">Published rounded categories sum to 101%; the one-point excess is retained as reported and reflects rounding.</p>
        <div className="mt-4 border-t border-border/70 pt-3">
          <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Transactional account uptake by sex</div>
          <div className="grid grid-cols-2 gap-2">
            {transactionalAccountBySex.map((item, index) => (
              <div key={item.group} className="rounded-lg bg-muted/45 px-3 py-2.5">
                <div className="text-[10px] text-muted-foreground">{item.group}</div>
                <div className="mt-0.5 font-display text-[20px] font-semibold tracking-tight">{formatPercent(item.value, 0)}</div>
                <div className="mt-0.5 text-[9px] text-muted-foreground">published summary · {index === 0 ? "women" : "men"}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
