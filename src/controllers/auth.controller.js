import * as authService from "../services/auth.service.js";
import { registerSchema, loginSchema } from "../schemas/auth.schema.js";

export const register = async (req, res, next) => {
  try {
    const { email, password } = registerSchema.parse(req.body);
    const user = await authService.register({ email, password });
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días en ms
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const { accessToken, refreshToken } = await authService.login({ email, password });
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    res.json({ accessToken });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) return res.status(401).json({ message: "Refresh token required" });

    const { accessToken, refreshToken: newRefreshToken } = await authService.refreshToken(token);
    res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);
    res.json({ accessToken });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) return res.status(400).json({ message: "Refresh token required" });

    await authService.logout(token);
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};