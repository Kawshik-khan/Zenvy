"use client";

import { MoreHorizontal, StickyNote, Timer } from "lucide-react";
import { IconButton, Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/ui";

type CallToolsMenuProps = {
  compact?: boolean;
  onOpenPomodoro: () => void;
  onOpenNote: () => void;
};

const itemClasses =
  "nb-focus flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-nb border-2 border-transparent bg-transparent px-3 text-left font-grotesk font-bold text-fg hover:border-line hover:bg-canvas";

export default function CallToolsMenu({ compact = false, onOpenPomodoro, onOpenNote }: CallToolsMenuProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <IconButton size={compact ? "sm" : "md"} label="Call tools" icon={<MoreHorizontal size={20} />} />
      </PopoverTrigger>
      <PopoverContent side="top" align={compact ? "end" : "center"} className="w-52 p-2">
        <p className="m-0 px-3 pt-1 pb-2 font-grotesk text-xs font-bold tracking-wide text-fg-muted uppercase">Call tools</p>
        <PopoverClose asChild>
          <button type="button" className={itemClasses} onClick={onOpenPomodoro}>
            <Timer aria-hidden="true" size={18} />
            Focus timer
          </button>
        </PopoverClose>
        <PopoverClose asChild>
          <button type="button" className={itemClasses} onClick={onOpenNote}>
            <StickyNote aria-hidden="true" size={18} />
            Make note
          </button>
        </PopoverClose>
      </PopoverContent>
    </Popover>
  );
}
