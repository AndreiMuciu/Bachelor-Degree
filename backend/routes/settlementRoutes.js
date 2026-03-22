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

router.route("/").get(getAllSettlements).post(protect, createSettlement);

router.patch("/:id/deactivate", protect, deactivateSettlementSite);

router
  .route("/:id")
  .get(protect, getSettlement)
  .patch(protect, updateSettlement)
  .delete(protect, deleteSettlement);

export default router;
