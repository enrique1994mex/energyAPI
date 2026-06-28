import { Router } from "express";
import { register, login, getProfile, refreshToken, logout } from "../controllers/auth.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authMiddleware, getProfile);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);


export default router; 