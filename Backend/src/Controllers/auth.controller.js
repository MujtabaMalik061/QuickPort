// Backend/src/Controllers/auth.controller.js

import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import Driver from "../Models/Driver_Models.js";
import Rider from "../Models/Rider_Models.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { OAuth2Client } from "google-auth-library";
import appleSigninAuth from "apple-signin-auth";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---- Helpers ----
const findUserByEmail = async (email) => {
  let user = await Rider.findOne({ email });
  let role = "rider";
  if (!user) {
    user = await Driver.findOne({ email });
    if (user) role = "driver";
  }
  return { user, role };
};

const createUserByType = async (email, type) => {
  if (type === "drive" || type === "driver") {
    const user = new Driver({ email, role: "driver" });
    await user.save();
    return { user, role: "driver" };
  }
  const user = new Rider({ email, role: "rider" });
  await user.save();
  return { user, role: "rider" };
};

// ---- Multer (upload avatar) ----
const uploadsDir = path.join(__dirname, "..", "Public", "Uploads");
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) =>
    cb(
      null,
      `${req.user.email}-${Date.now()}${path.extname(file.originalname)}`
    ),
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(null, false);
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});
export const uploadProfileImage = upload.single("profileImg");

// ---- Nodemailer ----
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ---- Controllers ----
export const sendOtp = async (req, res) => {
  try {
    const { email, type } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email address." });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    let { user, role } = await findUserByEmail(email);
    if (!user) {
      ({ user, role } = await createUserByType(email, type));
    }

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await transporter.sendMail({
      from: `"QuickPort" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP for QuickPort Login",
      html: `<p>Your OTP is <b>${otp}</b>. It is valid for 5 minutes.</p>`,
    });

    res
      .status(200)
      .json({ message: `OTP sent successfully`, role });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: `Failed to send OTP: ${error.message}` });
  }
};

export const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required." });
  }
  try {
    let { user } = await findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }
    if (user.otp !== otp || !user.otpExpires || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid OTP." });
    }
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

const token = jwt.sign(
  { id: user._id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: "30d" }
);

    res.status(200).json({ message: "OTP verified successfully", token });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: `Failed to verify OTP: ${error.message}` });
  }
};

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req, res) => {
  try {
    const { token, type } = req.body;
    if (!token)
      return res.status(400).json({ message: "Google token required" });

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let { user } = await findUserByEmail(email);
    if (!user) {
      ({ user } = await createUserByType(email, type));
      if (name) {
        user.firstName = name.split(" ")[0] || "";
        user.lastName = name.split(" ")[1] || "";
      }
      if (picture) user.profileImg = picture;
      await user.save();
    }

    const jwtToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });
    res
      .status(200)
      .json({ message: "Google login successful", token: jwtToken, user });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ message: "Failed to login with Google" });
  }
};

export const appleLogin = async (req, res) => {
  try {
    const { id_token, type } = req.body;
    const appleUser = await appleSigninAuth.verifyIdToken(id_token, {
      audience: process.env.APPLE_CLIENT_ID,
    });

    const { email } = appleUser;
    let { user } = await findUserByEmail(email);
    if (!user) {
      ({ user } = await createUserByType(email, type));
    }

    const jwtToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(200).json({
      message: "Apple login successful",
      token: jwtToken,
      user,
    });
  } catch (error) {
    console.error("Apple login error:", error);
    res.status(500).json({ message: "Failed to login with Apple" });
  }
};

export const getUserData = async (req, res) => {
  try {
    const { email } = req.user || {};
    if (!email) return res.status(401).json({ message: "Unauthorized" });

    let { user } = await findUserByEmail(email);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { otp, otpExpires, ...obj } = user.toObject();
    res
      .status(200)
      .json({ message: "User data retrieved successfully", user: obj });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res
      .status(500)
      .json({ message: `Failed to fetch user data: ${error.message}` });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { email } = req.user;
    if (!email) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Find user based on role
    let user = await Rider.findOne({ email });
    let role = "rider";

    if (!user) {
      user = await Driver.findOne({ email });
      role = "driver";
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields based on role
    if (role === "rider") {
      user.firstName = req.body.firstName || user.firstName;
      user.lastName = req.body.lastName || user.lastName;
      user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
      user.gender = req.body.gender || user.gender;
    } else {
      user.firstName = req.body.firstName || user.firstName;
      user.lastName = req.body.lastName || user.lastName;
      user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
      user.gender = req.body.gender || user.gender;
      user.CNIC = req.body.cnicNumber || user.CNIC;
      user.rideType = req.body.rideType || user.rideType;
      user.rideNumber = req.body.rideNumber || user.rideNumber;
      user.rideBrand = req.body.rideBrand || user.rideBrand;
    }

    if (req.file) {
      user.profileImg = `/Uploads/${req.file.filename}`;
    }

    await user.save();

    const { otp, otpExpires, ...userObj } = user.toObject();
    res.status(200).json({
      message: "Profile updated successfully",
      user: userObj,
      role,
    });
  } catch (err) {
    console.error("updateProfile error:", err);
    res.status(500).json({ message: "Error updating profile" });
  }
};
