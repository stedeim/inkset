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
  await db.user.upsert({
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
        },
      },
    },
  });

  console.log("Seeded coach@meridian.app and client@meridian.app (see prisma/seed.ts for passwords).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
