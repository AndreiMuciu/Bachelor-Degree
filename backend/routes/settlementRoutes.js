import express from "express";
import {
  getAllSettlements,
  getSettlement,
  createSettlement,
  updateSettlement,
  deactivateSettlementSite,
  deleteSettlement,
} from "./../controllers/settlementController.js";
import { protect, restrictTo } from "./../controllers/authController.js";

const router = express.Router();

router
  .route("/")
  .get(getAllSettlements)
  .post(protect, restrictTo("admin"), createSettlement);

router.patch("/:id/deactivate", protect, deactivateSettlementSite);

router
  .route("/:id")
  .get(protect, getSettlement)
  .patch(protect, updateSettlement)
  .delete(protect, restrictTo("admin"), deleteSettlement);

export default router;
