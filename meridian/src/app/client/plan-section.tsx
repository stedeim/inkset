import type { Completion, PlanItem } from "@prisma/client";
import { KIND_LABELS } from "@/modules/plan/labels";
import { toggleCompletionAction } from "@/modules/plan/actions";

type Item = PlanItem & { completions: Completion[] };

function StatusButton({
  planItemId,
  status,
  label,
  active,
}: {
  planItemId: string;
  status: "COMPLETED" | "SKIPPED";
  label: string;
  active: boolean;
}) {
  return (
    <form action={toggleCompletionAction}>
      <input type="hidden" name="planItemId" value={planItemId} />
      <input type="hidden" name="status" value={active ? "PENDING" : status} />
      <button
        type="submit"
        className="rounded border px-3 py-1.5 text-xs transition-colors"
        style={{
          borderColor: active ? "var(--color-sage)" : "#e4ded4",
          background: active ? "rgba(74,103,65,0.1)" : "#fff",
          color: active ? "var(--color-sage)" : "var(--color-stone)",
        }}
      >
        {active ? `✓ ${label}` : label}
      </button>
    </form>
  );
}

export function PlanSection({ items }: { items: Item[] }) {
  return (
    <section className="mt-8">
      <h2 className="section-title">Today’s plan</h2>
      {items.length === 0 ? (
        <p className="section-hint">Nothing scheduled for today. Your coach will add items here.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => {
            const status = item.completions[0]?.status ?? "PENDING";
            return (
              <li key={item.id} className="section-card flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-brass)]">
                    {KIND_LABELS[item.kind]}
                  </p>
                  <p className="text-[var(--color-ink)]">{item.title}</p>
                  {item.details && (
                    <p className="mt-0.5 text-sm text-[var(--color-stone)]">{item.details}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <StatusButton
                    planItemId={item.id}
                    status="COMPLETED"
                    label="Done"
                    active={status === "COMPLETED"}
                  />
                  <StatusButton
                    planItemId={item.id}
                    status="SKIPPED"
                    label="Skip"
                    active={status === "SKIPPED"}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
