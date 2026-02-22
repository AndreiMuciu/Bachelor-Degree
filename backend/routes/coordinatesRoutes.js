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

router.route("/").get(getAllCoordinates).post(protect, createCoordinates);
router
  .route(":id")
  .get(getCoordinates)
  .patch(protect, updateCoordinates)
  .delete(protect, deleteCoordinates);

export default router;
