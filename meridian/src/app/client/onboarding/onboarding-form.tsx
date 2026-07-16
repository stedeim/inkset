"use client";

import { useActionState } from "react";
import { submitIntakeAction, type IntakeFormState } from "@/modules/intake/actions";
import { PRIMARY_GOAL_LABELS, TRAVEL_LABELS } from "@/modules/intake/schema";

const initial: IntakeFormState = {};

function Err({ state, name }: { state: IntakeFormState; name: string }) {
  const msg = state.fieldErrors?.[name];
  return msg ? <p className="field-error">{msg}</p> : null;
}

export function OnboardingForm({ firstName }: { firstName: string }) {
  const [state, action, pending] = useActionState(submitIntakeAction, initial);

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-brass)]">Welcome, {firstName}</p>
      <h1 className="mt-4 font-serif text-4xl text-[var(--color-ink)]">Let’s tailor your program</h1>
      <p className="mt-3 max-w-xl text-[var(--color-stone)]">
        A few questions so your coach can build a plan that fits your life. This stays private to you
        and your coaching team.
      </p>

      <form action={action} className="mt-8 space-y-6">
        <section className="section-card">
          <h2 className="section-title">What matters most</h2>
          <p className="section-hint">Where you’d most like to see change first.</p>
          <div className="space-y-5">
            <div>
              <label htmlFor="primaryGoal" className="field-label">Primary focus</label>
              <select id="primaryGoal" name="primaryGoal" className="field-input" defaultValue="energy">
                {Object.entries(PRIMARY_GOAL_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <Err state={state} name="primaryGoal" />
            </div>
            <div>
              <label htmlFor="successLooksLike" className="field-label">What would success look like?</label>
              <textarea
                id="successLooksLike"
                name="successLooksLike"
                className="field-input"
                placeholder="e.g. Steady energy through the afternoon, back to my target weight, sharper focus in meetings."
              />
              <Err state={state} name="successLooksLike" />
            </div>
          </div>
        </section>

        <section className="section-card">
          <h2 className="section-title">Your life &amp; constraints</h2>
          <p className="section-hint">So the plan is something you can actually keep.</p>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="weeklyHours" className="field-label">Hours per week you can invest</label>
              <input id="weeklyHours" name="weeklyHours" type="number" min={0} max={40} step={0.5} className="field-input" defaultValue={4} />
              <Err state={state} name="weeklyHours" />
            </div>
            <div>
              <label htmlFor="travelFrequency" className="field-label">How often you travel</label>
              <select id="travelFrequency" name="travelFrequency" className="field-input" defaultValue="monthly">
                {Object.entries(TRAVEL_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <Err state={state} name="travelFrequency" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="dietaryPreferences" className="field-label">Dietary preferences or restrictions (optional)</label>
              <input id="dietaryPreferences" name="dietaryPreferences" className="field-input" placeholder="e.g. pescatarian, no dairy" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="scheduleNotes" className="field-label">Anything about your schedule we should know? (optional)</label>
              <textarea id="scheduleNotes" name="scheduleNotes" className="field-input" placeholder="e.g. early starts, frequent evening dinners, weekends with family." />
            </div>
          </div>
        </section>

        <section className="section-card">
          <h2 className="section-title">Where you are now</h2>
          <p className="section-hint">An honest baseline — there are no wrong answers.</p>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="sleepHours" className="field-label">Typical hours of sleep</label>
              <input id="sleepHours" name="sleepHours" type="number" min={0} max={16} step={0.5} className="field-input" defaultValue={7} />
              <Err state={state} name="sleepHours" />
            </div>
            <div>
              <label htmlFor="trainingDaysPerWeek" className="field-label">Training days per week</label>
              <input id="trainingDaysPerWeek" name="trainingDaysPerWeek" type="number" min={0} max={7} className="field-input" defaultValue={2} />
              <Err state={state} name="trainingDaysPerWeek" />
            </div>
            <div>
              <label htmlFor="nutritionQuality" className="field-label">Nutrition quality (1–5)</label>
              <select id="nutritionQuality" name="nutritionQuality" className="field-input" defaultValue="3">
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <Err state={state} name="nutritionQuality" />
            </div>
            <div>
              <label htmlFor="stressLevel" className="field-label">Stress level (1–5)</label>
              <select id="stressLevel" name="stressLevel" className="field-input" defaultValue="3">
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <Err state={state} name="stressLevel" />
            </div>
          </div>
        </section>

        <section className="section-card">
          <h2 className="section-title">Privacy &amp; consent</h2>
          <p className="section-hint">Your data is confidential to you and your coaching team.</p>
          <label className="flex items-start gap-3 text-sm text-[var(--color-ink)]">
            <input type="checkbox" name="consent" className="mt-1" />
            <span>
              I agree to the confidential handling of my health information for the purpose of my
              coaching, and to the privacy agreement.
            </span>
          </label>
          <Err state={state} name="consent" />
        </section>

        {state.error && <p className="field-error">{state.error}</p>}

        <div className="max-w-xs">
          <button type="submit" className="btn-primary" disabled={pending}>
            {pending ? "Saving…" : "Complete onboarding"}
          </button>
        </div>
      </form>
    </div>
  );
}
