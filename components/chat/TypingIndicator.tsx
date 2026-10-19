import { typingLabel } from "./chat-utils";

/** "Sam is typing" with three dots. Announced politely; renders nothing when nobody types. */
export function TypingIndicator({ names }: { names: string[] }) {
  if (names.length === 0) return null;
  return (
    <p role="status" className="m-0 flex items-center gap-2 px-1 text-sm text-fg-muted">
      <span aria-hidden="true" className="flex gap-1 rounded-full border-2 border-line bg-card px-2.5 py-2">
        <span className="size-1.5 animate-bounce rounded-full bg-fg [animation-delay:-0.3s] motion-reduce:animate-none" />
        <span className="size-1.5 animate-bounce rounded-full bg-fg [animation-delay:-0.15s] motion-reduce:animate-none" />
        <span className="size-1.5 animate-bounce rounded-full bg-fg motion-reduce:animate-none" />
      </span>
      {typingLabel(names)}
    </p>
  );
}
