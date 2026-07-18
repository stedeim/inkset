import { describe, expect, it } from "vitest";
import { capabilitiesFor, tierAllows, TIER_CAPABILITIES } from "@/modules/tiers/policy";

describe("tier policy", () => {
  it("escalates async SLA as tier increases", () => {
    expect(capabilitiesFor("TIER_1").asyncResponseSlaHours).toBeGreaterThan(
      capabilitiesFor("TIER_2").asyncResponseSlaHours,
    );
    expect(capabilitiesFor("TIER_2").asyncResponseSlaHours).toBeGreaterThan(
      capabilitiesFor("TIER_3").asyncResponseSlaHours,
    );
  });

  it("grants priority messaging only to Tier 2 and above", () => {
    expect(tierAllows("TIER_1", "priorityMessaging")).toBe(false);
    expect(tierAllows("TIER_2", "priorityMessaging")).toBe(true);
    expect(tierAllows("TIER_3", "priorityMessaging")).toBe(true);
  });

  it("reserves the private office and on-demand calls for Tier 3", () => {
    expect(tierAllows("TIER_1", "privateOffice")).toBe(false);
    expect(tierAllows("TIER_2", "privateOffice")).toBe(false);
    expect(tierAllows("TIER_3", "privateOffice")).toBe(true);
    expect(tierAllows("TIER_3", "onDemandCalls")).toBe(true);
  });

  it("never leads positioning copy with AI", () => {
    for (const tier of Object.values(TIER_CAPABILITIES)) {
      expect(tier.positioning.toLowerCase()).not.toContain("ai");
    }
  });
});
