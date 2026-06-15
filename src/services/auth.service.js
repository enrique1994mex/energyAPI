import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import prisma from '../config/prisma.js';
import { AppError } from '../errors/AppError.js';


export const register = async ({ email, password }) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword
    }
  });

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: {
      email
    }
  });

  if (!user) throw new AppError("Invalid credentials", 401);

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new AppError("Invalid credentials", 401);

  const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: user.id, jti: randomUUID() }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id
    }
  });

  return { accessToken, refreshToken }; 
};

export const refreshToken = async (token) => {
  const storedToken = await prisma.refreshToken.findUnique({
    where: {
      token
    }
  });

  if (!storedToken) throw new AppError("Invalid refresh token", 401);

  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

  await prisma.refreshToken.delete({ where: { token } });

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user) throw new AppError("User not found", 401);

  const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const newRefreshToken = jwt.sign({ id: user.id, jti: randomUUID() }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: user.id
    }
  });

  return { accessToken, refreshToken: newRefreshToken };
};

export const logout = async (token) => {
  await prisma.refreshToken.deleteMany({
    where: { token },
  });
};
