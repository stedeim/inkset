import { describe, expect, it } from "vitest";
import { intakeSchema } from "@/modules/intake/schema";

const validForm = {
  goals: { primaryGoal: "performance", successLooksLike: "Sharper mornings, steady focus" },
  constraints: { weeklyHours: 5, travelFrequency: "monthly", dietaryPreferences: "", scheduleNotes: "" },
  currentHabits: { sleepHours: 6.5, trainingDaysPerWeek: 3, nutritionQuality: 3, stressLevel: 4 },
  consent: true,
};

describe("intake schema", () => {
  it("accepts a well-formed intake", () => {
    expect(intakeSchema.safeParse(validForm).success).toBe(true);
  });

  it("coerces numeric strings (as they arrive from HTML forms)", () => {
    const parsed = intakeSchema.parse({
      ...validForm,
      currentHabits: { sleepHours: "7", trainingDaysPerWeek: "4", nutritionQuality: "5", stressLevel: "2" },
    });
    expect(parsed.currentHabits.sleepHours).toBe(7);
    expect(parsed.currentHabits.trainingDaysPerWeek).toBe(4);
  });

  it("requires consent to be explicitly true", () => {
    const res = intakeSchema.safeParse({ ...validForm, consent: false });
    expect(res.success).toBe(false);
  });

  it("rejects out-of-range self-ratings", () => {
    const res = intakeSchema.safeParse({
      ...validForm,
      currentHabits: { ...validForm.currentHabits, stressLevel: 9 },
    });
    expect(res.success).toBe(false);
  });

  it("rejects an unknown primary goal", () => {
    const res = intakeSchema.safeParse({
      ...validForm,
      goals: { primaryGoal: "wealth", successLooksLike: "x" },
    });
    expect(res.success).toBe(false);
  });
});
