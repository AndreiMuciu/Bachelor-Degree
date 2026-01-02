import express from "express";
import {
  getAllSettlements,
  getSettlement,
  createSettlement,
  updateSettlement,
  deleteSettlement,
} from "./../controllers/settlementController.js";
import { protect } from "./../controllers/authController.js";

const router = express.Router();

router.use(protect);

router.route("/").get(getAllSettlements).post(createSettlement);

router
  .route("/:id")
  .get(getSettlement)
  .patch(updateSettlement)
  .delete(deleteSettlement);

export default router;
