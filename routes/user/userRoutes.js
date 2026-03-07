import express from "express";

import {
  showSignup,
  signupUser,
  showLogin,
  loginUser,
  logoutUser,
  showHome,
  showProfile,
  showEditProfile,
  updateProfile,
  showAddAddress,
  addAddress,
  deleteAddress,
  showEditAddress,
  updateAddress,
  showForgotPassword,
  sendResetOtp,
   verifyOtp,
   getAddresses,
  showResetPassword,
  resetPassword,
  changePassword,
  showChangePassword
} from "../../controllers/UserController.js";

import { isUserLoggedIn } from "../../middlewares/userAuth.js";

const router = express.Router();

router.get("/signup", showSignup);
router.post("/signup", signupUser);

router.get("/login", showLogin);
router.post("/login", loginUser);

router.get("/logout", logoutUser);


router.get("/home", isUserLoggedIn, showHome);
router.get("/profile", isUserLoggedIn, showProfile);

router.get("/edit-profile", isUserLoggedIn, showEditProfile);
router.post("/edit-profile", isUserLoggedIn, updateProfile);

router.get("/verify-otp", (req,res)=> res.render("user/verify-otp"));
router.post("/verify-otp", verifyOtp);

router.get("/addresses", isUserLoggedIn, getAddresses);

router.get("/add-address", isUserLoggedIn, showAddAddress);
router.post("/add-address", isUserLoggedIn, addAddress);

router.get("/delete-address/:id", isUserLoggedIn, deleteAddress);

router.get("/edit-address/:id", isUserLoggedIn, showEditAddress);
router.post("/edit-address/:id", isUserLoggedIn, updateAddress);

router.get("/forgot-password", showForgotPassword);
router.post("/forgot-password", sendResetOtp);

router.get("/reset-password", showResetPassword);
router.post("/reset-password", resetPassword);

router.get("/change-password", isUserLoggedIn, showChangePassword);
router.post("/change-password", isUserLoggedIn, changePassword);

export default router;