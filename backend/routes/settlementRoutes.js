import express from "express";
import {
  getAllSettlements,
  getSettlement,
  createSettlement,
  updateSettlement,
  deleteSettlement,
} from "./../controllers/settlementController.js";
import { protect, restrictTo } from "./../controllers/authController.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(getAllSettlements)
  .post(restrictTo("admin"), createSettlement);

router
  .route("/:id")
  .get(getSettlement)
  .patch(updateSettlement)
  .delete(deleteSettlement);

export default router;
