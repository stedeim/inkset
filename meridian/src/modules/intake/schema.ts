import { z } from "zod";

// Structured intake. Each group is validated and then stored as JSON on the
// Intake row, keeping the questionnaire flexible while still typed end to end.

export const primaryGoalSchema = z.enum([
  "energy",
  "body_composition",
  "performance",
  "longevity",
]);

export const travelFrequencySchema = z.enum(["rare", "monthly", "weekly", "constant"]);

const scale1to5 = z.coerce.number().int().min(1).max(5);

export const goalsSchema = z.object({
  primaryGoal: primaryGoalSchema,
  successLooksLike: z.string().trim().min(1, "Tell us what success looks like").max(1000),
});

export const constraintsSchema = z.object({
  weeklyHours: z.coerce.number().min(0).max(40),
  travelFrequency: travelFrequencySchema,
  dietaryPreferences: z.string().trim().max(500).optional().default(""),
  scheduleNotes: z.string().trim().max(1000).optional().default(""),
});

export const habitsSchema = z.object({
  sleepHours: z.coerce.number().min(0).max(16),
  trainingDaysPerWeek: z.coerce.number().int().min(0).max(7),
  nutritionQuality: scale1to5,
  stressLevel: scale1to5,
});

export const intakeSchema = z.object({
  goals: goalsSchema,
  constraints: constraintsSchema,
  currentHabits: habitsSchema,
  consent: z.literal(true, {
    errorMap: () => ({ message: "Please accept the privacy agreement to continue" }),
  }),
});

export type IntakeInput = z.infer<typeof intakeSchema>;
export type Goals = z.infer<typeof goalsSchema>;
export type Constraints = z.infer<typeof constraintsSchema>;
export type Habits = z.infer<typeof habitsSchema>;

export const PRIMARY_GOAL_LABELS: Record<z.infer<typeof primaryGoalSchema>, string> = {
  energy: "More energy",
  body_composition: "Body composition & appearance",
  performance: "Focus & performance",
  longevity: "Longevity & healthspan",
};

export const TRAVEL_LABELS: Record<z.infer<typeof travelFrequencySchema>, string> = {
  rare: "Rarely",
  monthly: "A few times a month",
  weekly: "Most weeks",
  constant: "Almost constantly",
};
