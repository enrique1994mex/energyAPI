import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const users = [];

export const register = async ({ email, password }) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = { id: users.length + 1, email, password: hashedPassword };
  users.push(user);

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const login = async ({ email, password }) => {
  const user = users.find(u => u.email === email);

  if (!user) throw new Error("Invalid credentials");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid credentials");

  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

  return token;
};
