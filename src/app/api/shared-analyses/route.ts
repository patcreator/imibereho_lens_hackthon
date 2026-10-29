import { createHash, randomBytes, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase } from "@/lib/db";
import { lt } from "drizzle-orm";
import { sharedAnalyses } from "@/lib/db/schema";

export const runtime = "nodejs";

const ShareSchema = z.object({
  title: z.string().trim().min(1).max(160),
  datasetName: z.string().trim().min(1).max(160),
  source: z.string().trim().min(1).max(300),
  reportingPeriod: z.string().trim().min(1).max(100),
  question: z.string().trim().max(800).optional(),
  summary: z.string().trim().min(1).max(4_000),
  evidence: z.array(z.string().trim().min(1).max(300)).max(12),
  limitations: z.array(z.string().trim().min(1).max(400)).max(12),
}).strict();

type Limit = { windowStarted: number; count: number };
const requests = new Map<string, Limit>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 4;
const SHARE_TTL_DAYS = 90;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
}

function rateLimited(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const now = Date.now();
  const previous = requests.get(ip);
  if (!previous || now - previous.windowStarted >= WINDOW_MS) {
    requests.set(ip, { windowStarted: now, count: 1 });
    if (requests.size > 2_000) for (const [key, item] of requests) if (now - item.windowStarted >= WINDOW_MS) requests.delete(key);
    return false;
  }
  if (previous.count >= MAX_REQUESTS) return true;
  previous.count += 1;
  return false;
}

export async function POST(request: NextRequest) {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > 12_000) return jsonError("The share note is too large. Send only a short aggregate summary.", 413);
  if (rateLimited(request)) return jsonError("Share creation is rate-limited. Please wait a minute before trying again.", 429);

  let payload: unknown;
  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > 12_000) return jsonError("The share note is too large. Send only a short aggregate summary.", 413);
    payload = JSON.parse(body) as unknown;
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }
  const parsed = ShareSchema.safeParse(payload);
  if (!parsed.success) return jsonError("Invalid share note. Raw rows/files are not accepted; provide only the displayed aggregate summary and provenance.", 400);

  const db = getDatabase();
  if (!db) return jsonError("Public share links are not configured. Add DATABASE_URL to enable Neon persistence; local saves still work.", 503);

  const id = randomUUID();
  const revokeToken = randomBytes(32).toString("hex");
  const ownerTokenHash = createHash("sha256").update(revokeToken).digest("hex");
  const expiresAt = new Date(Date.now() + SHARE_TTL_DAYS * 24 * 60 * 60 * 1_000);

  try {
    // Opportunistic TTL cleanup avoids requiring a separate scheduled job.
    await db.delete(sharedAnalyses).where(lt(sharedAnalyses.expiresAt, new Date()));
    const [created] = await db.insert(sharedAnalyses).values({
      id,
      title: parsed.data.title,
      datasetName: parsed.data.datasetName,
      source: parsed.data.source,
      reportingPeriod: parsed.data.reportingPeriod,
      question: parsed.data.question || null,
      summary: parsed.data.summary,
      evidence: parsed.data.evidence,
      limitations: parsed.data.limitations,
      ownerTokenHash,
      expiresAt,
    }).returning({ id: sharedAnalyses.id, createdAt: sharedAnalyses.createdAt, expiresAt: sharedAnalyses.expiresAt });

    return NextResponse.json({
      id: created.id,
      revokeToken,
      createdAt: created.createdAt,
      expiresAt: created.expiresAt,
      visibility: "Anyone with the link can view this note; it expires after 90 days.",
    }, { status: 201, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
  } catch {
    return jsonError("Neon could not save this public share. Local saved analyses remain available.", 503);
  }
}
