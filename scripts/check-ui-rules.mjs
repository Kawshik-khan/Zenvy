// Fails the build when code goes back to styles the redesign removed.
// Usage: node scripts/check-ui-rules.mjs   (exit code 1 when there are violations)
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RULES = [
  { name: "backdrop blur", test: /backdrop-blur|backdrop-filter/ },
  { name: "raw hex colour in a class", test: /(?:bg|text|border|ring|outline|fill|stroke|from|via|to|shadow|accent|decoration)-\[#[0-9a-fA-F]{3,8}\]/ },
  { name: "legacy glass/app utility", test: /\b(?:glass-(?:panel|panel-subtle|interactive|divider)|app-(?:aurora|topbar|input|primary-button|card|main|content)|mobile-safe-bottom)\b/ },
  { name: "Material Symbols icon", test: /material-symbols/ },
  { name: "removed component", test: /HeaderProfileMenu|ThreeDotMenu|from ["'][^"']*\/SearchInput["']|framer-motion|simple-peer/ },
  { name: "third-party avatar service", test: /ui-avatars\.com/ },
];

/** Violations in one file's source, as `{ line, rule }`. */
export function findViolations(source) {
  const found = [];
  source.split("\n").forEach((text, index) => {
    for (const rule of RULES) if (rule.test.test(text)) found.push({ line: index + 1, rule: rule.name });
  });
  return found;
}

// Avatar.tsx names the service on purpose: it recognises those URLs and shows initials instead.
const ALLOWED = new Set(["components/ui/Avatar.tsx"]);

const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "e2e", "test-results", "designs", "docs", "public", "prisma"]);

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (/\.(tsx?|css)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) yield full;
  }
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let total = 0;
  for (const file of walk(root)) {
    if (ALLOWED.has(path.relative(root, file).split(path.sep).join("/"))) continue;
    for (const { line, rule } of findViolations(readFileSync(file, "utf8"))) {
      console.error(`${path.relative(root, file)}:${line}  ${rule}`);
      total += 1;
    }
  }
  if (total) {
    console.error(`\n${total} UI rule violation${total === 1 ? "" : "s"}. See docs/design-system.md.`);
    process.exit(1);
  }
  console.log("UI rules: ok");
}
