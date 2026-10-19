import { describe, expect, it } from "vitest";
import { findViolations } from "./check-ui-rules.mjs";

describe("check-ui-rules", () => {
  it("flags removed styles", () => {
    expect(findViolations('<div className="backdrop-blur-xl" />')).toEqual([{ line: 1, rule: "backdrop blur" }]);
    expect(findViolations('<div className="bg-[#1d1d1d]" />')[0].rule).toBe("raw hex colour in a class");
    expect(findViolations('<div className="glass-panel-subtle" />')[0].rule).toBe("legacy glass/app utility");
    expect(findViolations('<span className="material-symbols-outlined">add</span>')[0].rule).toBe("Material Symbols icon");
    expect(findViolations('import HeaderProfileMenu from "x";')[0].rule).toBe("removed component");
    expect(findViolations("src={`https://ui-avatars.com/api/?name=x`}")[0].rule).toBe("third-party avatar service");
  });

  it("reports the line number", () => {
    expect(findViolations("ok\nok\n<div className=\"backdrop-blur\" />")).toEqual([{ line: 3, rule: "backdrop blur" }]);
  });

  it("leaves token-based code alone", () => {
    expect(findViolations('<div className="bg-canvas text-fg border-nb shadow-nb rounded-nb-lg" />')).toEqual([]);
  });
});
