"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Bookmark,
  ChevronRight,
  Database,
  GitCompare,
  Info,
  LayoutDashboard,
  MapPinned,
  Menu,
  Sparkles,
  WalletCards,
  X,
} from "lucide-react";
import { AboutModal } from "@/components/about-modal";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Explore",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/poverty", label: "Poverty explorer", icon: MapPinned },
      { href: "/financial-inclusion", label: "Financial inclusion", icon: WalletCards },
      { href: "/development-gaps", label: "Development gaps", icon: GitCompare },
    ],
  },
  {
    label: "Workspace",
    items: [
      { href: "/datasets", label: "Datasets", icon: Database },
      { href: "/ai-insights", label: "AI insights", icon: Sparkles },
      { href: "/saved-analyses", label: "Saved analyses", icon: Bookmark },
    ],
  },
  {
    label: "About the evidence",
    items: [
      { href: "/methodology", label: "Methodology", icon: BookOpen },
      { href: "/about", label: "About & alignment", icon: Info },
    ],
  },
];

const pageTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/poverty": "Poverty explorer",
  "/financial-inclusion": "Financial inclusion",
  "/development-gaps": "Development gaps",
  "/datasets": "Datasets",
  "/ai-insights": "AI insights",
  "/saved-analyses": "Saved analyses",
  "/methodology": "Methodology",
  "/about": "About & alignment",
};

function NavContent({
  pathname,
  onNavigate,
  onOpenAbout,
}: {
  pathname: string;
  onNavigate?: () => void;
  onOpenAbout: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Fixed top: logo + title */}
      <div className="flex shrink-0 items-center gap-3 px-2 pb-6">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <Activity className="size-5" strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <div className="font-display text-[15px] font-semibold tracking-tight text-foreground">Imibereho Lens</div>
          <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Rwanda · evidence lab</div>
        </div>
      </div>

      {/* Scrollable middle: navigation only */}
      <nav
        aria-label="Main navigation"
        className="nav-scroll -mx-1 min-h-0 flex-1 space-y-7 overflow-y-auto px-1 py-1"
      >
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/75">{group.label}</div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary dark:bg-primary/15"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className={cn("size-[17px] shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} strokeWidth={1.8} />
                    <span className="flex-1">{item.label}</span>
                    {active && <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Fixed bottom: compact About card */}
      <div className="shrink-0 pt-5">
        <button
          type="button"
          onClick={onOpenAbout}
          className="group flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-card p-3 text-left shadow-sm transition hover:border-primary/40 hover:bg-primary/5"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Info className="size-[18px]" strokeWidth={1.8} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] font-semibold text-foreground">About us</span>
            <span className="block truncate text-[11px] text-muted-foreground">What this app does</span>
          </span>
          <ArrowRight className="size-3.5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
        </button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const title = pageTitles[pathname] ?? (pathname.startsWith("/datasets/") ? "Dataset explorer" : pathname.startsWith("/shared/") ? "Shared evidence brief" : "Imibereho Lens");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button className="absolute inset-0 bg-slate-950/35" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-10 flex h-full w-[min(84vw,300px)] flex-col border-r border-border bg-background p-5 shadow-2xl">
            <div className="mb-3 flex shrink-0 items-center justify-end">
              <Button size="icon" variant="ghost" aria-label="Close menu" onClick={() => setMobileOpen(false)}><X className="size-4" /></Button>
            </div>
            <NavContent
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
              onOpenAbout={() => {
                setMobileOpen(false);
                setAboutOpen(true);
              }}
            />
          </aside>
        </div>
      )}

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col border-r border-border/80 bg-background px-4 py-6 md:flex">
        <NavContent pathname={pathname} onOpenAbout={() => setAboutOpen(true)} />
      </aside>

      <div className="min-h-screen md:pl-[252px]">
        <header className="sticky top-0 z-20 border-b border-border/70 bg-background/92 backdrop-blur-sm">
          <div className="mx-auto flex h-[68px] max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <Button className="md:hidden" size="icon" variant="outline" aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
                <Menu className="size-4" />
              </Button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                  <span className="hidden sm:inline">Imibereho Lens</span>
                  <ChevronRight className="hidden size-3 sm:inline" />
                  <span className="truncate text-foreground">{title}</span>
                </div>
                <h1 className="mt-0.5 truncate text-[16px] font-semibold tracking-tight sm:text-[17px]">{title}</h1>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-medium text-muted-foreground sm:flex">
                <span className="size-1.5 rounded-full bg-primary" />
                EICV7 · 2023/24
              </div>
              <ThemeToggle />
              <Link href="/datasets" className="hidden h-7 items-center rounded-xl bg-primary px-3 text-[0.8rem] font-medium text-primary-foreground transition hover:bg-primary/80 sm:inline-flex">
                <Database className="mr-1.5 size-3.5" /> Add data
              </Link>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>

      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}