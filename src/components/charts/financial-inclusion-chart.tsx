"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { finscopeIndicators } from "@/lib/data/finscope-2024";
import { formatPercent } from "@/lib/utils";

const palette = ["#207857", "#529576", "#83b496", "#d49b43", "#c4a16d", "#aab2a7", "#7b9488"];

export function FinancialInclusionChart() {
  const data = finscopeIndicators.map((indicator) => ({
    name: indicator.name.replace(" in own name", ""),
    value: indicator.value,
    id: indicator.id,
    definition: indicator.definition,
  }));
  return (
    <Card className="rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(20,30,22,.03)]">
      <CardHeader className="pb-2">
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Financial access & use</div>
        <CardTitle className="mt-1.5 text-[15px] font-semibold">FinScope 2024, national summary</CardTitle>
        <p className="mt-1 text-[11px] text-muted-foreground">Published shares of adults aged 16+</p>
      </CardHeader>
      <CardContent className="px-2 pb-4 sm:px-4">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 22, left: 10, bottom: 4 }} barCategoryGap="30%">
              <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="4 5" />
              <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} tickFormatter={(value) => `${value}%`} />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--foreground)", fontSize: 10 }} width={150} />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.55 }}
                contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", fontSize: 11, maxWidth: 280 }}
                formatter={(value, _name, item) => [formatPercent(Number(value), 0), (item?.payload as { definition?: string } | undefined)?.definition ?? "Published rate"]}
              />
              <Bar dataKey="value" name="Share" radius={[0, 6, 6, 0]} maxBarSize={16}>
                {data.map((item, index) => <Cell key={item.id} fill={palette[index % palette.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="px-2 text-[10px] leading-relaxed text-muted-foreground">Indicators have distinct definitions and are not additive. The broad 96% inclusion figure is not account ownership.</p>
      </CardContent>
    </Card>
  );
}
