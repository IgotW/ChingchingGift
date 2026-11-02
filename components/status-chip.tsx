import type { EventStatus } from "@/lib/types";
import { eventStatusMeta } from "@/lib/format";

export function StatusChip({
  status,
  className = "",
}: {
  status: EventStatus;
  className?: string;
}) {
  const meta = eventStatusMeta[status];
  return (
    <span
      className={`chip ${meta.tone} ${className}`}
      title={meta.description}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {meta.label}
    </span>
  );
}
