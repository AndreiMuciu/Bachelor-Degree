import express from "express";
import {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getMe,
} from "./../controllers/userController.js";
import { protect } from "./../controllers/authController.js";

const router = express.Router();

router.get("/me", protect, getMe);

router.route("/").get(getAllUsers).post(createUser);

router.route("/:id").get(getUser).patch(updateUser).delete(deleteUser);

export default router;
