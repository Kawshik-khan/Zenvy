import { cx } from "./cx";
import { toneBg, type Tone } from "./tokens";

type AvatarSize = "sm" | "md" | "lg" | "xl";

const sizeClasses: Record<AvatarSize, string> = {
  sm: "size-9 text-xs",
  md: "size-11 text-sm",
  lg: "size-14 text-lg",
  xl: "size-24 text-3xl",
};

const fallbackTones: Tone[] = ["focus", "match", "chat", "live", "career"];

export function initialsOf(name?: string | null) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/** Stable colour per name so the same person keeps the same avatar colour. */
export function toneFor(name?: string | null): Tone {
  const text = name || "";
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return fallbackTones[hash % fallbackTones.length];
}

type AvatarProps = {
  name?: string | null;
  src?: string | null;
  size?: AvatarSize;
  /** Square for groups, channels and organisations. */
  shape?: "circle" | "square";
  presence?: "online" | "offline";
  tone?: Tone;
  className?: string;
};

export function Avatar({ name, src, size = "md", shape = "circle", presence, tone, className }: AvatarProps) {
  const rounded = shape === "circle" ? "rounded-full" : "rounded-nb";
  return (
    <span className={cx("relative inline-flex shrink-0", className)}>
      <span
        className={cx(
          "inline-flex items-center justify-center overflow-hidden border-nb font-grotesk font-bold text-ink",
          rounded,
          sizeClasses[size],
          toneBg[tone ?? toneFor(name)],
        )}
      >
        {src ? (
          <img src={src} alt={name ?? ""} className="size-full object-cover" />
        ) : (
          <span role="img" aria-label={name ?? "Unknown user"}>
            {initialsOf(name)}
          </span>
        )}
      </span>
      {presence && (
        <span
          role="img"
          aria-label={presence === "online" ? "Online" : "Offline"}
          className={cx(
            "absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border-2 border-line",
            presence === "online" ? "bg-live" : "bg-quiet-paper",
          )}
        />
      )}
    </span>
  );
}

type AvatarStackProps = {
  people: Array<{ name?: string | null; src?: string | null }>;
  max?: number;
  size?: AvatarSize;
  className?: string;
};

export function AvatarStack({ people, max = 3, size = "md", className }: AvatarStackProps) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <span className={cx("inline-flex items-center", className)}>
      {shown.map((person, index) => (
        <Avatar key={`${person.name}-${index}`} name={person.name} src={person.src} size={size} className={index ? "-ml-3" : undefined} />
      ))}
      {extra > 0 && (
        <span
          className={cx(
            "-ml-3 inline-flex items-center justify-center rounded-full border-nb bg-card font-grotesk font-bold text-fg",
            sizeClasses[size],
          )}
        >
          +{extra}
        </span>
      )}
    </span>
  );
}
