import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { z } from "zod";
import { getDatabase } from "@/lib/db";
import { sharedAnalyses } from "@/lib/db/schema";

export const runtime = "nodejs";

const ParamsSchema = z.object({ id: z.string().uuid() });

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const parsedParams = ParamsSchema.safeParse(await params);
  if (!parsedParams.success) return jsonError("Shared note not found.", 404);
  const db = getDatabase();
  if (!db) return jsonError("Public share links are not configured on this deployment.", 503);
  try {
    const [note] = await db.select({
      id: sharedAnalyses.id,
      title: sharedAnalyses.title,
      datasetName: sharedAnalyses.datasetName,
      source: sharedAnalyses.source,
      reportingPeriod: sharedAnalyses.reportingPeriod,
      question: sharedAnalyses.question,
      summary: sharedAnalyses.summary,
      evidence: sharedAnalyses.evidence,
      limitations: sharedAnalyses.limitations,
      createdAt: sharedAnalyses.createdAt,
      expiresAt: sharedAnalyses.expiresAt,
    }).from(sharedAnalyses).where(and(eq(sharedAnalyses.id, parsedParams.data.id), gt(sharedAnalyses.expiresAt, new Date()))).limit(1);
    if (!note) return jsonError("Shared note not found or expired.", 404);
    return NextResponse.json(note, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
  } catch {
    return jsonError("The shared note could not be loaded from Neon.", 503);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const parsedParams = ParamsSchema.safeParse(await params);
  if (!parsedParams.success) return jsonError("Shared note not found.", 404);
  const bearer = request.headers.get("authorization")?.match(/^Bearer\s+([a-f0-9]{64})$/i)?.[1];
  if (!bearer) return jsonError("A valid revoke token is required.", 401);
  const db = getDatabase();
  if (!db) return jsonError("Public share links are not configured on this deployment.", 503);
  try {
    const [note] = await db.select({ id: sharedAnalyses.id, ownerTokenHash: sharedAnalyses.ownerTokenHash })
      .from(sharedAnalyses).where(eq(sharedAnalyses.id, parsedParams.data.id)).limit(1);
    if (!note) return jsonError("Shared note not found.", 404);
    const candidate = Buffer.from(createHash("sha256").update(bearer).digest("hex"), "hex");
    const actual = Buffer.from(note.ownerTokenHash, "hex");
    if (actual.length !== candidate.length || !timingSafeEqual(actual, candidate)) return jsonError("Revoke token is invalid.", 403);
    await db.delete(sharedAnalyses).where(eq(sharedAnalyses.id, note.id));
    return NextResponse.json({ deleted: true }, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
  } catch {
    return jsonError("The share could not be revoked. Try again later.", 503);
  }
}
