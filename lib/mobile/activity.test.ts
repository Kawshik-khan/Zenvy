import { describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/study-metrics-cache", () => ({ getCachedStudyMetrics: vi.fn() }));

const { parseTzOffset, startOfLocalDay } = await import("./activity");

describe("startOfLocalDay", () => {
  it("uses the UTC day without an offset", () => {
    expect(startOfLocalDay(new Date("2026-10-26T15:04:00Z")).toISOString()).toBe("2026-10-26T00:00:00.000Z");
  });

  it("finds local midnight east of UTC (Dhaka, offset -360)", () => {
    // 20:00 UTC on the 26th is 02:00 on the 27th in Dhaka, whose midnight was 18:00 UTC.
    expect(startOfLocalDay(new Date("2026-10-26T20:00:00Z"), -360).toISOString()).toBe("2026-10-26T18:00:00.000Z");
    expect(startOfLocalDay(new Date("2026-10-26T17:00:00Z"), -360).toISOString()).toBe("2026-10-25T18:00:00.000Z");
  });

  it("finds local midnight west of UTC (New York in summer, offset 240)", () => {
    expect(startOfLocalDay(new Date("2026-07-01T02:00:00Z"), 240).toISOString()).toBe("2026-06-30T04:00:00.000Z");
  });
});

describe("parseTzOffset", () => {
  it("accepts real offsets and ignores junk", () => {
    expect(parseTzOffset("-360")).toBe(-360);
    expect(parseTzOffset("330")).toBe(330);
    expect(parseTzOffset(null)).toBe(0);
    expect(parseTzOffset("abc")).toBe(0);
    expect(parseTzOffset("100000")).toBe(0);
  });
});
