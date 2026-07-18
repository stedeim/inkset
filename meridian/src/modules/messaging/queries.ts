import type { PrismaClient } from "@prisma/client";

/** The membership's message thread with messages (oldest first) and sender info. */
export async function getThread(db: PrismaClient, membershipId: string) {
  return db.messageThread.findUnique({
    where: { membershipId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { fullName: true, role: true } } },
      },
    },
  });
}

/** Count messages in the thread not sent by the viewer and not yet read. */
export async function countUnread(
  db: PrismaClient,
  membershipId: string,
  viewerId: string,
): Promise<number> {
  const thread = await db.messageThread.findUnique({ where: { membershipId }, select: { id: true } });
  if (!thread) return 0;
  return db.message.count({
    where: { threadId: thread.id, senderId: { not: viewerId }, readAt: null },
  });
}

export type ThreadMessage = {
  id: string;
  senderId: string;
  body: string;
  createdAt: Date;
  readAt: Date | null;
  sender: { fullName: string; role: string };
};
