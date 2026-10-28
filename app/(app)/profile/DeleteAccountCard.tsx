'use client';

import React, { useState, useTransition } from 'react';
import { Alert, Button, Card, Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger, Input } from '@/components/ui';
import { DELETE_CONFIRMATION } from '@/lib/account-deletion-constants';
import { deleteAccountAction } from './delete-action';

/** Danger zone at the bottom of the profile page. Google-only accounts have no password to ask for. */
export default function DeleteAccountCard({ hasPassword }: { hasPassword: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, startDeleting] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    startDeleting(async () => {
      const result = await deleteAccountAction(formData);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <Card tone="card" shadow="md" className="flex flex-col gap-4 lg:col-span-12">
      <div>
        <h2 className="m-0 font-grotesk text-2xl font-bold">Delete account</h2>
        <p className="m-0 mt-1 text-fg-muted">
          Permanently delete your account, profile, messages, focus history and everything else tied to it. Study groups and channels you run pass to their longest-standing member. This can&apos;t be undone.
        </p>
      </div>
      <Dialog onOpenChange={() => setError(null)}>
        <DialogTrigger asChild>
          <Button type="button" variant="danger" className="self-start">
            Delete my account
          </Button>
        </DialogTrigger>
        <DialogContent title="Delete your account?" description="Everything is removed right away and can't be recovered.">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input id="delete-confirmation" name="confirmation" label={`Type ${DELETE_CONFIRMATION} to confirm`} autoComplete="off" required />
            {hasPassword && <Input id="delete-password" name="password" type="password" label="Your password" autoComplete="current-password" required />}
            {error && <Alert tone="error">{error}</Alert>}
            <DialogFooter className="mt-2">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" variant="danger" loading={isDeleting}>
                {isDeleting ? 'Deleting' : 'Delete permanently'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
