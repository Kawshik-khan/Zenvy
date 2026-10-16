import { describe, expect, it } from "vitest";
import { acceptLabel, DEFAULT_IMAGE_TYPES, formatBytes, partitionImageFiles } from "./image-files";

const MB = 1024 * 1024;
const file = (name: string, type: string, size = 1000) => new File([new Uint8Array(size)], name, { type });
const rules = { maxFiles: 2, maxBytes: 5 * MB, accept: DEFAULT_IMAGE_TYPES };

describe("acceptLabel", () => {
  it("reads naturally", () => {
    expect(acceptLabel(DEFAULT_IMAGE_TYPES)).toBe("JPG, PNG or WebP");
    expect(acceptLabel(["image/png"])).toBe("PNG");
  });
});

describe("formatBytes", () => {
  it.each([
    [500, "500 B"],
    [2048, "2 KB"],
    [5 * MB, "5 MB"],
    [1.5 * MB, "1.5 MB"],
  ])("%d → %s", (bytes, label) => {
    expect(formatBytes(bytes)).toBe(label);
  });
});

describe("partitionImageFiles", () => {
  it("accepts valid images", () => {
    const { accepted, rejected } = partitionImageFiles([file("a.png", "image/png"), file("b.webp", "image/webp")], 0, rules);
    expect(accepted.map((f) => f.name)).toEqual(["a.png", "b.webp"]);
    expect(rejected).toEqual([]);
  });

  it("rejects wrong types and oversize files with readable reasons", () => {
    const { accepted, rejected } = partitionImageFiles([file("doc.pdf", "application/pdf"), file("big.jpg", "image/jpeg", 6 * MB)], 0, rules);
    expect(accepted).toEqual([]);
    expect(rejected.map((r) => r.reason)).toEqual(["doc.pdf: use JPG, PNG or WebP.", "big.jpg is larger than 5 MB."]);
  });

  it("enforces the limit, counting files already chosen", () => {
    const { accepted, rejected } = partitionImageFiles([file("1.png", "image/png"), file("2.png", "image/png")], 1, rules);
    expect(accepted.map((f) => f.name)).toEqual(["1.png"]);
    expect(rejected[0].reason).toBe("2.png: you can add up to 2 images.");
  });
});
