import express from "express";
import { adminLayout } from "../../middlewares/layoutMiddleware.js";
import { isAdminLoggedIn } from "../../middlewares/adminAuth.js";
import wrapAsync from "../../utils/wrapAsync.js";
import {
  showLogin,
  login,
  getUsers,
  toggleBlockUser,
  logoutUser,
  getDashboard,
  showForgotPassword,
  sendForgotOtp,
  showVerifyOtp,
  verifyOtp,
  showNewPassword,
  resetPassword,
} from "../../controllers/AdminController.js";

const router = express.Router();

router.use(adminLayout);

// Auth
router.get("/login", showLogin);
router.post("/login", wrapAsync(login));
router.get("/logout", logoutUser);

// Forgot password flow
router.get("/forgot-password", showForgotPassword);
router.post("/forgot-password", wrapAsync(sendForgotOtp));
router.get("/verify-otp", showVerifyOtp);
router.post("/verify-otp", wrapAsync(verifyOtp));
router.get("/new-password", showNewPassword);
router.post("/new-password", wrapAsync(resetPassword));

// Protected routes
router.get("/dashboard", isAdminLoggedIn, getDashboard);
router.get("/users", isAdminLoggedIn, wrapAsync(getUsers));
router.patch("/block-user/:id", isAdminLoggedIn, wrapAsync(toggleBlockUser));

export default router;
