import { Router } from "express";
import { register, login, refreshToken, logout } from "../controllers/auth.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authMiddleware, (req, res) => {
  res.json({ message: "This is a protected route", user: req.user });
});
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);


export default router; 