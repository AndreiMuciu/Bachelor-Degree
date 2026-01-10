import express from "express";
import {
  login,
  signup,
  logout,
  entraLogin,
  entraRedirect,
} from "../controllers/authController.js";

const router = express.Router();

// Login/Signup normal
// router.post("/signup", signup);
router.post("/login", login);
router.get("/logout", logout);

// Entra ID OAuth
router.get("/entra/login", entraLogin);
router.get("/entra/redirect", entraRedirect);

export default router;
