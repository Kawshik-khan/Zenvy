const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ATTACHMENT_TYPES = new Set([
  ...IMAGE_TYPES,
  "video/mp4",
  "video/webm",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function getSafeFileExtension(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  return extension || "bin";
}

export function validateProfileImage(file: File) {
  if (file.size > 5 * 1024 * 1024) {
    return "Profile image exceeds 5MB limit";
  }

  if (!IMAGE_TYPES.has(file.type)) {
    return "Profile image must be a JPEG, PNG, WebP, or GIF";
  }

  return null;
}

export function validateChatAttachment(file: File) {
  if (file.size > 10 * 1024 * 1024) {
    return "File exceeds 10MB limit";
  }

  if (!ATTACHMENT_TYPES.has(file.type)) {
    return "File type is not allowed";
  }

  return null;
}
