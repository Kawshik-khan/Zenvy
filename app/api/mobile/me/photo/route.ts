import { uploadProfilePicture } from "@/app/(app)/profile/upload-action";
import { fail, handle, ok, requireUserId } from "@/lib/mobile/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Multipart upload with a "file" field; same validation and storage as the web profile page. */
export async function POST(request: Request) {
  return handle(async () => {
    await requireUserId();
    const form = await request.formData().catch(() => null);
    if (!form) return fail("Send the photo as multipart form data");
    const result = await uploadProfilePicture(form);
    if ("error" in result && result.error) return fail(result.error);
    return ok({ url: result.url });
  });
}
