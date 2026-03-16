import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
import { sendResponse } from "../utils/sendResponse.js";
import { sendOtpMail } from "../utils/sendOtp.js";

export const showLogin = (req, res) => {
  res.render("admin/pages/login", {
    title: "ADMIN LOGIN",
    showLayout: false,
    cssFile: "",
    pageJS: "login.js",
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email });
  if (!admin)
    return sendResponse(res, { code: 404, message: "Admin not found" });

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch)
    return sendResponse(res, { code: 401, message: "Wrong password" });

  req.session.admin = { id: admin._id, name: admin.name, email: admin.email };
  return sendResponse(res, {
    code: 200,
    message: "Login successful",
    redirectUrl: "/admin/dashboard",
  });
};

export const getDashboard = (req, res) => {
  res.render("admin/pages/dashboard", {
    title: "Dashboard",
    showLayout: true,
    cssFile: "dashboard.css",
    pageJS: "",
  });
};

export const getUsers = async (req, res) => {
  const search = req.query.search || "";
  const page = parseInt(req.query.page) || 1;
  const limit = 5;

  const query = {
    email: { $regex: search, $options: "i" },
  };

  const totalUsers = await User.countDocuments(query);

  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.render("admin/pages/users", {
    title: "Users",
    showLayout: true,
    cssFile: "dashboard.css",
    users,
    totalPages: Math.ceil(totalUsers / limit),
    currentPage: page,
    search,
    pageJS: "",
  });
};

export const toggleBlockUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  user.isBlocked = !user.isBlocked;
  await user.save();
  return sendResponse(res, {
    code: 200,
    message: `User ${user.isBlocked ? "blocked" : "unblocked"} successfully`,
  });
};

export const createPermanentAdmin = async () => {
  await Admin.deleteMany({});  // wipe old admin

  const hashedPassword = await bcrypt.hash("admin123", 10);
  await Admin.create({
    name: "Super Admin",
    email: "rifajennah123@gmail.com",  // your actual email
    password: hashedPassword,
  });
  console.log("Permanent Admin Created");
};

export const logoutUser = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin/login");
  });
};

// ── Forgot Password ──────────────────────────────────────

export const showForgotPassword = (req, res) => {
  res.render("admin/pages/forgot-password", {
    title: "Forgot Password",
    showLayout: false,
    cssFile: "",
    pageJS: "",
  });
};

export const sendForgotOtp = async (req, res) => {
  const { email } = req.body;

  const admin = await Admin.findOne({ email });
  if (!admin)
    return sendResponse(res, { code: 404, message: "No admin found with this email" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

  await Otp.findOneAndDelete({ email });
  await Otp.create({ email, otp, expiresAt });

  await sendOtpMail(email, otp);

  req.session.resetEmail = email;

  return sendResponse(res, {
    code: 200,
    message: "OTP sent to your email",
    redirectUrl: "/admin/verify-otp",
  });
};

export const showVerifyOtp = (req, res) => {
  if (!req.session.resetEmail) return res.redirect("/admin/forgot-password");

  res.render("admin/pages/verify-otp", {
    title: "Verify OTP",
    showLayout: false,
    cssFile: "",
    pageJS: "",
  });
};

export const verifyOtp = async (req, res) => {
  const { otp } = req.body;
  const email = req.session.resetEmail;

  if (!email)
    return sendResponse(res, { code: 400, message: "Session expired. Please try again." });

  const record = await Otp.findOne({ email });

  if (!record)
    return sendResponse(res, { code: 400, message: "OTP not found. Please request a new one." });

  if (new Date() > record.expiresAt)
    return sendResponse(res, { code: 400, message: "OTP has expired. Please request a new one." });

  if (record.otp !== otp)
    return sendResponse(res, { code: 400, message: "Invalid OTP. Please try again." });

  await Otp.findOneAndDelete({ email });

  req.session.otpVerified = true;

  return sendResponse(res, {
    code: 200,
    message: "OTP verified",
    redirectUrl: "/admin/new-password",
  });
};

export const showNewPassword = (req, res) => {
  if (!req.session.resetEmail || !req.session.otpVerified)
    return res.redirect("/admin/forgot-password");

  res.render("admin/pages/new-password", {
    title: "Set New Password",
    showLayout: false,
    cssFile: "",
    pageJS: "",
  });
};

export const resetPassword = async (req, res) => {
  const { password, confirmPassword } = req.body;
  const email = req.session.resetEmail;

  if (!email || !req.session.otpVerified)
    return sendResponse(res, { code: 400, message: "Session expired. Please try again." });

  if (password !== confirmPassword)
    return sendResponse(res, { code: 400, message: "Passwords do not match" });

  if (password.length < 6)
    return sendResponse(res, { code: 400, message: "Password must be at least 6 characters" });

  const hashed = await bcrypt.hash(password, 10);
  await Admin.findOneAndUpdate({ email }, { password: hashed });

  delete req.session.resetEmail;
  delete req.session.otpVerified;

  return sendResponse(res, {
    code: 200,
    message: "Password reset successful",
    redirectUrl: "/admin/login",
  });
};