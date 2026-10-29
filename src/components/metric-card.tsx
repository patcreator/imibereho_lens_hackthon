import type { LucideIcon } from "lucide-react";
import { Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatPercent } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  unit = "percent",
  denominator = "of population",
  digits = 1,
  period,
  source,
  description,
  icon: Icon,
  tone = "green",
}: {
  label: string;
  value: number | string;
  unit?: "percent" | "number" | "text";
  denominator?: string;
  digits?: number;
  period: string;
  source: string;
  description: string;
  icon?: LucideIcon;
  tone?: "green" | "amber" | "blue" | "rose";
}) {
  const color = {
    green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/45 dark:text-amber-300",
    blue: "bg-sky-50 text-sky-700 dark:bg-sky-950/45 dark:text-sky-300",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-950/45 dark:text-rose-300",
  }[tone];
  const formattedValue = typeof value === "number"
    ? unit === "percent" ? formatPercent(value, digits) : new Intl.NumberFormat("en-RW").format(value)
    : value;

  return (
    <Card className="group rounded-2xl border-border/80 bg-card shadow-[0_1px_2px_rgba(20,30,22,.03)] transition-shadow hover:shadow-[0_10px_28px_rgba(20,30,22,.06)]">
      <CardContent className="p-5 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
              <span className="line-clamp-2 leading-tight">{label}</span>
              <span className="group/tip relative inline-flex shrink-0" tabIndex={0} aria-label={description}>
                <Info className="size-3.5 opacity-55" />
                <span className="pointer-events-none absolute left-0 top-6 z-20 hidden w-60 rounded-xl border border-border bg-popover p-3 text-[11px] leading-relaxed text-popover-foreground shadow-lg group-hover/tip:block group-focus/tip:block">{description}</span>
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-[32px] font-semibold tracking-[-0.04em] text-foreground sm:text-[34px]">{formattedValue}</span>
              {unit === "percent" && <span className="text-[11px] font-medium text-muted-foreground">{denominator}</span>}
            </div>
          </div>
          {Icon && <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${color}`}><Icon className="size-[18px]" strokeWidth={1.8} /></div>}
        </div>
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/70 pt-3 text-[10px]">
          <span className="font-semibold text-muted-foreground">{period}</span>
          <span className="inline-flex min-w-0 items-center gap-1 truncate text-muted-foreground" title={source}>
            <span className="size-1.5 shrink-0 rounded-full bg-primary/70" />{source}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
