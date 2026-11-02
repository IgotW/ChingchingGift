"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import type { ActionState } from "@/lib/types";
import { SubmitButton } from "./submit-button";

type ActionFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  submitLabel: string;
  pendingLabel?: string;
  className?: string;
  buttonClassName?: string;
  resetOnSuccess?: boolean;
  confirm?: string;
  footer?: ReactNode;
  successTone?: "inline" | "quiet";
};

export function ActionForm({
  action,
  children,
  submitLabel,
  pendingLabel,
  className = "space-y-4",
  buttonClassName = "btn btn-primary",
  resetOnSuccess = false,
  confirm,
  footer,
  successTone = "inline",
}: ActionFormProps) {
  const [state, formAction] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success && resetOnSuccess) {
      formRef.current?.reset();
    }
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className={className}
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
    >
      {children}

      {state?.error ? (
        <p
          role="alert"
          className="rounded-xl border border-holly-600/25 bg-holly-100/70 px-3.5 py-2.5 text-sm font-medium text-holly-700"
        >
          {state.error}
        </p>
      ) : null}

      {state?.success && successTone === "inline" ? (
        <p
          role="status"
          className="rounded-xl border border-pine-600/20 bg-pine-100/70 px-3.5 py-2.5 text-sm font-medium text-pine-800"
        >
          {state.success}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton
          label={submitLabel}
          pendingLabel={pendingLabel}
          className={buttonClassName}
        />
        {footer}
      </div>
    </form>
  );
}
