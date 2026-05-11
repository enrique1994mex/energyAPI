import { Router } from "express";
import { getUsers } from "../controllers/user.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = Router();

router.get("/", authMiddleware, requireRole("ADMIN"), getUsers);

export default router;