import { describe, expect, it } from "vitest";
import {
  AccessError,
  assertClientOwnsMembership,
  assertCoachManagesMembership,
  type Principal,
} from "@/modules/access/guard";

const client: Principal = { userId: "u_client", role: "CLIENT" };
const coach: Principal = { userId: "u_coach", role: "COACH", coachProfileId: "cp_1" };
const admin: Principal = { userId: "u_admin", role: "ADMIN" };

describe("access guards", () => {
  it("lets a client reach only their own membership", () => {
    expect(() => assertClientOwnsMembership(client, { clientId: "u_client" })).not.toThrow();
    expect(() => assertClientOwnsMembership(client, { clientId: "someone_else" })).toThrow(
      AccessError,
    );
  });

  it("blocks a coach from a membership they do not manage", () => {
    expect(() => assertCoachManagesMembership(coach, { coachId: "cp_1" })).not.toThrow();
    expect(() => assertCoachManagesMembership(coach, { coachId: "cp_2" })).toThrow(AccessError);
  });

  it("lets an admin reach any membership", () => {
    expect(() => assertCoachManagesMembership(admin, { coachId: "cp_9" })).not.toThrow();
  });

  it("stops a client from using a coach guard", () => {
    expect(() => assertCoachManagesMembership(client, { coachId: null })).toThrow(AccessError);
  });
});
