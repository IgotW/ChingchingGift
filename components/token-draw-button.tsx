"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/types";
import { SubmitButton } from "./submit-button";

/**
 * The no-sign-in draw button. The personal token is the credential, so the
 * simplest possible flow works for guests who are not comfortable with Google
 * sign-in: open the link, tap one button, see the recipient.
 */
export function TokenDrawButton({
  action,
  token,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  token: string;
}) {
  const [state, formAction] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      {state?.error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {state.error}
        </p>
      ) : null}

      <SubmitButton
        label="Draw my name now"
        pendingLabel="Drawing names…"
        className="btn btn-primary px-7 py-3 text-base"
      />
    </form>
  );
}
