import prisma from "../config/prisma.js";

export const getUsers = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
    }
  });
  return users;
};