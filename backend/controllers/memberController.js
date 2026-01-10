import Member from "../models/memberModel.js";
import {
  updateOne,
  getOne,
  getAll,
  deleteOne,
  createOne,
} from "./handleFactory.js";

export const getAllMembers = getAll(Member);
export const getMember = getOne(Member);
export const createMember = createOne(Member);
export const updateMember = updateOne(Member);
export const deleteMember = deleteOne(Member);
