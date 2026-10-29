"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, Check, CircleHelp, FileText, LockKeyhole, Save, Send, Sparkles, Trash2, TriangleAlert, User } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { officialIndicators } from "@/lib/data/official";
import { saveAnalysis } from "@/lib/data/saved-analyses";
import { formatPercent } from "@/lib/utils";
import type { IndicatorSource } from "@/lib/data/types";

const initialIds = ["eicv7-monetary-poverty", "eicv7-extreme-poverty", "eicv7-mpi-incidence", "finscope-any-inclusion"];

const suggestions = [
  "Describe the key differences between these indicators and list the interpretation caveats.",
  "Can I compare monetary poverty and multidimensional poverty directly?",
  "What should I check before quoting these numbers?",
];

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  kind?: "ai" | "local" | "error";
  question?: string;
  indicators?: IndicatorSource[];
};

function buildLocalNote(indicators: IndicatorSource[], question: string) {
  const bullets = indicators.map((item) => `- **${item.name}**: ${item.valueLabel ?? formatPercent(item.value, 1)} (${item.geography}; ${item.reportingPeriod}; ${item.sourceOrganization}; ${item.sourceTitle}). ${item.definition}`);
  const sourceWarnings = indicators.flatMap((item) => item.limitations ?? []);
  const distinctPeriods = [...new Set(indicators.map((item) => item.reportingPeriod))];
  const periodsNote = distinctPeriods.length > 1 ? `The selected sources cover different reporting periods (${distinctPeriods.join(", ")}); they should not be treated as a single contemporaneous measurement.` : "The selected source context is limited to the listed reporting period(s).";
  return [
    "### Local evidence note",
    "*Deterministic summary, not AI-generated.*",
    "",
    `**Question:** ${question}`,
    "",
    "**Published values provided**",
    "",
    ...bullets,
    "",
    "**Interpretation guardrails**",
    "",
    "- Monetary poverty and MPI incidence have distinct definitions and are not interchangeable.",
    "- FinScope percentages refer to adults aged 16+, unlike population-level EICV7 poverty figures.",
    `- ${periodsNote}`,
    "- Differences are descriptive; they do not establish a cause or effect.",
    ...sourceWarnings.slice(0, 3).map((item) => `- Source limitation: ${item}`),
  ].join("\n");
}

// Styled Markdown elements (no Tailwind typography plugin needed)
const markdownComponents: Components = {
  h1: ({ children }) => <h3 className="mb-2 mt-3 text-[13px] font-semibold first:mt-0">{children}</h3>,
  h2: ({ children }) => <h3 className="mb-2 mt-3 text-[13px] font-semibold first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="mb-1.5 mt-3 text-[12px] font-semibold first:mt-0">{children}</h4>,
  h4: ({ children }) => <h4 className="mb-1.5 mt-3 text-[12px] font-semibold first:mt-0">{children}</h4>,
  p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="my-2 list-disc space-y-1.5 pl-5 marker:text-primary/60">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal space-y-1.5 pl-5 marker:text-primary/60">{children}</ol>,
  li: ({ children }) => <li className="pl-0.5">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
  a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer noopener" className="font-medium text-primary underline underline-offset-2">{children}</a>,
  code: ({ children }) => <code className="rounded bg-background/70 px-1 py-0.5 font-mono text-[10px]">{children}</code>,
  blockquote: ({ children }) => <blockquote className="my-2 border-l-2 border-primary/40 pl-3 text-muted-foreground">{children}</blockquote>,
  hr: () => <hr className="my-3 border-border/70" />,
  table: ({ children }) => <div className="my-2 overflow-x-auto"><table className="w-full border-collapse text-[10px]">{children}</table></div>,
  th: ({ children }) => <th className="border border-border/70 bg-background/60 px-2 py-1 text-left font-semibold">{children}</th>,
  td: ({ children }) => <td className="border border-border/70 px-2 py-1 align-top">{children}</td>,
};

export default function AiInsightsPage() {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const selected = useMemo(() => officialIndicators.filter((item) => selectedIds.includes(item.id)), [selectedIds]);

  // Keep the newest message in view (scrolls the chat box only, not the whole page)
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const toggle = (id: string) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 16 ? [...current, id] : current);
    setFormError("");
  };

  const newId = () => crypto.randomUUID();

  const validate = (question: string) => {
    if (!selected.length) { setFormError("Select at least one published indicator first."); return false; }
    if (question.trim().length < 5) { setFormError("Write a question of at least five characters."); return false; }
    setFormError("");
    return true;
  };

  const askAi = async (rawQuestion?: string) => {
    const question = (rawQuestion ?? input).trim();
    if (busy || !validate(question)) return;
    const indicators = selected;
    setInput("");
    setMessages((m) => [...m, { id: newId(), role: "user", content: question }]);
    setBusy(true);
    try {
      const response = await fetch("/api/ai/interpretation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          indicators: indicators.map((item) => ({
            name: item.name,
            value: item.value,
            unit: item.unit,
            geography: item.geography,
            period: item.reportingPeriod,
            source: `${item.sourceOrganization} · ${item.sourceTitle}${item.sourceFile ? ` · ${item.sourceFile}` : ""}`,
            definition: item.definition,
            limitations: item.limitations ?? [],
          })),
          aggregates: [],
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { interpretation?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? `Request failed with status ${response.status}.`);
      if (!payload.interpretation) throw new Error("The AI service returned no interpretation.");
      setMessages((m) => [...m, { id: newId(), role: "assistant", kind: "ai", content: payload.interpretation!, question, indicators }]);
    } catch (cause) {
      setMessages((m) => [...m, { id: newId(), role: "assistant", kind: "error", content: cause instanceof Error ? cause.message : "The AI service is unavailable." }]);
    } finally {
      setBusy(false);
    }
  };

  const makeLocalNote = () => {
    const question = input.trim() || "Summarize the selected indicators and their caveats.";
    if (busy || !validate(question)) return;
    const indicators = selected;
    setInput("");
    setMessages((m) => [
      ...m,
      { id: newId(), role: "user", content: question },
      { id: newId(), role: "assistant", kind: "local", content: buildLocalNote(indicators, question), question, indicators },
    ]);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void askAi();
    }
  };

  const saveMessage = (message: ChatMessage) => {
    const indicators = message.indicators ?? [];
    saveAnalysis({
      title: message.kind === "ai" ? "AI evidence interpretation" : "Local evidence note",
      datasetName: indicators.map((item) => item.name).join("; ").slice(0, 110),
      source: [...new Set(indicators.map((item) => item.sourceOrganization))].join("; "),
      reportingPeriod: [...new Set(indicators.map((item) => item.reportingPeriod))].join("; "),
      question: message.question ?? "",
      summary: message.content,
      evidence: indicators.map((item) => `${item.name}: ${item.valueLabel ?? formatPercent(item.value, 1)} · ${item.geography} · ${item.reportingPeriod} · ${item.sourceTitle}`),
      limitations: [
        message.kind === "ai" ? "AI-generated interpretation; it is not an observed statistic, official recommendation, or substitute for the cited report." : "Deterministic local evidence note; it is not an AI interpretation or a statistical model.",
        "Selected indicators may use different populations, definitions, geographies, or survey periods.",
        "Descriptive patterns do not establish causation.",
        ...indicators.flatMap((item) => item.limitations ?? []).slice(0, 5),
      ],
    });
    setSavedId(message.id);
    window.setTimeout(() => setSavedId((current) => (current === message.id ? null : current)), 2200);
  };

  return (
    <div className="space-y-7">
      <section className="max-w-3xl">
        <h2 className="mt-4 font-display text-[30px] font-semibold tracking-[-0.035em] sm:text-[36px]">Ask a better question of the evidence.</h2>
        <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground sm:text-[13px]">Chat with the selected indicators using server-side Groq interpretation, or generate a deterministic local note without AI. Only the indicators you select and your question are sent; no uploaded respondent-level rows are accepted by the AI endpoint.</p>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,.9fr)_minmax(360px,1fr)]">
        {/* Left: evidence picker + privacy */}
        <div className="space-y-4">
          <Card className="rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(20,30,22,.03)]">
            <CardHeader className="pb-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Step 1 · Choose evidence</div>
              <CardTitle className="mt-1.5 text-[16px]">Select source-labeled indicators</CardTitle>
              <p className="mt-1 text-[10px] text-muted-foreground">{selected.length} selected · at least one, up to 16. Values, definitions and limitations are included in each request.</p>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {officialIndicators.map((item) => {
                const active = selectedIds.includes(item.id);
                return (
                  <button key={item.id} type="button" aria-pressed={active} onClick={() => toggle(item.id)} className={`rounded-xl border p-3 text-left transition ${active ? "border-primary/45 bg-primary/[0.045]" : "border-border/70 bg-card hover:bg-muted/35"}`}>
                    <span className="flex items-start gap-2.5">
                      <span className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}>{active && <Check className="size-3" />}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11px] font-semibold">{item.name}</span>
                        <span className="mt-1 block text-[9px] leading-relaxed text-muted-foreground">{item.valueLabel ?? formatPercent(item.value, 1)} · {item.geography} · {item.reportingPeriod}</span>
                        <span className="mt-1 block truncate text-[8px] text-muted-foreground">{item.sourceTitle}</span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/80 shadow-none">
            <CardContent className="space-y-2.5 p-4 text-[10px] leading-relaxed text-muted-foreground">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-foreground"><LockKeyhole className="size-4 text-primary" />Privacy & guardrails</div>
              <p>AI requests contain a short question and selected aggregate values/metadata only; raw rows, uploaded files and API credentials are not sent from this browser to Groq. The server endpoint validates a small schema, limits requests and forwards only selected evidence.</p>
              <p>AI prose can be wrong. It must not invent citations, treat poverty measures as equivalent, or claim causation. Verify every factual claim against the linked source.</p>
            </CardContent>
          </Card>
        </div>

        {/* Right: chat */}
        <Card className="flex h-[680px] flex-col rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(20,30,22,.03)] xl:sticky xl:top-4">
          <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border/70 pb-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Step 2 · Ask</div>
              <CardTitle className="mt-1 text-[15px]">Evidence chat</CardTitle>
            </div>
            {messages.length > 0 && (
              <Button type="button" size="sm" variant="ghost" className="h-8 rounded-xl text-[10px]" onClick={() => { setMessages([]); setFormError(""); }}>
                <Trash2 className="mr-1.5 size-3.5" />Clear chat
              </Button>
            )}
          </CardHeader>

          <CardContent className="flex min-h-0 flex-1 flex-col p-0">
            {/* Message thread */}
            <div ref={threadRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {messages.length === 0 && !busy && (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary"><Sparkles className="size-5" /></div>
                  <p className="max-w-xs text-[11px] leading-relaxed text-muted-foreground">Ask about the {selected.length} selected indicator{selected.length === 1 ? "" : "s"}, or try one of these:</p>
                  <div className="flex max-w-sm flex-col gap-2">
                    {suggestions.map((text) => (
                      <button key={text} type="button" disabled={busy} onClick={() => void askAi(text)} className="rounded-xl border border-border/70 bg-card px-3 py-2 text-left text-[10px] leading-relaxed transition hover:bg-muted/40 disabled:opacity-50">{text}</button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message) => {
                if (message.role === "user") {
                  return (
                    <div key={message.id} className="flex items-start justify-end gap-2">
                      <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2.5 text-[11px] leading-relaxed text-primary-foreground">{message.content}</div>
                      <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted"><User className="size-3.5" /></div>
                    </div>
                  );
                }
                const isError = message.kind === "error";
                return (
                  <div key={message.id} className="flex items-start gap-2">
                    <div className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${isError ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" : "bg-primary/10 text-primary"}`}>
                      {isError ? <TriangleAlert className="size-3.5" /> : message.kind === "local" ? <FileText className="size-3.5" /> : <Bot className="size-3.5" />}
                    </div>
                    <div className="min-w-0 max-w-[92%] space-y-2">
                      <div className={`rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-[11px] leading-relaxed ${isError ? "border border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-200" : "bg-muted/45"}`}>
                        {isError ? <span role="alert">{message.content}</span> : <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{message.content}</ReactMarkdown>}
                      </div>
                      {!isError && (
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={message.kind === "ai" ? "outline" : "secondary"} className="rounded-full text-[8px]">
                            {message.kind === "ai" ? "AI-generated · not official evidence" : "Deterministic local note"}
                          </Badge>
                          <Button type="button" size="sm" variant="ghost" className="h-6 rounded-lg px-2 text-[9px]" onClick={() => saveMessage(message)}>
                            {savedId === message.id ? <Check className="mr-1 size-3 text-primary" /> : <Save className="mr-1 size-3" />}
                            {savedId === message.id ? "Saved" : "Save note"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {busy && (
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Bot className="size-3.5" /></div>
                  <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted/45 px-3.5 py-3" aria-label="Groq is thinking">
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
                  </div>
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="border-t border-border/70 p-3">
              {formError && (
                <div role="alert" className="mb-2 rounded-lg border border-amber-500/25 bg-amber-500/5 p-2.5 text-[10px] leading-relaxed text-amber-900 dark:text-amber-200">
                  <TriangleAlert className="mr-1.5 inline size-3.5" />{formError}
                </div>
              )}
              <label htmlFor="evidence-question" className="sr-only">Question about selected evidence</label>
              <div className="flex items-end gap-2">
                <textarea
                  id="evidence-question"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={onKeyDown}
                  maxLength={800}
                  rows={2}
                  className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-[11px] leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Ask about the selected evidence… (Enter to send, Shift+Enter for a new line)"
                />
                <Button type="button" onClick={() => void askAi()} disabled={busy || !selected.length || input.trim().length < 5} className="h-[44px] rounded-xl px-4" aria-label="Send question">
                  <Send className="size-4" />
                </Button>
              </div>
              <div className="mt-2 flex items-center justify-between text-[9px] text-muted-foreground">
                <button type="button" onClick={makeLocalNote} disabled={busy || !selected.length} className="font-medium underline-offset-2 hover:underline disabled:opacity-50">Generate local note (no AI)</button>
                <span>{input.length}/800 · questions are not treated as a source</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-3 text-[9px] leading-relaxed text-muted-foreground">
        <CircleHelp className="mt-0.5 size-3.5 shrink-0 text-amber-700 dark:text-amber-300" />
        Interpretation only. The selected report values and their metadata are the evidence; check source definitions and sampling context before reuse.
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {selected.slice(0, 4).map((item) => (
          <MetricCard key={item.id} label={item.name} value={item.value} denominator={item.unit === "percent of adults aged 16+" ? "of adults aged 16+" : "of population"} digits={item.valueLabel?.includes(".") ? 1 : 0} period={item.reportingPeriod} source={item.sourceOrganization} description={item.definition} tone={item.id.includes("mpi") ? "amber" : "green"} />
        ))}
      </div>
    </div>
  );
}