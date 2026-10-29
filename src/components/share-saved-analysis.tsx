"use client";

import { useEffect, useState } from "react";
import { Copy, ExternalLink, Link2, Loader2, RotateCcw, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SavedAnalysis } from "@/lib/data/saved-analyses";

const tokenKey = (analysisId: string) => `imibereho-lens:share-token:v1:${analysisId}`;

type StoredShare = { id: string; token: string; expiresAt: string };

export function ShareSavedAnalysis({ analysis }: { analysis: SavedAnalysis }) {
  const [share, setShare] = useState<StoredShare | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const raw = window.localStorage.getItem(tokenKey(analysis.id));
      if (!raw) return;
      try { setShare(JSON.parse(raw) as StoredShare); } catch { window.localStorage.removeItem(tokenKey(analysis.id)); }
    }, 0);
    return () => window.clearTimeout(handle);
  }, [analysis.id]);

  const createShare = async () => {
    const confirmed = window.confirm("This will publish the saved summary and listed aggregate context to anyone who has the link for up to 90 days. It does not include raw rows or uploaded files. Do not publish information you consider private. Continue?");
    if (!confirmed) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/shared-analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: analysis.title,
          datasetName: analysis.datasetName,
          source: analysis.source,
          reportingPeriod: analysis.reportingPeriod,
          question: analysis.question ?? "",
          summary: analysis.summary,
          evidence: analysis.evidence.slice(0, 12),
          limitations: analysis.limitations.slice(0, 12),
        }),
      });
      const result = await response.json() as { id?: string; revokeToken?: string; expiresAt?: string; error?: string };
      if (!response.ok || !result.id || !result.revokeToken || !result.expiresAt) throw new Error(result.error ?? "Could not create a public share link.");
      const next = { id: result.id, token: result.revokeToken, expiresAt: result.expiresAt };
      window.localStorage.setItem(tokenKey(analysis.id), JSON.stringify(next));
      setShare(next);
      setMessage("Share created. Anyone with the link can view this note.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Could not create a public share link.");
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    if (!share) return;
    const url = `${window.location.origin}/shared/${share.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
      setMessage("Share link copied.");
    } catch {
      setMessage(url);
    }
  };

  const revoke = async () => {
    if (!share || !window.confirm("Revoke this public link now? Anyone with the link will no longer be able to open it.")) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/shared-analyses/${share.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${share.token}` } });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not revoke the link.");
      window.localStorage.removeItem(tokenKey(analysis.id));
      setShare(null);
      setMessage("Public link revoked.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Could not revoke the link.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 border-t border-border/65 pt-3">
      {share ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <a href={`/shared/${share.id}`} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-2.5 text-[9px] font-semibold text-primary-foreground hover:bg-primary/80"><ExternalLink className="size-3.5" />Open public note</a>
            <Button type="button" size="sm" variant="outline" className="h-8 rounded-lg text-[9px]" onClick={() => void copyLink()}><Copy className="mr-1.5 size-3" />{copied ? "Copied" : "Copy link"}</Button>
            <Button type="button" size="sm" variant="outline" className="h-8 rounded-lg text-[9px] text-destructive" disabled={busy} onClick={() => void revoke()}><RotateCcw className="mr-1.5 size-3" />Revoke</Button>
          </div>
          <div className="text-[9px] leading-relaxed text-muted-foreground">Public link · expires {new Date(share.expiresAt).toLocaleDateString()} · revoke token stored only in this browser.</div>
        </div>
      ) : (
        <Button type="button" size="sm" variant="outline" className="h-8 rounded-lg text-[9px]" disabled={busy} onClick={() => void createShare()}>
          {busy ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : <Share2 className="mr-1.5 size-3.5" />}Publish a public link
        </Button>
      )}
      {message && <p role="status" className="mt-2 break-all text-[9px] leading-relaxed text-muted-foreground">{message}</p>}
      {!share && <p className="mt-1 text-[8px] leading-relaxed text-muted-foreground"><Link2 className="mr-1 inline size-3" />Private by default. Neon required to publish; public share links expire after 90 days.</p>}
    </div>
  );
}
