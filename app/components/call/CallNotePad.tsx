"use client";

import React, { useState } from "react";
import { CALL_NOTE_MAX_LENGTH } from "@/lib/call-notes";

type CallNotePadProps = {
  open: boolean;
  onClose: () => void;
  onSave: (content: string) => Promise<void>;
};

export default function CallNotePad({ open, onClose, onSave }: CallNotePadProps) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  if (!open) return null;

  const trimmedLength = content.trim().length;
  const tooLong = trimmedLength > CALL_NOTE_MAX_LENGTH;

  const handleClose = () => {
    if (saving) return;
    setContent("");
    setError("");
    setSaved(false);
    onClose();
  };

  const handleSave = async () => {
    if (!content.trim() || tooLong || saving) return;

    setSaving(true);
    setError("");
    try {
      await onSave(content.trim());
      setSaved(true);
      setContent("");
      window.setTimeout(() => {
        setSaved(false);
        onClose();
      }, 900);
    } catch (err: any) {
      setError(err?.message || "Unable to send note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm md:items-center">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-surface-container-low shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">sticky_note_2</span>
            <h2 className="text-base font-black text-on-surface">Call note</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container disabled:opacity-60"
            aria-label="Close note pad"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-3 p-5">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write a note to share in chat..."
            rows={6}
            maxLength={CALL_NOTE_MAX_LENGTH + 50}
            disabled={saving}
            className="app-input w-full resize-none px-4 py-3 text-sm"
            autoFocus
          />
          <div className="flex items-center justify-between text-xs">
            <p className={`font-bold ${tooLong ? "text-error" : "text-on-surface-variant"}`}>
              {trimmedLength}/{CALL_NOTE_MAX_LENGTH}
            </p>
            <p className="text-on-surface-variant">Shared with everyone in this chat</p>
          </div>
          {error && <p className="text-sm font-bold text-error">{error}</p>}
          {saved && <p className="text-sm font-bold text-accent-green">Note sent to chat</p>}
        </div>

        <div className="flex gap-3 border-t border-white/5 px-5 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="flex-1 rounded-2xl bg-surface-container px-4 py-3 text-sm font-bold text-on-surface hover:bg-surface-container-high disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!content.trim() || tooLong || saving}
            className="flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-on-primary hover:bg-primary/90 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save to chat"}
          </button>
        </div>
      </div>
    </div>
  );
}
