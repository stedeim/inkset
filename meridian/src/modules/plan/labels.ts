import type { PlanItemKind } from "@prisma/client";

export const KIND_LABELS: Record<PlanItemKind, string> = {
  WORKOUT: "Training",
  HABIT: "Habit",
  RECOVERY: "Recovery",
  NUTRITION: "Nutrition",
  ROUTINE: "Routine",
};

export const KIND_OPTIONS = Object.entries(KIND_LABELS) as [PlanItemKind, string][];
