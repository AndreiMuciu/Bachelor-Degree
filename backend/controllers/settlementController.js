import Settlement from "../models/settlementModel.js";
import {
  updateOne,
  getOne,
  getAll,
  deleteOne,
  createOne,
} from "./handleFactory.js";

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
        (settlementId) => settlementId.toString() === req.params.id
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
export const deleteSettlement = deleteOne(Settlement);
