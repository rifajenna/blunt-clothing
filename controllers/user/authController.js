import User from "../../models/User.js";
import bcrypt from "bcryptjs";
import Otp from "../../models/Otp.js";
import { sendOtpMail } from "../../utils/sendOtp.js";
import { sendResponse } from "../../utils/sendResponse.js";
import crypto from "crypto";

export const showSignup = (req, res) => {
  res.render("user/signup", { layout: false });
};

export const signupUser = async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists)
    return sendResponse(res, { code: 400, message: "User already exists" });

  const otp = crypto.randomInt(100000, 999999).toString(); 

  await Otp.deleteMany({ email }); 
  await Otp.create({ email, otp, expiresAt: Date.now() + 60000 }); 
  await sendOtpMail(email, otp);

  req.session.tempUser = { name, email, password };

  return sendResponse(res, {
    code: 200,
    message: "OTP sent",
    redirectUrl: "/user/verify-otp",
  });
};

export const showVerifyOtp = (req, res) => {
  res.render("user/verify-otp", { layout: false });
};

export const verifyOtp = async (req, res) => {
  const { otp } = req.body;
  const temp = req.session.tempUser;

  if (!temp)
    return sendResponse(res, {
      code: 400,
      message: "Session expired. Please signup again.",
      redirectUrl: "/user/signup",
    });

  const record = await Otp.findOne({ email: temp.email }).sort({ createdAt: -1 });

  if (!record || record.otp !== otp.toString() || record.expiresAt < Date.now()) {
    return sendResponse(res, { code: 400, message: "OTP expired or invalid" });
  }

  const hashed = await bcrypt.hash(temp.password, 10);

  await User.create({ name: temp.name, email: temp.email, password: hashed });
  await Otp.deleteMany({ email: temp.email });

  req.session.tempUser = null;

  return sendResponse(res, {
    code: 200,
    message: "Account created!",
    redirectUrl: "/user/login",
  });
};

export const resendOtp = async (req, res) => {
  const temp = req.session.tempUser;

  if (!temp)
    return sendResponse(res, { code: 400, message: "Session expired." });

  const otp = crypto.randomInt(100000, 999999).toString(); 

  await Otp.deleteMany({ email: temp.email });
  await Otp.create({ email: temp.email, otp, expiresAt: Date.now() + 60000 });
  await sendOtpMail(temp.email, otp);

  return sendResponse(res, { code: 200, message: "OTP resent successfully" });
};

export const showLogin = (req, res) => {
  res.render("user/login", { layout: false });
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return sendResponse(res, { code: 404, message: "User not found" });

  if (user.isBlocked)
    return sendResponse(res, { code: 403, message: "You are blocked by admin" });

  const match = await bcrypt.compare(password, user.password);
  if (!match)
    return sendResponse(res, { code: 401, message: "Wrong password" });

  req.session.user = user._id;
  return sendResponse(res, {
    code: 200,
    message: "Login successful",
    redirectUrl: "/user/home",
  });
};

export const logoutUser = (req, res) => {
  req.session.destroy();
  res.redirect("/user/login");
};

export const showForgotPassword = (req, res) => {
  res.render("user/forgot-password", { layout: false });
};

export const sendResetOtp = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user)
    return sendResponse(res, { code: 404, message: "User not found" });

  const otp = crypto.randomInt(100000, 999999).toString(); 

  await Otp.deleteMany({ email });
  await Otp.create({ email, otp, expiresAt: Date.now() + 600000 }); 
  await sendOtpMail(email, otp);

  req.session.resetEmail = email;
  req.session.otpVerified = false; 

  return sendResponse(res, {
    code: 200,
    message: "OTP sent successfully",
    redirectUrl: "/user/verify-reset-otp", 
  });
};

export const showVerifyResetOtp = (req, res) => {
  res.render("user/verify-reset-otp", { layout: false }); 
};

export const verifyResetOtp = async (req, res) => {
  const { otp } = req.body;
  const email = req.session.resetEmail;

  if (!email) {
    return sendResponse(res, {
      code: 400,
      message: "Session expired. Please try again.",
      redirectUrl: "/user/forgot-password",
    });
  }

  const record = await Otp.findOne({ email }).sort({ _id: -1 });

  if (!record || record.otp !== otp.toString() || record.expiresAt < Date.now()) {
    return sendResponse(res, { code: 400, message: "OTP expired or invalid" });
  }

  req.session.otpVerified = true;

  return sendResponse(res, {
    code: 200,
    message: "OTP verified",
    redirectUrl: "/user/reset-password",
  });
};

export const resendResetOtp = async (req, res) => {
  const email = req.session.resetEmail;

  if (!email)
    return sendResponse(res, { code: 400, message: "Session expired." });

  const otp = crypto.randomInt(100000, 999999).toString();

  await Otp.deleteMany({ email });
  await Otp.create({ email, otp, expiresAt: Date.now() + 600000 });
  await sendOtpMail(email, otp);

  return sendResponse(res, { code: 200, message: "OTP resent successfully" });
};

export const showResetPassword = (req, res) => {
  res.render("user/reset-password", { layout: false });
};

export const resetPassword = async (req, res) => {
  const { password } = req.body;
  const email = req.session.resetEmail;

  if (!email) {
    return sendResponse(res, {
      code: 400,
      message: "Session expired.",
      redirectUrl: "/user/forgot-password",
    });
  }

  if (!req.session.otpVerified) {
    return sendResponse(res, {
      code: 403,
      message: "OTP verification required.",
      redirectUrl: "/user/verify-reset-otp",
    });
  }

  const hashed = await bcrypt.hash(password, 10);
  await User.updateOne({ email }, { password: hashed });
  await Otp.deleteMany({ email });

  req.session.resetEmail = null;
  req.session.otpVerified = null;

  return sendResponse(res, {
    code: 200,
    message: "Password reset successful",
    redirectUrl: "/user/login",
  });
};
