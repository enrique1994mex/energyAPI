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
    const token = await authService.login({ email, password });
    res.json({ token });
  } catch (error) {
    next(error);
  }
};  