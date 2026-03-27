import express from "express";
import wrapAsync from "../utils/wrapAsync.js";
import passport from "../config/passport.js";
import { isUserLoggedIn } from "../middlewares/userAuth.js";
import {
  showSignup, signupUser, showVerifyOtp, verifyOtp, resendOtp,
  showLogin, loginUser, logoutUser, showForgotPassword, sendResetOtp,
  showVerifyResetOtp, verifyResetOtp, resendResetOtp, showResetPassword, resetPassword
} from "../controllers/user/authController.js";
import {
  showLandingPage, showHome, showProfile, showEditProfile, updateProfile,
  showNewPassword, showChangePassword, changePassword
} from "../controllers/user/profileController.js";
import {
  getAddresses, showAddAddress, addAddress, deleteAddress,
  showEditAddress, updateAddress, setDefaultAddress
} from "../controllers/user/addressController.js";
import { getShopPage, getProductDetails } from "../controllers/user/shopController.js";
import { 
  getCart, addToCart, removeFromCart, updateCartQuantity,
  getWishlist, toggleWishlist 
} from "../controllers/user/cartController.js";
import { userLayout } from "../middlewares/layoutMiddleware.js";

const router = express.Router();

router.use(userLayout);

// Shop & Product Details
router.get("/shop", wrapAsync(getShopPage));
router.get("/shop/product/:id", wrapAsync(getProductDetails));

// Cart
router.get("/cart", isUserLoggedIn, wrapAsync(getCart));
router.post("/cart/add", isUserLoggedIn, wrapAsync(addToCart));
router.patch("/cart/update", isUserLoggedIn, wrapAsync(updateCartQuantity));
router.delete("/cart/remove", isUserLoggedIn, wrapAsync(removeFromCart));

// Wishlist
router.get("/wishlist", isUserLoggedIn, wrapAsync(getWishlist));
router.post("/wishlist/toggle", isUserLoggedIn, wrapAsync(toggleWishlist));

// Google Auth
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/user/login" }),
  (req, res) => {
    req.session.user = req.user._id;
    res.redirect("/user/home");
  }
);

// Signup & OTP
router.get("/signup", showSignup);
router.post("/signup", wrapAsync(signupUser));

router.get("/verify-otp", showVerifyOtp);             // ✅ only one GET handler
router.post("/verify-otp", wrapAsync(verifyOtp));
router.post("/resend-otp", wrapAsync(resendOtp));

// Login / Logout
router.get("/login", showLogin);
router.post("/login", wrapAsync(loginUser));
router.get("/logout", logoutUser);

// Forgot Password
router.get("/forgot-password", showForgotPassword);
router.post("/forgot-password", wrapAsync(sendResetOtp));

router.get("/verify-reset-otp", showVerifyResetOtp);  // ✅ dedicated OTP page
router.post("/verify-reset-otp", wrapAsync(verifyResetOtp));
router.post("/resend-reset-otp", wrapAsync(resendResetOtp));

router.get("/reset-password", showResetPassword);
router.post("/reset-password", wrapAsync(resetPassword));

// Home & Profile
router.get("/home", isUserLoggedIn, showHome);
router.get("/profile", isUserLoggedIn, showProfile);

router.get("/edit-profile", isUserLoggedIn, showEditProfile);
router.post("/edit-profile", isUserLoggedIn, wrapAsync(updateProfile));

// Change Password
router.get("/change-password", isUserLoggedIn, showChangePassword);
router.post("/change-password", isUserLoggedIn, wrapAsync(changePassword));
router.get("/new-password", isUserLoggedIn, showNewPassword);

// Addresses
router.get("/addresses", isUserLoggedIn, wrapAsync(getAddresses));
router.get("/add-address", isUserLoggedIn, showAddAddress);
router.post("/add-address", isUserLoggedIn, wrapAsync(addAddress));
router.delete("/delete-address/:id", isUserLoggedIn, wrapAsync(deleteAddress));
router.get("/edit-address/:id", isUserLoggedIn, showEditAddress);
router.post("/edit-address/:id", isUserLoggedIn, wrapAsync(updateAddress));
router.patch("/set-default-address/:id", isUserLoggedIn, wrapAsync(setDefaultAddress));

export default router;