import express from "express";
import { adminLayout } from "../middlewares/layoutMiddleware.js";
import { isAdminLoggedIn } from "../middlewares/adminAuth.js";
import wrapAsync from "../utils/wrapAsync.js";
import {
  showLogin,
  login,
  logoutUser,
  showForgotPassword,
  sendForgotOtp,
  showVerifyOtp,
  verifyOtp,
  showNewPassword,
  resetPassword,
} from "../controllers/admin/authController.js";
import { getDashboard } from "../controllers/admin/dashboardController.js";
import { getUsers, toggleBlockUser } from "../controllers/admin/userController.js";
import {
  getCategories,
  showAddCategory,
  addCategory,
  showEditCategory,
  editCategory,
  softDeleteCategory
} from "../controllers/admin/categoryController.js";
import {
  getProducts,
  showAddProduct,
  addProduct,
  showEditProduct,
  editProduct,
  softDeleteProduct
} from "../controllers/admin/productController.js";
import { uploadProductImage } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.use(adminLayout);

//Auth
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

// Category routes
router.get("/categories", isAdminLoggedIn, wrapAsync(getCategories));
router.get("/categories/add", isAdminLoggedIn, showAddCategory);
router.post("/categories/add", isAdminLoggedIn, wrapAsync(addCategory));
router.get("/categories/edit/:id", isAdminLoggedIn, wrapAsync(showEditCategory));
router.post("/categories/edit/:id", isAdminLoggedIn, wrapAsync(editCategory));
router.patch("/categories/soft-delete/:id", isAdminLoggedIn, wrapAsync(softDeleteCategory));

// Product routes
router.get("/products", isAdminLoggedIn, wrapAsync(getProducts));
router.get("/products/add", isAdminLoggedIn, wrapAsync(showAddProduct));
router.post(
  "/products/add",
  isAdminLoggedIn,
  uploadProductImage.array("images", 10),
  wrapAsync(addProduct)
);
router.get("/products/edit/:id", isAdminLoggedIn, wrapAsync(showEditProduct));
router.post(
  "/products/edit/:id",
  isAdminLoggedIn,
  uploadProductImage.array("images", 10),
  wrapAsync(editProduct)
);
router.patch("/products/soft-delete/:id", isAdminLoggedIn, wrapAsync(softDeleteProduct));

export default router;