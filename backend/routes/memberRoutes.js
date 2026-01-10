import express from "express";
import {
  getAllMembers,
  getMember,
  createMember,
  updateMember,
  deleteMember,
} from "./../controllers/memberController.js";

const router = express.Router();

router.route("/").get(getAllMembers).post(createMember);
router.route("/:id").get(getMember).patch(updateMember).delete(deleteMember);

export default router;
