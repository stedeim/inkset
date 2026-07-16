import type { Tier } from "@prisma/client";

/**
 * Tier access policy. This is the single source of truth for how the three
 * membership tiers differ in access, response SLAs, and surfaced UI. Enforced
 * server-side; the UI reads the same definitions so display and permission
 * never drift apart.
 */

export type TierCapabilities = {
  label: string;
  /** Marketing/positioning line — never mentions "AI". */
  positioning: string;
  /** Guaranteed async message response time, in hours. */
  asyncResponseSlaHours: number;
  /** Scheduled coaching calls included per month. */
  callsPerMonth: number;
  /** Whether priority (front-of-queue) async messaging is enabled. */
  priorityMessaging: boolean;
  /** Whether the client may request ad-hoc calls outside the schedule. */
  onDemandCalls: boolean;
  /** Whether the private-office concierge surface is available. */
  privateOffice: boolean;
};

export const TIER_CAPABILITIES: Record<Tier, TierCapabilities> = {
  TIER_1: {
    label: "High-End Premium",
    positioning: "A clear, realistic routine you can actually follow.",
    asyncResponseSlaHours: 48,
    callsPerMonth: 1,
    priorityMessaging: false,
    onDemandCalls: false,
    privateOffice: false,
  },
  TIER_2: {
    label: "Elite Concierge",
    positioning: "Weekly guidance and priority access to your coach.",
    asyncResponseSlaHours: 12,
    callsPerMonth: 4,
    priorityMessaging: true,
    onDemandCalls: false,
    privateOffice: false,
  },
  TIER_3: {
    label: "Private Office",
    positioning: "Your health and performance, managed like your wealth.",
    asyncResponseSlaHours: 2,
    callsPerMonth: 12,
    priorityMessaging: true,
    onDemandCalls: true,
    privateOffice: true,
  },
};

export function capabilitiesFor(tier: Tier): TierCapabilities {
  return TIER_CAPABILITIES[tier];
}

/** Whether a given tier is permitted to use a named capability. */
export function tierAllows(
  tier: Tier,
  capability: keyof Pick<
    TierCapabilities,
    "priorityMessaging" | "onDemandCalls" | "privateOffice"
  >,
): boolean {
  return TIER_CAPABILITIES[tier][capability] === true;
}
