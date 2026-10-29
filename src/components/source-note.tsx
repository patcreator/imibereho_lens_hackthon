import { ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export function SourceNote({
  title,
  source,
  href,
  period,
  note,
  badge = "Official published estimate",
}: {
  title: string;
  source: string;
  href: string;
  period: string;
  note?: string;
  badge?: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/45 p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"><ShieldCheck className="size-3" />{badge}</Badge>
          <span className="text-[10px] font-medium text-muted-foreground">{period}</span>
        </div>
        <div className="mt-2 text-[12px] font-semibold text-foreground">{title}</div>
        <div className="mt-1 text-[11px] text-muted-foreground">Source: {source}</div>
        {note && <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-muted-foreground">{note}</p>}
      </div>
      <Link className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-primary hover:underline" href={href} target="_blank" rel="noreferrer">
        Open source <ExternalLink className="size-3" />
      </Link>
    </div>
  );
}
