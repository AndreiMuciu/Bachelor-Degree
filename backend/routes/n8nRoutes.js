import express from "express";
import { createSite, updateSite } from "../controllers/n8nController.js";

const router = express.Router();

router.post("/create-site", createSite);
router.post("/update-site", updateSite);

export default router;
