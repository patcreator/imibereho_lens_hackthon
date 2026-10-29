import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockCreate, MockAPIError } = vi.hoisted(() => {
  class MockAPIError extends Error {
    status: number;
    error: unknown;
    constructor(status: number, error: unknown, message: string) {
      super(message);
      this.name = "APIError";
      this.status = status;
      this.error = error;
    }
  }
  return { mockCreate: vi.fn(), MockAPIError };
});

vi.mock("groq-sdk", () => {
  class Groq {
    static APIError = MockAPIError;
    chat = { completions: { create: mockCreate } };
  }
  return { default: Groq };
});

import { POST } from "@/app/api/ai/interpretation/route";

// Each request gets its own IP so the in-memory rate limiter never interferes between tests
let ipCounter = 0;
function request(body: unknown) {
  ipCounter += 1;
  return new NextRequest("http://localhost/api/ai/interpretation", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": `10.0.0.${ipCounter}`,
    },
    body: JSON.stringify(body),
  });
}

const validBody = {
  question: "Explain the main caveats.",
  indicators: [{
    name: "Monetary poverty",
    value: 27.4,
    unit: "percent of population",
    geography: "Rwanda",
    period: "2023/24",
    source: "NISR · Table 9.1",
    definition: "Published headcount estimate.",
  }],
  aggregates: [],
};

function clearAiEnv() {
  vi.stubEnv("GROQ_API_KEY", "");
  vi.stubEnv("HACKTHON_2026_NISR", "");
  vi.stubEnv("GROQ_MODEL", "");
}

beforeEach(() => {
  mockCreate.mockReset();
});

afterEach(() => vi.unstubAllEnvs());

describe("optional AI route (Groq)", () => {
  it("rejects raw-row shaped or missing indicator requests", async () => {
    clearAiEnv();
    const response = await POST(request({ question: "Summarize these rows", rows: [{ id: 1 }] }));
    expect(response.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns a clear unavailable response without server credentials", async () => {
    clearAiEnv();
    const response = await POST(request(validBody));
    expect(response.status).toBe(503);
    expect((await response.json()).error).toContain("not configured");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("accepts the HACKTHON_2026_NISR key name and defaults the model", async () => {
    clearAiEnv();
    vi.stubEnv("HACKTHON_2026_NISR", "test-key-123");
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "## Summary\n- Point" }, finish_reason: "stop" }],
    });

    const response = await POST(request(validBody));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.interpretation).toContain("Summary");
    expect(json.model).toBe("openai/gpt-oss-120b");
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: "openai/gpt-oss-120b", stream: false }),
    );
  });

  it("returns the interpretation on success using GROQ_API_KEY and GROQ_MODEL", async () => {
    clearAiEnv();
    vi.stubEnv("GROQ_API_KEY", "test-key-123");
    vi.stubEnv("GROQ_MODEL", "openai/gpt-oss-20b");
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "Heading\n- Bullet" }, finish_reason: "stop" }],
    });

    const response = await POST(request(validBody));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.model).toBe("openai/gpt-oss-20b");
    expect(json.interpretation).toBe("Heading\n- Bullet");
  });

  it("surfaces the real Groq API error with status, code and message", async () => {
    clearAiEnv();
    vi.stubEnv("GROQ_API_KEY", "test-key-123");
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockCreate.mockRejectedValue(
      new MockAPIError(
        401,
        { error: { message: "Invalid API Key", type: "invalid_request_error", code: "invalid_api_key" } },
        "401 Invalid API Key",
      ),
    );

    const response = await POST(request(validBody));
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toContain("Groq API error 401");
    expect(json.error).toContain("invalid_api_key");
    expect(json.error).toContain("Invalid API Key");
    expect(json.error).not.toContain("retry later");
  });

  it("surfaces non-API failures such as timeouts with the real error name", async () => {
    clearAiEnv();
    vi.stubEnv("GROQ_API_KEY", "test-key-123");
    vi.spyOn(console, "error").mockImplementation(() => {});
    const timeout = new Error("Request timed out.");
    timeout.name = "APIConnectionTimeoutError";
    mockCreate.mockRejectedValue(timeout);

    const response = await POST(request(validBody));
    const json = await response.json();

    expect(response.status).toBe(502);
    expect(json.error).toContain("APIConnectionTimeoutError");
    expect(json.error).toContain("Request timed out.");
  });

  it("never leaks the API key in error messages", async () => {
    clearAiEnv();
    vi.stubEnv("GROQ_API_KEY", "super-secret-key");
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockCreate.mockRejectedValue(new Error("Bad credentials: super-secret-key"));

    const response = await POST(request(validBody));
    const json = await response.json();

    expect(json.error).not.toContain("super-secret-key");
    expect(json.error).toContain("[redacted]");
  });

  it("explains when the token limit is hit before any answer is produced", async () => {
    clearAiEnv();
    vi.stubEnv("GROQ_API_KEY", "test-key-123");
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "" }, finish_reason: "length" }],
    });

    const response = await POST(request(validBody));
    const json = await response.json();

    expect(response.status).toBe(502);
    expect(json.error).toContain("finish_reason: length");
    expect(json.error).toContain("max_completion_tokens");
  });
});