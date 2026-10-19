import sharp from "sharp";

export const JOB_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const JOB_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const FULL_MAX = 1600;
const THUMB_MAX = 480;

export function validateJobImage(file: { size: number; type: string }) {
  if (file.size > JOB_IMAGE_MAX_BYTES) return "Each image must be 5 MB or smaller";
  if (!(JOB_IMAGE_TYPES as readonly string[]).includes(file.type)) return "Images must be JPEG, PNG or WebP";
  return null;
}

export type ProcessedImage = { full: Buffer; thumb: Buffer; width: number; height: number };

/**
 * Re-encodes an upload as WebP: rotates by EXIF orientation, then drops all metadata (GPS,
 * camera, author) and limits the size. Throws if the bytes are not a decodable image, which
 * also rejects files that only claim to be images.
 */
export async function processJobImage(input: Buffer): Promise<ProcessedImage> {
  const base = sharp(input, { failOn: "error" }).rotate();
  const full = await base.clone().resize({ width: FULL_MAX, height: FULL_MAX, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
  const thumb = await base.clone().resize({ width: THUMB_MAX, height: THUMB_MAX, fit: "inside", withoutEnlargement: true }).webp({ quality: 70 }).toBuffer();
  return { full: full.data, thumb, width: full.info.width, height: full.info.height };
}
