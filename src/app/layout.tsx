import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: {
    default: "Imibereho Lens · Rwanda development intelligence",
    template: "%s · Imibereho Lens",
  },
  description: "A source-led, interactive prototype for exploring Rwanda's poverty, welfare and financial-inclusion statistics.",
  applicationName: "Imibereho Lens",
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }], shortcut: "/favicon.svg" },
  keywords: ["Rwanda", "EICV7", "poverty", "financial inclusion", "development data", "NISR"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
