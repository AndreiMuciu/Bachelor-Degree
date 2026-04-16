import express from "express";
import {
  createEvent,
  deleteEvent,
  getAllEvents,
  getEvent,
  getPublicEvents,
  updateEvent,
} from "../controllers/eventController.js";
import { protect } from "../controllers/authController.js";

const router = express.Router();

// Public (used by Cloudflare Pages sites)
router.get("/public", getPublicEvents);

// Admin / authenticated CRUD
router.use(protect);

router.route("/").get(getAllEvents).post(createEvent);

router.route("/:id").get(getEvent).patch(updateEvent).delete(deleteEvent);

export default router;
