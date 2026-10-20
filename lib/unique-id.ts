/** Public handle like "nadiarahman_0421", built from a display name. */
export function makeUniqueId(name: string) {
  const baseName = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 24) || "user";
  return `${baseName}_${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;
}
