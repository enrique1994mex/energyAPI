import * as authService from "../services/auth.service.js";
import { registerSchema, loginSchema } from "../schemas/auth.schema.js";
import logger from "../config/logger.js";

export const register = async (req, res, next) => {
  try {
    const { email, password } = registerSchema.parse(req.body);
    const user = await authService.register({ email, password });
    logger.info({ requestId: req.requestId, event: 'user_registered', userId: user.id, email: user.email }, 'security');
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días en ms
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const { accessToken, refreshToken, userId } = await authService.login({ email, password });
    logger.info({ requestId: req.requestId, event: 'login_success', userId, email, ip: req.ip }, 'security');
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    res.json({ accessToken });
  } catch (error) {
    logger.warn({ requestId: req.requestId, event: 'login_failed', email: req.body.email, ip: req.ip }, 'security');
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
    // Clear the stale cookie so the middleware doesn't redirect back to /dashboard
    // and trap the client in an infinite loop.
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;

    if (token) await authService.logout(token);

    logger.info({ requestId: req.requestId, event: 'logout', ip: req.ip }, 'security');
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};