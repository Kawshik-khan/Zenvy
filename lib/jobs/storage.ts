import { supabaseServer } from "@/lib/supabase-server";

const BUCKET = "job-media";
const SIGNED_URL_SECONDS = 60 * 60;

export async function uploadJobImage(path: string, data: Buffer) {
  const { error } = await supabaseServer.storage.from(BUCKET).upload(path, data, { contentType: "image/webp", upsert: false });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
}

export async function removeJobImages(paths: string[]) {
  if (!paths.length) return;
  await supabaseServer.storage.from(BUCKET).remove(paths).catch(() => undefined);
}

/** Private bucket, so images are shown through short-lived signed links. A failure just means no image. */
export async function signedImageUrls(paths: string[]): Promise<Record<string, string>> {
  if (!paths.length) return {};
  try {
    const { data } = await supabaseServer.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS);
    return Object.fromEntries((data ?? []).filter((entry) => entry.signedUrl && entry.path).map((entry) => [entry.path as string, entry.signedUrl]));
  } catch {
    return {};
  }
}
