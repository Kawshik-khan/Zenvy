"use client";

import React, { useState } from "react";
import { Alert, Button, Dialog, DialogContent, DialogFooter, Textarea } from "@/components/ui";
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
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent title="Call note" description="Shared with everyone in this chat." className="quiet">
        <div className="flex flex-col gap-3">
          <Textarea
            id="call-note"
            label="Note"
            labelHidden
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write a note to share in chat"
            rows={6}
            maxLength={CALL_NOTE_MAX_LENGTH + 50}
            disabled={saving}
            error={tooLong ? `Keep it under ${CALL_NOTE_MAX_LENGTH} characters.` : undefined}
            autoFocus
          />
          <p className="m-0 text-sm font-bold text-fg-muted" aria-live="polite">
            {trimmedLength}/{CALL_NOTE_MAX_LENGTH}
          </p>
          {error && <Alert tone="error">{error}</Alert>}
          {saved && <Alert tone="success">Note sent to chat.</Alert>}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="focus" onClick={handleSave} disabled={!content.trim() || tooLong} loading={saving}>
            {saving ? "Saving" : "Save to chat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
