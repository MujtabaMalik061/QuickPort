// Backend/src/Routes/Auth.routes.js
import express from "express";
import {
  sendOtp,
  verifyOtp,
  getUserData,
  updateProfile,
  uploadProfileImage,
  googleLogin,
  appleLogin,
} from "../Controllers/auth.controller.js";
import { verifyToken } from "../Middleware/auth.js";

const router = express.Router();

// Socials
router.post("/google-login", googleLogin);
router.post("/apple-login", appleLogin);
router.get("/apple-login", (req, res) => {
  res.status(400).json({ message: "Apple login requires POST" });
});

// OTP flow
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

// Authenticated user ops
router.get("/user", verifyToken, getUserData);
router.put("/update", verifyToken, uploadProfileImage, updateProfile);

export default router;
