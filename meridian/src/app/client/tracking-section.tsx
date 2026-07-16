import type { CheckIn } from "@prisma/client";
import { isoDate } from "@/lib/dates";
import { submitCheckInAction } from "@/modules/plan/actions";

function Bars({ checkIns, today }: { checkIns: CheckIn[]; today: Date }) {
  // Last 7 days of energy (1-10) as simple bars; missing days render empty.
  const byDate = new Map(checkIns.map((c) => [isoDate(c.date), c]));
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  return (
    <div className="flex items-end gap-1.5" style={{ height: 64 }}>
      {days.map((d) => {
        const energy = byDate.get(isoDate(d))?.energy ?? null;
        const h = energy ? Math.max(6, (energy / 10) * 64) : 3;
        return (
          <div key={isoDate(d)} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-sm"
              style={{
                height: h,
                background: energy ? "var(--color-brass)" : "#e4ded4",
              }}
              title={energy ? `Energy ${energy}/10` : "No check-in"}
            />
          </div>
        );
      })}
    </div>
  );
}

export function TrackingSection({
  checkIns,
  consistency,
  today,
}: {
  checkIns: CheckIn[];
  consistency: { completed: number; total: number };
  today: Date;
}) {
  const pct =
    consistency.total > 0 ? Math.round((consistency.completed / consistency.total) * 100) : null;

  return (
    <section className="mt-8 grid gap-4 md:grid-cols-2">
      <div className="section-card">
        <h2 className="section-title">Energy — last 7 days</h2>
        <p className="section-hint">A quick read on how you’re trending.</p>
        <Bars checkIns={checkIns} today={today} />
      </div>

      <div className="section-card">
        <h2 className="section-title">Today’s check-in</h2>
        <p className="section-hint">Takes ten seconds. Leave blank to skip a field.</p>
        <form action={submitCheckInAction} className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="energy" className="field-label">Energy 1–10</label>
            <input id="energy" name="energy" type="number" min={1} max={10} className="field-input" />
          </div>
          <div>
            <label htmlFor="sleepHours" className="field-label">Sleep hrs</label>
            <input id="sleepHours" name="sleepHours" type="number" min={0} max={16} step={0.5} className="field-input" />
          </div>
          <div>
            <label htmlFor="mood" className="field-label">Mood 1–10</label>
            <input id="mood" name="mood" type="number" min={1} max={10} className="field-input" />
          </div>
          <div className="col-span-3">
            <button type="submit" className="btn-primary">Save check-in</button>
          </div>
        </form>
        {pct !== null && (
          <p className="mt-4 text-sm text-[var(--color-stone)]">
            Plan consistency (7 days):{" "}
            <span className="text-[var(--color-sage)]">{pct}%</span>
          </p>
        )}
      </div>
    </section>
  );
}
