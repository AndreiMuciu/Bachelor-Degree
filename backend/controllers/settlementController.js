import Settlement from "../models/settlementModel.js";
import User from "../models/userModel.js";
import Member from "../models/memberModel.js";
import BlogPost from "../models/blogPostModel.js";
import Coordinates from "../models/coordinatesModel.js";
import Event from "../models/eventModel.js";
import { updateOne, getOne, getAll, createOne } from "./handleFactory.js";

import { r2DeleteByPrefix, r2DeleteKeys } from "../utils/r2.js";

import { callN8nDeleteSite, buildSiteName } from "./n8nController.js";

export const getAllSettlements = getAll(Settlement);

export const getSettlement = async (req, res, next) => {
  try {
    const settlement = await Settlement.findById(req.params.id);

    if (!settlement) {
      return res.status(404).json({
        status: "fail",
        message: "No settlement found with that ID",
      });
    }

    // Check permissions
    if (req.user.role !== "admin") {
      const isAssigned = req.user.settlements.some(
        (settlementId) => settlementId.toString() === req.params.id,
      );

      if (!isAssigned) {
        return res.status(403).json({
          status: "fail",
          message: "You do not have permission to access this settlement.",
        });
      }
    }

    res.status(200).json({
      status: "success",
      data: {
        data: settlement,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: error.message,
    });
  }
};

export const createSettlement = createOne(Settlement);
export const updateSettlement = updateOne(Settlement);

export const deactivateSettlementSite = async (req, res) => {
  try {
    const settlement = await Settlement.findById(req.params.id);

    if (!settlement) {
      return res.status(404).json({
        status: "fail",
        message: "No settlement found with that ID",
      });
    }

    // Check permissions (same rule as getSettlement)
    if (req.user.role !== "admin") {
      const isAssigned = req.user.settlements.some(
        (settlementId) => settlementId.toString() === req.params.id,
      );

      if (!isAssigned) {
        return res.status(403).json({
          status: "fail",
          message: "You do not have permission to access this settlement.",
        });
      }
    }

    if (!settlement.active) {
      return res.status(400).json({
        status: "fail",
        message: "Settlement site is already inactive",
      });
    }

    const siteName = buildSiteName(settlement);
    const n8nResult = await callN8nDeleteSite({ siteName });

    settlement.active = false;
    await settlement.save();

    res.status(200).json({
      status: "success",
      message: "Site deactivated successfully",
      data: {
        settlement,
        n8nResponse: n8nResult,
      },
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message,
      details: error.details,
    });
  }
};

export const deleteSettlement = async (req, res) => {
  try {
    const settlement = await Settlement.findById(req.params.id);

    if (!settlement) {
      return res.status(404).json({
        status: "fail",
        message: "No settlement found with that ID",
      });
    }

    // Trigger n8n deletion only if the site is active
    if (settlement.active) {
      const siteName = buildSiteName(settlement);
      await callN8nDeleteSite({ siteName });
    }

    const settlementId = settlement._id;
    const safeSettlementId = String(settlementId).trim();

    // Best-effort cleanup of associated storage in R2.
    // We do this before DB deletes so we can still discover member photo keys.
    try {
      const membersWithPhotos = await Member.find({
        settlement: settlementId,
        photoPath: { $exists: true, $ne: "" },
      }).select("photoPath");

      const photoKeys = (membersWithPhotos || [])
        .map((m) => m.photoPath)
        .filter(Boolean);

      await Promise.all([
        photoKeys.length ? r2DeleteKeys(photoKeys) : Promise.resolve(),
        r2DeleteByPrefix(`settlements/${safeSettlementId}/blog/`),
      ]);
    } catch (err) {
      console.error(
        "[deleteSettlement] R2 cleanup failed; proceeding with DB deletion:",
        err,
      );
    }

    // Cascade delete dependent data
    await Promise.all([
      User.updateMany(
        { settlements: settlementId },
        { $pull: { settlements: settlementId } },
      ),
      Event.deleteMany({ settlement: settlementId }),
      Member.deleteMany({ settlement: settlementId }),
      BlogPost.deleteMany({ settlement: settlementId }),
      Coordinates.deleteMany({ settlement: settlementId }),
    ]);

    await Settlement.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message,
      details: error.details,
    });
  }
};
