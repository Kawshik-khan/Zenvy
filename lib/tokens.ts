import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const generateVerificationToken = async (email: string) => {
  const token = crypto.randomUUID();
  const expires = new Date(new Date().getTime() + 3600 * 1000 * 24); // 24 hours

  const existingToken = await prisma.verificationToken.findFirst({
    where: { email }
  });

  if (existingToken) {
    await prisma.verificationToken.delete({
      where: { id: existingToken.id }
    });
  }

  const verficationToken = await prisma.verificationToken.create({
    data: {
      email,
      token,
      expires,
    }
  });

  return verficationToken;
};
