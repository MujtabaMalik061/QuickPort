// Frontend/src/auth/Login.jsx
import React, { useState, useEffect, useRef } from "react";
import "../assets/styles/Auth.css";
import {
  WhiteLogo,
  Ride,
  Steering,
  AppleIcon,
} from "../assets/images/Images";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router";
import Otp from "./Otp";
import { toast } from "react-toastify";
import { GoogleLogin } from "@react-oauth/google";

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [signUp, setSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [otpModal, setOtpModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setSignUp(false);
      }
    }
    if (signUp) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [signUp]);

  const handleSignUp = (type) => navigate("/signup", { state: { type } });

  const handleLogin = async () => {
    if (loading) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/send-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        setOtpModal(true);
        toast.success(data.message);
      } else {
        setOtpModal(false);
        toast.error(data.message || "Failed to send OTP");
      }
    } catch {
      toast.error("Error sending OTP: Network issue");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/google-login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: credentialResponse.credential,
            type: "ride",
          }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token);
        window.location.href = "/";
        toast.success("Google login successful!");
      } else {
        toast.error(data.message || "Google login failed");
      }
    } catch (err) {
      toast.error("Google login error: " + err.message);
    }
  };

  const handleGoogleError = () => {
    toast.error("Google Sign-In failed");
  };

const handleAppleLogin = async () => {
  toast.info("Apple Sign-In is not available yet. Please use email or Google.");
};


  return (
    <>
      <div className="auth-header">
        <div>
          <img src={WhiteLogo} alt="logo" />
          <span>QuickPort</span>
        </div>
        <div className="auth-header-login-btn-container">
          <button
            onClick={() => setSignUp((prev) => !prev)}
            className="auth-header-login-btn"
          >
            SignUp
          </button>
          <AnimatePresence>
            {signUp && (
              <motion.div
                ref={dropdownRef}
                className="auth-header-login-btn-container-inner"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <span onClick={() => handleSignUp("ride")}>
                  Ride <img src={Ride} alt="rider" />
                </span>
                <span onClick={() => handleSignUp("drive")}>
                  Drive <img src={Steering} alt="drive" />
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="login-container">
        <div className="login-box">
          <h2 className="login-title">What's your email?</h2>
          <input
            type="email"
            placeholder="Enter email"
            className="login-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            style={
              loading
                ? { backgroundColor: "#0000003d", cursor: "not-allowed" }
                : {}
            }
            className="btn btn-primary"
            onClick={handleLogin}
          >
            {loading ? "Loading..." : "Continue"}
          </button>

          <div className="divider">
            <span>or</span>
          </div>

          {/* <button className="btn btn-google">
            <img src={GoogleIcon} alt="google" />
            Continue with Google
          </button> */}
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />

          <button className="btn btn-apple" onClick={handleAppleLogin}>
            <img src={AppleIcon} alt="apple" />
            Continue with Apple
          </button>

          <p className="login-footer">
            By proceeding, you consent to get calls, WhatsApp or SMS/RCS
            messages, including by automated means, from QuickPort and its
            affiliates to the number provided.
          </p>
        </div>
      </div>

      {otpModal && (
        <Otp setOtpModal={setOtpModal} email={email} setEmail={setEmail} />
      )}
    </>
  );
};

export default Login;
