"use client";

import { useActionState, useState } from "react";
import type { ActionState, PreviewMember } from "@/lib/types";
import { SubmitButton } from "./submit-button";

export function ClaimNamePicker({
  action,
  members,
  code,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  members: PreviewMember[];
  code: string;
}) {
  const [state, formAction] = useActionState(action, null);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="member_id" value={selected ?? ""} />

      <ul className="grid gap-2 sm:grid-cols-2">
        {members.map((member) => {
          const isSelected = selected === member.id;
          return (
            <li key={member.id}>
              <button
                type="button"
                disabled={member.claimed}
                onClick={() => setSelected(member.id)}
                aria-pressed={isSelected}
                className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                  member.claimed
                    ? "cursor-not-allowed border-cream-200 bg-cream-100/60 text-muted"
                    : isSelected
                      ? "border-pine-700 bg-pine-50 text-pine-950 ring-2 ring-pine-700/20"
                      : "border-cream-200 bg-white text-pine-950 hover:border-pine-300 hover:bg-cream-50"
                }`}
              >
                <span className="font-semibold">{member.name}</span>
                <span
                  className={`shrink-0 text-[0.62rem] font-bold uppercase tracking-[0.12em] ${
                    member.claimed
                      ? "text-muted"
                      : isSelected
                        ? "text-pine-700"
                        : "text-holly-600"
                  }`}
                >
                  {member.claimed ? "Claimed" : isSelected ? "Selected" : "Available"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {state?.error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton
          label={selected ? "Claim this name" : "Pick your name above"}
          pendingLabel="Claiming…"
        />
        <p className="text-xs leading-relaxed text-muted">
          Claiming links this name to your Google account. You can only claim one
          name per exchange.
        </p>
      </div>
    </form>
  );
}
