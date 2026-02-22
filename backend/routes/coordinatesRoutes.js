import express from "express";
import {
  getAllCoordinates,
  getCoordinates,
  createCoordinates,
  updateCoordinates,
  deleteCoordinates,
} from "./../controllers/coordinatesController.js";
import { protect } from "./../controllers/authController.js";

const router = express.Router();

// All coordinate routes require authentication
router.use(protect);

router.route("/").get(getAllCoordinates).post(createCoordinates);
router
  .route(":id")
  .get(getCoordinates)
  .patch(updateCoordinates)
  .delete(deleteCoordinates);

export default router;
