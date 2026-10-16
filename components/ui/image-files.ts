// Client-side checks for ImageDropzone. These are for fast feedback only;
// the server must validate again (see lib/upload-validation.ts).

export const DEFAULT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const TYPE_LABELS: Record<string, string> = {
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WebP",
  "image/gif": "GIF",
};

export type ImageRules = {
  maxFiles: number;
  maxBytes: number;
  accept: readonly string[];
};

export type ImageRejection = { file: File; reason: string };

export function acceptLabel(accept: readonly string[]) {
  const labels = accept.map((type) => TYPE_LABELS[type] ?? type);
  if (labels.length <= 1) return labels.join("");
  return `${labels.slice(0, -1).join(", ")} or ${labels[labels.length - 1]}`;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  const mb = bytes / (1024 * 1024);
  return `${Number.isInteger(mb) ? mb : mb.toFixed(1)} MB`;
}

/**
 * Splits incoming files into accepted and rejected, given how many are already chosen.
 * Order is preserved; the first files win when the limit is reached.
 */
export function partitionImageFiles(incoming: File[], currentCount: number, rules: ImageRules) {
  const accepted: File[] = [];
  const rejected: ImageRejection[] = [];

  for (const file of incoming) {
    if (!rules.accept.includes(file.type)) {
      rejected.push({ file, reason: `${file.name}: use ${acceptLabel(rules.accept)}.` });
    } else if (file.size > rules.maxBytes) {
      rejected.push({ file, reason: `${file.name} is larger than ${formatBytes(rules.maxBytes)}.` });
    } else if (currentCount + accepted.length >= rules.maxFiles) {
      rejected.push({
        file,
        reason: `${file.name}: you can add up to ${rules.maxFiles} image${rules.maxFiles === 1 ? "" : "s"}.`,
      });
    } else {
      accepted.push(file);
    }
  }

  return { accepted, rejected };
}
