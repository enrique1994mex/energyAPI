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

export const login = async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const { accessToken, refreshToken } = await authService.login({ email, password });
    res.json({ accessToken, refreshToken }); 
  } catch (error) {
    next(error);
  }
};  

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) return res.status(401).json({ message: "Refresh token required" });

    const { accessToken, refreshToken: newRefreshToken } = await authService.refreshToken(refreshToken);
    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    next(error);
  }
};

export const logout = (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) return res.status(400).json({ message: "Refresh token required" });

    authService.logout(refreshToken);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};