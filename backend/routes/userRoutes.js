import express from "express";
import {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getMe,
} from "./../controllers/userController.js";
import { protect, restrictTo } from "./../controllers/authController.js";

const router = express.Router();

router.get("/me", protect, getMe);

// All routes below this point require the user to be logged in as admin
router.use(protect, restrictTo("admin"));

router.route("/").get(getAllUsers).post(createUser);

router.route("/:id").get(getUser).patch(updateUser).delete(deleteUser);

export default router;
