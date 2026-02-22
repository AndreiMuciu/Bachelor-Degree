import express from "express";
import { createSite, updateSite } from "../controllers/n8nController.js";
import { protect } from "../controllers/authController.js";

const router = express.Router();

// All n8n routes require authentication
router.use(protect);

router.post("/create-site", createSite);
router.post("/update-site", updateSite);

export default router;
