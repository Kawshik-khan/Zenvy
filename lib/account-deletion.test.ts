import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const tx = {
  studyGroup: { findMany: vi.fn(), update: vi.fn(), delete: vi.fn() },
  groupMember: { update: vi.fn() },
  channel: { findMany: vi.fn(), update: vi.fn(), delete: vi.fn() },
  channelMember: { update: vi.fn() },
  event: { deleteMany: vi.fn() },
  user: { delete: vi.fn() },
};
const prisma = {
  user: { findUnique: vi.fn() },
  $transaction: vi.fn((run: (client: typeof tx) => Promise<unknown>) => run(tx)),
};
const bucket = { list: vi.fn(), remove: vi.fn() };

vi.mock("@/lib/prisma", () => ({ prisma }));
vi.mock("@/lib/supabase", () => ({ supabase: { storage: { from: () => bucket } } }));

const { checkDeletionRequest, deleteAccount } = await import("./account-deletion");

beforeEach(() => {
  vi.clearAllMocks();
  tx.studyGroup.findMany.mockResolvedValue([]);
  tx.channel.findMany.mockResolvedValue([]);
  bucket.list.mockResolvedValue({ data: [] });
});

describe("checkDeletionRequest", () => {
  it("requires the typed confirmation", async () => {
    expect(await checkDeletionRequest("u1", "delete")).toBe("Type DELETE to confirm.");
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("checks the password on password accounts", async () => {
    prisma.user.findUnique.mockResolvedValue({ password: await bcrypt.hash("Right-pass1", 4) });
    expect(await checkDeletionRequest("u1", "DELETE", "wrong")).toBe("That password is incorrect.");
    expect(await checkDeletionRequest("u1", "DELETE")).toBe("That password is incorrect.");
    expect(await checkDeletionRequest("u1", "DELETE", "Right-pass1")).toBeNull();
  });

  it("needs no password for Google-only accounts", async () => {
    prisma.user.findUnique.mockResolvedValue({ password: null });
    expect(await checkDeletionRequest("u1", " DELETE ")).toBeNull();
  });
});

describe("deleteAccount", () => {
  it("hands groups and channels to the longest-standing member, deletes empty ones, then the user", async () => {
    tx.studyGroup.findMany.mockResolvedValue([
      { id: "g1", members: [{ userId: "heir" }] },
      { id: "g2", members: [] },
    ]);
    tx.channel.findMany.mockResolvedValue([
      { id: "c1", members: [{ userId: "heir" }] },
      { id: "c2", members: [] },
    ]);

    await deleteAccount("u1");

    expect(tx.studyGroup.update).toHaveBeenCalledWith({ where: { id: "g1" }, data: { adminId: "heir" } });
    expect(tx.groupMember.update).toHaveBeenCalledWith({ where: { groupId_userId: { groupId: "g1", userId: "heir" } }, data: { role: "ADMIN" } });
    expect(tx.studyGroup.delete).toHaveBeenCalledWith({ where: { id: "g2" } });
    expect(tx.channel.update).toHaveBeenCalledWith({ where: { id: "c1" }, data: { creatorId: "heir" } });
    expect(tx.channelMember.update).toHaveBeenCalledWith({ where: { channelId_userId: { channelId: "c1", userId: "heir" } }, data: { role: "CREATOR" } });
    expect(tx.channel.delete).toHaveBeenCalledWith({ where: { id: "c2" } });
    expect(tx.event.deleteMany).toHaveBeenCalledWith({ where: { creatorId: "u1" } });
    expect(tx.user.delete).toHaveBeenCalledWith({ where: { id: "u1" } });
  });

  it("removes the user's avatar files, and a storage failure doesn't fail the deletion", async () => {
    bucket.list.mockResolvedValue({ data: [{ name: "1.png" }, { name: "2.jpg" }] });
    await deleteAccount("u1");
    expect(bucket.remove).toHaveBeenCalledWith(["u1/1.png", "u1/2.jpg"]);

    bucket.list.mockRejectedValue(new Error("storage down"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(deleteAccount("u1")).resolves.toBeUndefined();
    log.mockRestore();
  });
});
