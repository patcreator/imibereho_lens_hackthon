import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/shared-analyses/route";

function request(body: unknown) {
  return new NextRequest("http://localhost/api/shared-analyses", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  title: "Poverty estimate",
  datasetName: "EICV7",
  source: "NISR",
  reportingPeriod: "2023/24",
  question: "",
  summary: "A descriptive note about one published estimate.",
  evidence: ["NISR Table 9.1: 27.4%"],
  limitations: ["Descriptive, not causal."],
};

afterEach(() => vi.unstubAllEnvs());

describe("public shared-analysis persistence", () => {
  it("does not accept raw rows or extra fields", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const response = await POST(request({ ...validBody, rows: [{ person: "not accepted" }] }));
    expect(response.status).toBe(400);
  });

  it("preserves local saves when Neon is not configured", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const response = await POST(request(validBody));
    expect(response.status).toBe(503);
    expect((await response.json()).error).toContain("local saves still work");
  });
});
