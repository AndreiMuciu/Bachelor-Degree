import express from "express";
import {
  getAllCoordinates,
  getCoordinates,
  createCoordinates,
  updateCoordinates,
  deleteCoordinates,
} from "./../controllers/coordinatesController.js";

const router = express.Router();

router.route("/").get(getAllCoordinates).post(createCoordinates);
router
  .route("/:id")
  .get(getCoordinates)
  .patch(updateCoordinates)
  .delete(deleteCoordinates);

export default router;
