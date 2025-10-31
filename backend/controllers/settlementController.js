import Settlement from "../models/settlementModel.js";
import {
  updateOne,
  getOne,
  getAll,
  deleteOne,
  createOne,
} from "./handleFactory.js";

export const getAllSettlements = getAll(Settlement);
export const getSettlement = getOne(Settlement);
export const createSettlement = createOne(Settlement);
export const updateSettlement = updateOne(Settlement);
export const deleteSettlement = deleteOne(Settlement);
