import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function parseDmRoomId(roomId) {
  if (!roomId.startsWith("dm_")) return null;
  const parts = roomId.slice(3).split("_").filter(Boolean);
  if (parts.length !== 2) return null;
  return parts.sort();
}

async function main() {
  const dmRooms = await prisma.message.findMany({
    where: { roomId: { startsWith: "dm_" } },
    select: { roomId: true },
    distinct: ["roomId"],
  });

  let migratedRooms = 0;
  let migratedMessages = 0;

  for (const room of dmRooms) {
    const users = parseDmRoomId(room.roomId);
    if (!users) continue;

    const [userA, userB] = users;
    const dmKey = `${userA}:${userB}`;

    const conversation = await prisma.conversation.upsert({
      where: { dmKey },
      update: {},
      create: {
        type: "DM",
        dmKey,
        participants: {
          create: [
            { userId: userA, role: "MEMBER" },
            { userId: userB, role: "MEMBER" },
          ],
        },
      },
    });

    const oldMessages = await prisma.message.findMany({
      where: { roomId: room.roomId },
      orderBy: { createdAt: "asc" },
    });

    const existingMessages = await prisma.conversationMessage.findMany({
      where: { conversationId: conversation.id },
      select: {
        senderId: true,
        content: true,
        createdAt: true,
      },
    });

    const existingKeys = new Set(
      existingMessages.map((message) => `${message.senderId}|${message.createdAt.toISOString()}|${message.content}`)
    );

    for (const oldMessage of oldMessages) {
      const key = `${oldMessage.senderId}|${oldMessage.createdAt.toISOString()}|${oldMessage.content}`;
      if (existingKeys.has(key)) continue;

      const message = await prisma.conversationMessage.create({
        data: {
          conversationId: conversation.id,
          senderId: oldMessage.senderId,
          content: oldMessage.content,
          fileUrl: oldMessage.fileUrl,
          fileType: oldMessage.fileType,
          fileName: oldMessage.fileName,
          createdAt: oldMessage.createdAt,
          updatedAt: oldMessage.createdAt,
        },
      });

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageId: message.id,
          lastMessageAt: message.createdAt,
        },
      });

      migratedMessages += 1;
      existingKeys.add(key);
    }

    migratedRooms += 1;
  }

  console.log(`Backfilled ${migratedMessages} messages across ${migratedRooms} DM rooms.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
