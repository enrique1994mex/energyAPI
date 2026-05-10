import { Router } from "express";
import { getContracts, getContract, createContract, updateContract, deleteContract } from "../controllers/contract.controller.js";

const router = Router();

router.get("/", getContracts);
router.get("/:id", getContract);
router.post("/", createContract);
router.put("/:id", updateContract);
router.delete("/:id", deleteContract);

export default router;