"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="size-9 rounded-xl border-border/80 bg-card text-muted-foreground hover:text-foreground"
      aria-label="Toggle color theme"
      title={mounted ? `Switch to ${isDark ? "light" : "dark"} mode` : "Toggle color theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {mounted && !isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </Button>
  );
}