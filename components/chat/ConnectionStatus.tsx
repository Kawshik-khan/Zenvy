import { cx } from "@/components/ui";

/** Whether the live connection is up. This is the socket, not whether the other person is online. */
export function ConnectionStatus({ connected, className }: { connected: boolean; className?: string }) {
  return (
    <span role="status" className={cx("inline-flex items-center gap-1.5 text-xs font-bold text-fg-muted", className)}>
      <span aria-hidden="true" className={cx("size-2.5 rounded-full border-2 border-line", connected ? "bg-live" : "bg-focus")} />
      {connected ? "Live" : "Connecting"}
    </span>
  );
}
