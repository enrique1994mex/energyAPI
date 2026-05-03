import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const users = [];
const refreshTokens = [];

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

  const accessToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

  refreshTokens.push(refreshToken);

  return { accessToken, refreshToken }; 
};

export const refreshToken = async (token) => {
  if (!refreshTokens.includes(token)) throw new Error("Invalid refresh token");

  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

  const index = refreshTokens.indexOf(token);
  refreshTokens.splice(index, 1);

  const accessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const newRefreshToken = jwt.sign({ id: decoded.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  refreshTokens.push(newRefreshToken);

  return { accessToken, refreshToken: newRefreshToken };
};

export const logout = (token) => {
  const index = refreshTokens.indexOf(token);
  if (index !== -1) refreshTokens.splice(index, 1);
};
