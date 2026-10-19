"use client";

import { Loader2, Paperclip, Send } from "lucide-react";
import type { ChangeEvent, FormEvent, KeyboardEvent, RefObject } from "react";
import { IconButton, Textarea } from "@/components/ui";

type ComposerProps = {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  uploading: boolean;
};

/** Message box with attach and send. Enter sends, Shift+Enter adds a line. */
export function Composer({ id, label, placeholder, value, onChange, onSend, onFileChange, fileInputRef, uploading }: ComposerProps) {
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSend();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <form onSubmit={submit} className="flex shrink-0 items-end gap-2 border-t-[length:var(--nb-border-width)] border-line bg-canvas p-3 md:p-4">
      <input ref={fileInputRef} type="file" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={onFileChange} />
      <IconButton
        label={uploading ? "Uploading file" : "Attach file (10 MB max)"}
        icon={uploading ? <Loader2 size={20} className="animate-spin motion-reduce:animate-none" /> : <Paperclip size={20} />}
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
      />
      <Textarea
        id={id}
        label={label}
        labelHidden
        rows={1}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="min-w-0 flex-1"
        style={{ maxHeight: "8rem", minHeight: "3rem" }}
      />
      <IconButton type="submit" variant="chat" label="Send message" icon={<Send size={20} />} disabled={!value.trim()} />
    </form>
  );
}
