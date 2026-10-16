"use client";

import { ImagePlus, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { Badge } from "./Badge";
import { cx } from "./cx";
import { IconButton } from "./IconButton";
import { acceptLabel, DEFAULT_IMAGE_TYPES, formatBytes, partitionImageFiles } from "./image-files";

type Preview = { key: string; file: File; url: string };

type ImageDropzoneProps = {
  /** id of the real file input; the label points at it. */
  id: string;
  /** Form field name, so the files submit with a normal form / server action. */
  name: string;
  label: string;
  hint?: string;
  /** "gallery" for job posts (several images), "avatar" for a single round profile photo. */
  variant?: "gallery" | "avatar";
  maxFiles?: number;
  maxSizeMB?: number;
  accept?: readonly string[];
  /** Current photo to show in the avatar variant before a new one is chosen. */
  initialUrl?: string | null;
  /** Server-side error to show under the field. */
  error?: string;
  disabled?: boolean;
  onFilesChange?: (files: File[]) => void;
};

let keyCounter = 0;

export function ImageDropzone({
  id,
  name,
  label,
  hint,
  variant = "gallery",
  maxFiles,
  maxSizeMB = 5,
  accept = DEFAULT_IMAGE_TYPES,
  initialUrl,
  error,
  disabled = false,
  onFilesChange,
}: ImageDropzoneProps) {
  const limit = maxFiles ?? (variant === "avatar" ? 1 : 4);
  const isAvatar = variant === "avatar";
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const [dragging, setDragging] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const dragDepth = useRef(0);
  const previewsRef = useRef<Preview[]>([]);
  previewsRef.current = previews;

  // Files picked before hydration sit in the native input without a React change event;
  // adopt them on mount. Must run before the sync effect below, which rewrites input.files.
  useEffect(() => {
    const files = inputRef.current?.files;
    if (files?.length) addFiles(Array.from(files));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the real <input type="file"> in sync so the files submit with the form.
  useEffect(() => {
    const input = inputRef.current;
    if (!input || typeof DataTransfer === "undefined") return;
    const transfer = new DataTransfer();
    previews.forEach((preview) => transfer.items.add(preview.file));
    input.files = transfer.files;
  }, [previews]);

  // Release object URLs when the component unmounts.
  useEffect(() => () => previewsRef.current.forEach((preview) => URL.revokeObjectURL(preview.url)), []);

  const update = useCallback(
    (next: Preview[]) => {
      setPreviews(next);
      onFilesChange?.(next.map((preview) => preview.file));
    },
    [onFilesChange],
  );

  const addFiles = useCallback(
    (incoming: File[]) => {
      if (!incoming.length) return;
      // A single-photo field replaces its photo instead of rejecting the new one.
      const base = isAvatar ? [] : previewsRef.current;
      if (isAvatar) previewsRef.current.forEach((preview) => URL.revokeObjectURL(preview.url));

      const { accepted, rejected } = partitionImageFiles(incoming, base.length, {
        maxFiles: limit,
        maxBytes: maxSizeMB * 1024 * 1024,
        accept,
      });

      const added = accepted.map((file) => {
        keyCounter += 1;
        return { key: `img-${keyCounter}`, file, url: URL.createObjectURL(file) };
      });

      if (added.length || isAvatar) update([...base, ...added]);
      setMessages(rejected.map((rejection) => rejection.reason));
      if (rejected.length) setShakeKey((value) => value + 1);
      setAnnouncement(
        [added.length ? `Added ${added.map((item) => item.file.name).join(", ")}.` : "", ...rejected.map((rejection) => rejection.reason)]
          .filter(Boolean)
          .join(" "),
      );
    },
    [accept, isAvatar, limit, maxSizeMB, update],
  );

  const remove = (key: string) => {
    const target = previews.find((preview) => preview.key === key);
    if (!target) return;
    URL.revokeObjectURL(target.url);
    update(previews.filter((preview) => preview.key !== key));
    setMessages([]);
    setAnnouncement(`Removed ${target.file.name}.`);
    inputRef.current?.focus();
  };

  const onDragEnter = (event: DragEvent) => {
    event.preventDefault();
    if (disabled) return;
    dragDepth.current += 1;
    setDragging(true);
  };
  const onDragLeave = (event: DragEvent) => {
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (!dragDepth.current) setDragging(false);
  };
  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    if (!disabled) addFiles(Array.from(event.dataTransfer.files));
  };

  const full = !isAvatar && previews.length >= limit;
  const hintText = hint ?? `${acceptLabel(accept)} · up to ${formatBytes(maxSizeMB * 1024 * 1024)}${limit > 1 ? ` · max ${limit}` : ""}`;
  const describedBy = [`${id}-hint`, messages.length || error ? `${id}-errors` : null].filter(Boolean).join(" ");
  const avatarUrl = previews[0]?.url ?? initialUrl ?? null;

  const input = (
    <input
      ref={inputRef}
      id={id}
      name={name}
      type="file"
      accept={accept.join(",")}
      multiple={limit > 1}
      disabled={disabled || full}
      aria-labelledby={`${id}-label`}
      aria-describedby={describedBy}
      aria-invalid={messages.length || error ? true : undefined}
      className="peer sr-only"
      onChange={(event) => {
        // Copy before the effect above rewrites input.files with the full selection.
        addFiles(Array.from(event.target.files ?? []));
      }}
    />
  );

  const dropSurface = cx(
    "relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-nb-lg border-nb border-dashed px-4 py-6 text-center transition-colors duration-150",
    "peer-focus-visible:outline-3 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-chat peer-focus-visible:outline-solid",
    dragging ? "border-solid bg-focus text-ink shadow-nb animate-nb-wobble" : "bg-canvas hover:bg-card",
    (disabled || full) && "cursor-not-allowed opacity-60",
    shakeKey > 0 && !dragging && "animate-nb-shake",
  );

  return (
    <div className="flex flex-col gap-2 font-grotesk text-fg">
      <span id={`${id}-label`} className="text-[15px] font-bold">
        {label}
      </span>

      <div
        className={cx("flex gap-4", isAvatar ? "items-center" : "flex-col")}
        onDragEnter={onDragEnter}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {isAvatar && (
          <span className="relative inline-flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-nb bg-quiet-paper shadow-nb">
            {avatarUrl ? (
              <img src={avatarUrl} alt={previews[0] ? `New photo: ${previews[0].file.name}` : "Current photo"} className="size-full object-cover animate-nb-pop-in" />
            ) : (
              <ImagePlus aria-hidden="true" size={32} />
            )}
          </span>
        )}

        <div className={cx("relative", isAvatar && "flex-1")}>
          {input}
          <label key={shakeKey} htmlFor={id} className={dropSurface}>
            <Upload aria-hidden="true" size={26} />
            <span className="font-bold">{dragging ? "Drop to add" : full ? `${limit} of ${limit} added` : isAvatar ? "Choose or drop a photo" : "Drop images or browse"}</span>
            <span id={`${id}-hint`} className="text-sm text-fg-muted">
              {hintText}
            </span>
          </label>
        </div>

        {!isAvatar && previews.length > 0 && (
          <ul className="m-0 grid list-none grid-cols-2 gap-4 p-0 sm:grid-cols-4" aria-label={`Selected images, ${previews.length} of ${limit}`}>
            {previews.map((preview, index) => (
              <li key={preview.key} className="relative animate-nb-pop-in">
                <div className="aspect-square overflow-hidden rounded-nb border-nb bg-quiet-paper shadow-nb">
                  <img src={preview.url} alt={preview.file.name} className="size-full object-cover" />
                </div>
                {index === 0 && (
                  <Badge tone="focus" size="sm" className="absolute bottom-2 left-2">
                    Cover
                  </Badge>
                )}
                <IconButton
                  label={`Remove ${preview.file.name}`}
                  icon={<Trash2 size={16} />}
                  variant="danger"
                  size="sm"
                  className="absolute -top-3 -right-3"
                  onClick={() => remove(preview.key)}
                />
              </li>
            ))}
          </ul>
        )}

        {isAvatar && previews.length > 0 && (
          <IconButton label={`Remove ${previews[0].file.name}`} icon={<Trash2 size={16} />} variant="danger" size="sm" onClick={() => remove(previews[0].key)} />
        )}
      </div>

      <div id={`${id}-errors`} className="flex flex-col gap-1">
        {[...(error ? [error] : []), ...messages].map((message) => (
          <p key={message} className="m-0 text-sm font-bold">
            <span aria-hidden="true" className="mr-1 inline-block rounded-sm bg-alert px-1 text-ink">
              !
            </span>
            {message}
          </p>
        ))}
      </div>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
