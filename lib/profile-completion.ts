export type ProfileCompletionInput = {
  college?: string | null;
  major?: string | null;
  semester?: number | null;
  interests?: string | null;
  availability?: string | null;
};

export function isProfileComplete(profile?: ProfileCompletionInput | null) {
  if (!profile) return false;

  return Boolean(
    profile.college?.trim() &&
      profile.major?.trim() &&
      profile.major.trim().toLowerCase() !== "undeclared" &&
      profile.semester &&
      profile.interests?.trim() &&
      profile.availability?.trim()
  );
}

export function cleanText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}
