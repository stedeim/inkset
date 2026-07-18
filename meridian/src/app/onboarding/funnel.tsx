"use client";

import { useEffect, useMemo, useState } from "react";
import { completeOnboarding } from "@/modules/intake/actions";

type Choice = { value: string; title: string; sub?: string };
type Question =
  | { key: string; kind: "choice"; q: string; choices: Choice[] }
  | { key: string; kind: "text"; q: string; placeholder: string; optional?: boolean };

const FOCUS_LABEL: Record<string, string> = {
  energy: "Sustained energy",
  body: "A stronger, leaner body",
  focus: "Sharper focus & output",
  longevity: "More years in good health",
};
const PILLARS: Record<string, [string, string][]> = {
  energy: [["Rhythm", "Circadian anchoring"], ["Fuel", "Metabolic steadiness"], ["Recovery", "Strategic downshifts"]],
  body: [["Strength", "Progressive training"], ["Nutrition", "Protein-forward, travel-proof"], ["Signal", "Body-composition tracking"]],
  focus: [["Architecture", "Deep-work protection"], ["Fuel", "Cognitive nutrition"], ["Regulation", "Nervous-system balance"]],
  longevity: [["Base", "Cardiometabolic capacity"], ["Aerobic", "Zone 2 development"], ["Diagnostics", "Longevity panels"]],
};

// Buckets map premium, human-worded answers back to the schema's numeric fields.
const SLEEP_HOURS: Record<string, number> = { under6: 5, "6to7": 6.5, "7to8": 7.5, well: 8 };
const TRAIN_DAYS: Record<string, number> = { rare: 0, some: 2, regular: 3, most: 6 };
const HOURS: Record<string, number> = { two: 2, four: 4, six: 6, eight: 8 };
const SCALE: Record<string, number> = { low: 2, fair: 3, good: 4, high: 5 };

const QUESTIONS: Question[] = [
  {
    key: "primaryGoal", kind: "choice", q: "What should the coming year make possible?",
    choices: [
      { value: "energy", title: "Steady energy through long days", sub: "Fewer crashes, a higher floor" },
      { value: "body", title: "A stronger, leaner body", sub: "Composition and how you carry yourself" },
      { value: "focus", title: "Sharper focus and output", sub: "Clarity when the stakes are highest" },
      { value: "longevity", title: "More good years ahead", sub: "Healthspan, not just lifespan" },
    ],
  },
  { key: "successLooksLike", kind: "text", q: "In a sentence — what would success look like?", placeholder: "When this is working, I…" },
  {
    key: "sleep", kind: "choice", q: "How do you sleep?",
    choices: [
      { value: "under6", title: "Under 6 hours" },
      { value: "6to7", title: "6 to 7 hours" },
      { value: "7to8", title: "7 to 8 hours" },
      { value: "well", title: "I sleep well" },
    ],
  },
  {
    key: "training", kind: "choice", q: "How often are you training now?",
    choices: [
      { value: "rare", title: "Rarely, if I'm honest" },
      { value: "some", title: "One or two times a week" },
      { value: "regular", title: "Three or four times" },
      { value: "most", title: "Most days" },
    ],
  },
  {
    key: "nutrition", kind: "choice", q: "How would you rate your nutrition today?",
    choices: [
      { value: "low", title: "Inconsistent" },
      { value: "fair", title: "Fair — room to improve" },
      { value: "good", title: "Mostly dialed in" },
      { value: "high", title: "Excellent" },
    ],
  },
  {
    key: "stress", kind: "choice", q: "And your stress?",
    choices: [
      { value: "low", title: "Well managed" },
      { value: "fair", title: "Manageable most days" },
      { value: "good", title: "Often elevated" },
      { value: "high", title: "Constantly high" },
    ],
  },
  {
    key: "hours", kind: "choice", q: "How many hours a week can you protect for this?",
    choices: [
      { value: "two", title: "Around two" },
      { value: "four", title: "Four or so" },
      { value: "six", title: "Six" },
      { value: "eight", title: "Eight or more" },
    ],
  },
  {
    key: "travel", kind: "choice", q: "How much does travel disrupt your routine?",
    choices: [
      { value: "rare", title: "Rarely — I'm mostly in one place" },
      { value: "monthly", title: "A few times a month" },
      { value: "weekly", title: "Most weeks" },
      { value: "constant", title: "Almost constantly" },
    ],
  },
  { key: "context", kind: "text", q: "Anything we should know?", placeholder: "Travel, diet, preferences, constraints…", optional: true },
];

type View = "welcome" | "review" | "reveal" | "consent" | number;

export function OnboardingFunnel({ firstName }: { firstName: string }) {
  const [view, setView] = useState<View>("welcome");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const focus = answers.primaryGoal || "energy";
  const totalQ = QUESTIONS.length;

  const stepNumber = typeof view === "number" ? view + 1 : null;
  const progress =
    view === "welcome" ? 0 : typeof view === "number" ? ((view + 1) / totalQ) * 100 : 100;

  function answerChoice(key: string, value: string) {
    setAnswers((a) => ({ ...a, [key]: value }));
    advance();
  }

  function advance() {
    setView((v) => {
      if (v === "welcome") return 0;
      if (typeof v === "number") return v + 1 < totalQ ? v + 1 : "review";
      return v;
    });
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    const payload = {
      goals: { primaryGoal: focus, successLooksLike: answers.successLooksLike || "" },
      constraints: {
        weeklyHours: HOURS[answers.hours] ?? 4,
        travelFrequency: answers.travel || "monthly",
        dietaryPreferences: "",
        scheduleNotes: answers.context || "",
      },
      currentHabits: {
        sleepHours: SLEEP_HOURS[answers.sleep] ?? 7,
        trainingDaysPerWeek: TRAIN_DAYS[answers.training] ?? 2,
        nutritionQuality: SCALE[answers.nutrition] ?? 3,
        stressLevel: SCALE[answers.stress] ?? 3,
      },
      consent: true,
    };
    const res = await completeOnboarding(payload);
    if (res && res.ok === false) {
      setSubmitting(false);
      setError("Something didn't save. Please try again, or contact your concierge.");
    }
  }

  const pillars = useMemo(() => PILLARS[focus] ?? PILLARS.energy, [focus]);

  return (
    <div className="funnel">
      <div className="funnel__progress" style={{ width: `${progress}%` }} />
      <div className="funnel__wordmark">MERIDIAN</div>
      {stepNumber && (
        <div className="funnel__index">
          {String(stepNumber).padStart(2, "0")} — {String(totalQ).padStart(2, "0")}
        </div>
      )}

      <div className="funnel__stage">
        {view === "welcome" && (
          <div className="funnel__screen" key="welcome">
            <p className="funnel__eyebrow">Welcome, {firstName}</p>
            <h1 className="funnel__display">Let’s shape your protocol.</h1>
            <p className="funnel__lede">
              A few questions so your team can build something precise — and something you can
              actually keep. This stays private to you and your coaching team.
            </p>
            <button className="funnel__cta" onClick={advance}>
              Begin <span aria-hidden>→</span>
            </button>
          </div>
        )}

        {typeof view === "number" && <QuestionView key={view} q={QUESTIONS[view]} answers={answers} onChoice={answerChoice} onText={(key, val) => { setAnswers((a) => ({ ...a, [key]: val })); advance(); }} />}

        {view === "review" && <Reviewing key="review" onDone={() => setView("reveal")} />}

        {view === "reveal" && (
          <div className="funnel__screen" key="reveal">
            <p className="funnel__eyebrow">Your preliminary protocol</p>
            <h1 className="funnel__question">{firstName}, here is where we would begin.</h1>
            <p className="funnel__lede">Shaped from what you shared. Your team refines it with you before anything is set.</p>
            <div style={{ marginTop: 34 }}>
              <div className="funnel__k" style={{ fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--f-stone)" }}>Primary focus</div>
              <div className="funnel__revealfocus">{FOCUS_LABEL[focus]}</div>
            </div>
            <div className="funnel__pillars">
              {pillars.map(([k, v]) => (
                <div className="funnel__pillar" key={k}>
                  <div className="funnel__k">{k}</div>
                  <div className="funnel__v">{v}</div>
                </div>
              ))}
            </div>
            <div className="funnel__team">
              <div><div className="funnel__role">Physician</div><div className="funnel__name">Dr. Elena Voss</div></div>
              <div><div className="funnel__role">Performance coach</div><div className="funnel__name">Marcus Hale</div></div>
              <div><div className="funnel__role">Concierge</div><div className="funnel__name">Sophie Lang</div></div>
            </div>
            <button className="funnel__cta" onClick={() => setView("consent")}>
              Continue <span aria-hidden>→</span>
            </button>
          </div>
        )}

        {view === "consent" && (
          <div className="funnel__screen" key="consent">
            <p className="funnel__eyebrow">Privacy</p>
            <h1 className="funnel__question">Your information stays between us.</h1>
            <p className="funnel__lede">
              Everything you share is confidential to you and your coaching team, held securely, and
              never sold or shared.
            </p>
            <label className="funnel__consent">
              <input type="checkbox" checked disabled readOnly />
              <span>
                I agree to the confidential handling of my health information for the purpose of my
                coaching, and to the privacy agreement.
              </span>
            </label>
            <div>
              <button className="funnel__cta" onClick={submit} disabled={submitting}>
                {submitting ? "Preparing your dashboard…" : "Enter Meridian"} <span aria-hidden>→</span>
              </button>
            </div>
            {error && <p style={{ marginTop: 18, color: "#d98b6a", fontSize: "0.9rem" }}>{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionView({
  q,
  answers,
  onChoice,
  onText,
}: {
  q: Question;
  answers: Record<string, string>;
  onChoice: (key: string, value: string) => void;
  onText: (key: string, value: string) => void;
}) {
  const [text, setText] = useState(answers[q.key] ?? "");

  if (q.kind === "choice") {
    return (
      <div className="funnel__screen">
        <h1 className="funnel__question">{q.q}</h1>
        <div className="funnel__options">
          {q.choices.map((c) => (
            <button key={c.value} className="funnel__option" onClick={() => onChoice(q.key, c.value)}>
              <span>
                {c.title}
                {c.sub && <span className="funnel__sub">{c.sub}</span>}
              </span>
              <span className="funnel__mark">select →</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const canContinue = q.optional || text.trim().length > 0;
  return (
    <div className="funnel__screen">
      <h1 className="funnel__question">{q.q}</h1>
      <div className="funnel__field">
        <textarea
          rows={2}
          placeholder={q.placeholder}
          value={text}
          autoFocus
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && canContinue) {
              e.preventDefault();
              onText(q.key, text.trim());
            }
          }}
        />
        <button className="funnel__cta" style={{ alignSelf: "flex-start" }} disabled={!canContinue} onClick={() => onText(q.key, text.trim())}>
          Continue <span aria-hidden>→</span>
        </button>
        {q.optional && (
          <button className="funnel__skip" onClick={() => onText(q.key, "")}>
            Skip this
          </button>
        )}
      </div>
    </div>
  );
}

function Reviewing({ onDone }: { onDone: () => void }) {
  const steps = [
    "Reviewing your responses…",
    "Mapping your primary focus…",
    "Assembling the team that fits…",
    "Shaping your first ninety days…",
  ];
  const [i, setI] = useState(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gap = reduce ? 650 : 1050;
    let n = 0;
    const timer = setInterval(() => {
      n += 1;
      if (n < steps.length) setI(n);
      else {
        clearInterval(timer);
        setTimeout(onDone, reduce ? 400 : 850);
      }
    }, gap);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="funnel__screen">
      <p className="funnel__eyebrow">In review</p>
      <h1 className="funnel__question">Preparing your protocol.</h1>
      <div className="funnel__reviewline" />
      <p className="funnel__status">{steps[i]}</p>
    </div>
  );
}
