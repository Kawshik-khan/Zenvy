"use client";

import { useActionState } from "react";
import { Alert, Button, Checkbox, ImageDropzone, Input, Select, Textarea } from "@/components/ui";
import { APPLY_METHODS, JOB_TYPE_LABELS, JOB_TYPES, MAX_IMAGES, WORK_MODE_LABELS, WORK_MODES } from "@/lib/jobs/schema";
import { createJobAction, type CreateJobState } from "../actions";

const APPLY_LABELS = { LINK: "Link to apply", EMAIL: "Email", MESSAGE: "Message me on Zenvy" } as const;

function isoDate(daysAhead: number) {
  return new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function JobForm({ unverified = false }: { unverified?: boolean }) {
  const [state, formAction, pending] = useActionState<CreateJobState, FormData>(createJobAction, undefined);
  const errors = state?.errors ?? {};
  const values = state?.values ?? {};
  const failed = Object.keys(errors).length > 0;

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      {unverified && <Alert tone="warning">Verify your email before you post. Check your inbox for the link.</Alert>}
      {state?.message && <Alert tone="error">{state.message}</Alert>}
      {failed && <Alert tone="error">Some fields need attention. They are marked below.</Alert>}

      <div className="grid gap-5 md:grid-cols-2">
        <Select id="job-type" name="type" label="Type" defaultValue={values.type ?? "INTERNSHIP"} error={errors.type}>
          {JOB_TYPES.map((type) => (
            <option key={type} value={type}>
              {JOB_TYPE_LABELS[type]}
            </option>
          ))}
        </Select>
        <Select id="job-mode" name="workMode" label="Work mode" defaultValue={values.workMode ?? "ONSITE"} error={errors.workMode}>
          {WORK_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {WORK_MODE_LABELS[mode]}
            </option>
          ))}
        </Select>
        <Input id="job-title" name="title" label="Title" maxLength={120} required defaultValue={values.title} error={errors.title} placeholder="Frontend intern" className="md:col-span-2" />
        <Input id="job-company" name="company" label="Company" maxLength={120} required defaultValue={values.company} error={errors.company} placeholder="Acme Ltd" />
        <Input id="job-location" name="location" label="Location" maxLength={120} required defaultValue={values.location} error={errors.location} placeholder="Dhaka, or Remote" />
        <Input id="job-pay" name="pay" label="Pay (optional)" maxLength={80} defaultValue={values.pay} error={errors.pay} placeholder="BDT 15,000 per month" />
        <Input
          id="job-deadline"
          name="deadline"
          type="date"
          label="Apply by"
          min={isoDate(1)}
          max={isoDate(90)}
          required
          defaultValue={values.deadline}
          error={errors.deadline}
          hint="Between tomorrow and 90 days from now."
        />
        <Textarea
          id="job-description"
          name="description"
          label="Description"
          rows={8}
          maxLength={5000}
          required
          defaultValue={values.description}
          error={errors.description}
          hint="What the work is, who it suits, and how to apply. Plain text."
          className="md:col-span-2"
        />
        <Input id="job-tags" name="tags" label="Tags (optional)" defaultValue={values.tags} error={errors.tags} placeholder="react, design, remote" hint="Comma separated, up to 8." className="md:col-span-2" />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Select id="job-apply" name="applyMethod" label="How to apply" defaultValue={values.applyMethod ?? "LINK"} error={errors.applyMethod}>
          {APPLY_METHODS.map((method) => (
            <option key={method} value={method}>
              {APPLY_LABELS[method]}
            </option>
          ))}
        </Select>
        <Input
          id="job-apply-target"
          name="applyTarget"
          label="Link or email"
          defaultValue={values.applyTarget}
          error={errors.applyTarget}
          hint="Needed for Link and Email. Links must start with https://."
          placeholder="https://acme.example/careers"
        />
      </div>

      <ImageDropzone id="job-images" name="images" label="Images (optional)" maxFiles={MAX_IMAGES} maxSizeMB={5} error={errors.images} hint={`Poster, notice or office photo. Up to ${MAX_IMAGES}, 5 MB each. Location data is removed.`} />

      <div className="rounded-nb border-2 border-line bg-canvas p-4">
        <Checkbox
          id="job-no-fee"
          name="noFee"
          defaultChecked={values.noFee === "on"}
          label={
            <>
              <span className="block font-bold">Applicants are never asked to pay</span>
              <span className="mt-1 block text-sm text-fg-muted">No fees, deposits or registration charges. Posts that ask for money are removed.</span>
            </>
          }
        />
        {errors.noFee && (
          <p role="alert" className="m-0 mt-2 text-sm font-bold">
            {errors.noFee}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" variant="career" size="lg" loading={pending} disabled={unverified}>
          {pending ? "Posting" : "Post job"}
        </Button>
      </div>
    </form>
  );
}
