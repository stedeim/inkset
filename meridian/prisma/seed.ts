import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/modules/auth/passwords";

// Idempotent seed: one coach and one demo client so the app is explorable
// immediately after `npm run db:seed`. Safe to run repeatedly.
const db = new PrismaClient();

async function main() {
  const coachPassword = await hashPassword("coach-demo-passphrase");
  const coach = await db.user.upsert({
    where: { email: "coach@meridian.app" },
    update: {},
    create: {
      email: "coach@meridian.app",
      fullName: "Dr. Elena Voss",
      passwordHash: coachPassword,
      role: "COACH",
      coachProfile: { create: { title: "Head Performance Coach" } },
    },
    include: { coachProfile: true },
  });

  const clientPassword = await hashPassword("client-demo-passphrase");
  const client = await db.user.upsert({
    where: { email: "client@meridian.app" },
    update: {},
    create: {
      email: "client@meridian.app",
      fullName: "Jonathan Reyes",
      passwordHash: clientPassword,
      role: "CLIENT",
      membership: {
        create: {
          tier: "TIER_2",
          status: "ACTIVE",
          coachId: coach.coachProfile!.id,
          messageThread: { create: {} },
          intake: {
            create: {
              goals: { primaryGoal: "energy", successLooksLike: "Steady energy through long days." },
              constraints: { weeklyHours: 5, travelFrequency: "weekly", dietaryPreferences: "", scheduleNotes: "Early starts." },
              currentHabits: { sleepHours: 6, trainingDaysPerWeek: 2, nutritionQuality: 3, stressLevel: 4 },
              consentSigned: true,
              consentAt: new Date(),
              completedAt: new Date(),
            },
          },
        },
      },
    },
    include: { membership: true },
  });

  const membershipId = client.membership!.id;
  const existingPlan = await db.planItem.count({ where: { membershipId } });
  if (existingPlan === 0) {
    const today = new Date();
    today.setHours(9, 0, 0, 0);
    await db.planItem.createMany({
      data: [
        { membershipId, kind: "WORKOUT", title: "Zone 2 — 40 min", scheduledFor: today, createdById: coach.id },
        { membershipId, kind: "HABIT", title: "10-min morning sunlight", scheduledFor: today, createdById: coach.id },
        { membershipId, kind: "RECOVERY", title: "Lights out by 10:30pm", scheduledFor: today, createdById: coach.id },
      ],
    });
    for (let i = 1; i <= 5; i++) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);
      await db.checkIn.create({
        data: { membershipId, date, energy: 5 + (i % 4), sleepHours: 6 + (i % 3) * 0.5, mood: 6 },
      });
    }
  }

  console.log("Seeded coach@meridian.app and client@meridian.app (see prisma/seed.ts for passwords).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
