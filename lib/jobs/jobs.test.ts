import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { processJobImage, validateJobImage } from "./images";
import { initialStatusFor, REPORT_HIDE_THRESHOLD, scanForScamSignals, shouldAutoHide } from "./moderation";
import { rankJobs } from "./ranking";
import { createJobSchema, fieldErrors, parseTags } from "./schema";

const now = new Date("2026-10-19T10:00:00Z");
const day = 24 * 60 * 60 * 1000;
const valid = {
  type: "INTERNSHIP",
  title: "Frontend intern",
  company: "Acme",
  location: "Dhaka",
  workMode: "HYBRID",
  pay: "",
  description: "Build screens with React and help the design team ship weekly.",
  applyMethod: "LINK",
  applyTarget: "https://acme.example/apply",
  tags: "React, Design , react",
  deadline: new Date(now.getTime() + 10 * day).toISOString(),
  noFee: true,
};

describe("parseTags", () => {
  it("lowercases, trims and de-duplicates", () => {
    expect(parseTags("React, Data  science,,react ")).toEqual(["react", "data science"]);
    expect(parseTags("")).toEqual([]);
  });
});

describe("createJobSchema", () => {
  const parse = (override: Record<string, unknown> = {}) => createJobSchema(now).safeParse({ ...valid, ...override });

  it("accepts a complete post and normalises it", () => {
    const result = parse();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual(["react", "design"]);
      expect(result.data.pay).toBeNull();
      expect(result.data.deadline).toBeInstanceOf(Date);
    }
  });

  it("requires the no-fee confirmation", () => {
    const result = parse({ noFee: false });
    expect(result.success).toBe(false);
    if (!result.success) expect(fieldErrors(result.error).noFee).toMatch(/never asked to pay/);
  });

  it("limits the deadline to between a day and 90 days away", () => {
    expect(parse({ deadline: new Date(now.getTime() + 1 * 3600_000).toISOString() }).success).toBe(false);
    expect(parse({ deadline: new Date(now.getTime() + 91 * day).toISOString() }).success).toBe(false);
    expect(parse({ deadline: new Date(now.getTime() + 90 * day).toISOString() }).success).toBe(true);
  });

  it("checks the apply target against the apply method", () => {
    expect(parse({ applyTarget: "http://acme.example" }).success).toBe(false);
    expect(parse({ applyTarget: "javascript:alert(1)" }).success).toBe(false);
    expect(parse({ applyMethod: "EMAIL", applyTarget: "hr@acme.example" }).success).toBe(true);
    expect(parse({ applyMethod: "EMAIL", applyTarget: "not an email" }).success).toBe(false);
  });

  it("drops the target for in-app messages", () => {
    const result = parse({ applyMethod: "MESSAGE", applyTarget: "whatever" });
    expect(result.success && result.data.applyTarget).toBeNull();
  });

  it("rejects more than 8 tags and over-long text", () => {
    expect(parse({ tags: "a,b,c,d,e,f,g,h,i" }).success).toBe(false);
    expect(parse({ title: "x".repeat(121) }).success).toBe(false);
    expect(parse({ description: "too short" }).success).toBe(false);
  });
});

describe("scanForScamSignals", () => {
  it("flags fees, WhatsApp-only contact, shortened links and income promises", () => {
    expect(scanForScamSignals("A refundable deposit is required")).toContain("Asks for a fee or deposit");
    expect(scanForScamSignals("Pay a registration fee to start")).toContain("Asks for a fee or deposit");
    expect(scanForScamSignals("Contact us on WhatsApp")).toContain("WhatsApp or Telegram only");
    expect(scanForScamSignals("Apply at https://bit.ly/abc123")).toContain("Shortened link");
    expect(scanForScamSignals("Earn $500 per day from home")).toContain("Unrealistic pay promise");
  });

  it("leaves an ordinary post alone", () => {
    expect(scanForScamSignals("Frontend intern", "Work with React on our design system. Apply on our careers page.", null)).toEqual([]);
  });
});

describe("initialStatusFor", () => {
  it("publishes verified employers immediately", () => {
    expect(initialStatusFor({ posterTrust: "VERIFIED_EMPLOYER", approvedPosts: 0, signals: ["x"] })).toBe("LIVE");
  });
  it("publishes alumni and previously approved posters unless flagged", () => {
    expect(initialStatusFor({ posterTrust: "ALUMNI", approvedPosts: 0, signals: [] })).toBe("LIVE");
    expect(initialStatusFor({ posterTrust: "STUDENT", approvedPosts: 1, signals: [] })).toBe("LIVE");
    expect(initialStatusFor({ posterTrust: "ALUMNI", approvedPosts: 3, signals: ["Shortened link"] })).toBe("PENDING_REVIEW");
  });
  it("sends everyone else to review", () => {
    expect(initialStatusFor({ posterTrust: "STUDENT", approvedPosts: 0, signals: [] })).toBe("PENDING_REVIEW");
  });
});

describe("report threshold", () => {
  it("hides at three distinct reporters", () => {
    expect(REPORT_HIDE_THRESHOLD).toBe(3);
    expect(shouldAutoHide(2)).toBe(false);
    expect(shouldAutoHide(3)).toBe(true);
  });
});

describe("rankJobs", () => {
  const job = (id: string, tags: string[], ageDays: number, daysLeft: number) => ({
    id,
    title: id,
    tags,
    createdAt: new Date(now.getTime() - ageDays * day),
    deadline: new Date(now.getTime() + daysLeft * day),
  });

  it("puts relevant posts first even when they are older", () => {
    const ranked = rankJobs([job("fresh-unrelated", ["marketing"], 0, 30), job("older-match", ["react"], 6, 30)], { major: "Computer Science", interests: "React, graphs" }, now);
    expect(ranked[0].job.id).toBe("older-match");
    expect(ranked[0].reasons[0]).toMatch(/react/);
  });

  it("prefers a closing-soon post over an equal one with weeks left", () => {
    const ranked = rankJobs([job("later", [], 2, 40), job("soon", [], 2, 2)], {}, now);
    expect(ranked[0].job.id).toBe("soon");
    expect(ranked[0].reasons).toContain("Closing soon");
  });

  it("drops expired posts", () => {
    expect(rankJobs([job("gone", ["react"], 1, -1)], { interests: "react" }, now)).toEqual([]);
  });
});

describe("job images", () => {
  it("validates type and size", () => {
    expect(validateJobImage({ size: 1000, type: "image/png" })).toBeNull();
    expect(validateJobImage({ size: 6 * 1024 * 1024, type: "image/png" })).toMatch(/5 MB/);
    expect(validateJobImage({ size: 1000, type: "image/gif" })).toMatch(/JPEG, PNG or WebP/);
  });

  it("re-encodes to a bounded WebP with metadata removed", async () => {
    const source = await sharp({ create: { width: 3000, height: 1000, channels: 3, background: "#ff0000" } })
      .jpeg()
      .withExif({ IFD0: { Copyright: "secret-author" } })
      .toBuffer();
    expect((await sharp(source).metadata()).exif).toBeDefined();

    const out = await processJobImage(source);
    const meta = await sharp(out.full).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(1600);
    expect(out.width).toBe(1600);
    expect(out.height).toBe(533);
    expect(meta.exif).toBeUndefined();
    expect((await sharp(out.thumb).metadata()).width).toBe(480);
  });

  it("refuses bytes that are not an image", async () => {
    await expect(processJobImage(Buffer.from("<?php echo 1;"))).rejects.toThrow();
  });
});

import { deadlineLabel, isClosingSoon } from "./format";

describe("deadlineLabel", () => {
  it("counts down, then shows a date, then says closed", () => {
    expect(deadlineLabel(new Date(now.getTime() + 3 * day), now)).toBe("Closes in 3 days");
    expect(deadlineLabel(new Date(now.getTime() + 3 * 3600_000), now)).toBe("Closes today");
    expect(deadlineLabel(new Date(now.getTime() + 30 * day), now)).toMatch(/^Closes /);
    expect(deadlineLabel(new Date(now.getTime() - 1), now)).toBe("Closed");
  });
  it("flags posts closing within three days", () => {
    expect(isClosingSoon(new Date(now.getTime() + 2 * day), now)).toBe(true);
    expect(isClosingSoon(new Date(now.getTime() + 5 * day), now)).toBe(false);
    expect(isClosingSoon(new Date(now.getTime() - day), now)).toBe(false);
  });
});
