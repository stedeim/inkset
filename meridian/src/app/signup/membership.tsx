"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signupAction, type FormState } from "@/modules/auth/actions";
import type { Tier } from "@prisma/client";

const initial: FormState = {};

type TierCard = {
  value: Tier;
  name: string;
  price: string;
  per: string;
  rec?: string;
  featured?: boolean;
  desc: string;
  feats: string[];
};

// Order and pricing chosen for anchoring: the $200k Private Office sits to the
// right so Elite reads as the measured choice.
const TIERS: TierCard[] = [
  {
    value: "TIER_1",
    name: "Premium",
    price: "$30,000",
    per: "/ year",
    desc: "For the self-directed who want a plan they trust and a team on call.",
    feats: [
      "Monthly physician-led review",
      "Weekly asynchronous coaching",
      "Quarterly diagnostic panel",
      "Your plan, kept current",
    ],
  },
  {
    value: "TIER_2",
    name: "Elite Concierge",
    price: "$75,000",
    per: "/ year",
    rec: "Most members",
    featured: true,
    desc: "Weekly guidance and priority access to a coach who knows your life.",
    feats: [
      "Weekly coaching calls",
      "Priority messaging — within 12 hours",
      "Full diagnostic and biomarker panel",
      "Dedicated coach and concierge",
      "Travel-proof programming",
    ],
  },
  {
    value: "TIER_3",
    name: "Private Office",
    price: "$200,000",
    per: "– 300,000 / year",
    rec: "By invitation",
    desc: "Your health and performance, run like a family office.",
    feats: [
      "Near-immediate access — within 2 hours",
      "On-demand calls, any day",
      "Full medical and performance team",
      "In-home and travel coordination",
      "Complete discretion",
    ],
  },
];

export function MembershipApplication() {
  const [phase, setPhase] = useState<"tiers" | "apply">("tiers");
  const [tier, setTier] = useState<TierCard>(TIERS[1]);
  const [state, action, pending] = useActionState(signupAction, initial);

  return (
    <div className="funnel">
      <div className="funnel__wordmark">MERIDIAN</div>

      <div className="funnel__stage">
        {phase === "tiers" ? (
          <div className="funnel__screen funnel__screen--wide" key="tiers">
            <p className="funnel__eyebrow" style={{ textAlign: "center" }}>Membership · by application</p>
            <h1 className="funnel__question" style={{ textAlign: "center" }}>
              Assembling this team yourself would cost far more.
            </h1>
            <div className="funnel__tiers">
              {TIERS.map((t) => (
                <div key={t.value} className={"funnel__tier" + (t.featured ? " funnel__tier--featured" : "")}>
                  <div className="funnel__rec">{t.rec ?? " "}</div>
                  <div className="funnel__tname">{t.name}</div>
                  <div className="funnel__price">
                    {t.price} <span>{t.per}</span>
                  </div>
                  <div className="funnel__tdesc">{t.desc}</div>
                  <ul>
                    {t.feats.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="funnel__pick"
                    onClick={() => {
                      setTier(t);
                      setPhase("apply");
                    }}
                  >
                    Request membership
                  </button>
                </div>
              ))}
            </div>
            <p className="funnel__assurance">
              Membership is limited and by application. We accept a small number of new members each
              quarter, and your information remains strictly confidential throughout. There is no
              charge until your application is accepted and you have spoken with your concierge.
            </p>
            <p style={{ textAlign: "center", marginTop: 22 }}>
              <Link href="/login" className="funnel__back" style={{ textDecoration: "none" }}>
                Already a member? Sign in
              </Link>
            </p>
          </div>
        ) : (
          <div className="funnel__screen" key="apply">
            <button className="funnel__back" onClick={() => setPhase("tiers")}>
              ← Membership
            </button>
            <p className="funnel__eyebrow" style={{ marginTop: 24 }}>
              {tier.name} · {tier.price}
              <span style={{ color: "var(--f-stone)" }}> {tier.per}</span>
            </p>
            <h1 className="funnel__question">Begin your application.</h1>
            <p className="funnel__lede">A few details to create your private account. Nothing is charged today.</p>

            <form action={action} style={{ marginTop: 36, maxWidth: "32em" }}>
              <input type="hidden" name="tier" value={tier.value} />
              <div style={{ marginBottom: 24 }}>
                <label htmlFor="fullName" className="funnel__flabel">Full name</label>
                <input id="fullName" name="fullName" autoComplete="name" className="funnel__finput" />
                {state.fieldErrors?.fullName && <p className="funnel__ferror">{state.fieldErrors.fullName}</p>}
              </div>
              <div style={{ marginBottom: 24 }}>
                <label htmlFor="email" className="funnel__flabel">Email</label>
                <input id="email" name="email" type="email" autoComplete="email" className="funnel__finput" />
                {state.fieldErrors?.email && <p className="funnel__ferror">{state.fieldErrors.email}</p>}
              </div>
              <div style={{ marginBottom: 8 }}>
                <label htmlFor="password" className="funnel__flabel">Password</label>
                <input id="password" name="password" type="password" autoComplete="new-password" className="funnel__finput" />
                <p style={{ marginTop: 8, fontSize: "0.8rem", color: "var(--f-stone)" }}>At least 12 characters.</p>
                {state.fieldErrors?.password && <p className="funnel__ferror">{state.fieldErrors.password}</p>}
              </div>
              {state.error && <p className="funnel__ferror">{state.error}</p>}
              <button type="submit" className="funnel__cta" disabled={pending}>
                {pending ? "Creating your account…" : "Submit application"} <span aria-hidden>→</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
