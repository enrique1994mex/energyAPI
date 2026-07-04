import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redis from "../config/redis.js";
import { getAllContracts, getContracts, getContract, createContract, updateContract, deleteContract } from "../controllers/contract.controller.js";
import { getContractInsights } from "../controllers/ai.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = Router();

router.use(authMiddleware);

const aiInsightsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  keyGenerator: (req) => `ai_insights:${req.user.id}`,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes al análisis de IA. Intenta de nuevo en 15 minutos." },
  skip: () => !redis.isReady,
  store: new RedisStore({ sendCommand: (...args) => redis.sendCommand(args) }),
});

router.get("/", getContracts);
router.get("/all", requireRole("ADMIN"), getAllContracts);
router.get("/:id", getContract);
router.get("/:id/ai-insights", aiInsightsLimiter, getContractInsights);
router.post("/", createContract);
router.put("/:id", updateContract);
router.delete("/:id", deleteContract);

export default router;