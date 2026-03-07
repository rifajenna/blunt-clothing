import express from "express";
import { 
  showLogin, 
  login, 
  showSignup, 
  signup,
  getUsers,
  toggleBlockUser,
  logoutUser
} from "../../controllers/AdminController.js";

import { isAdminLoggedIn } from "../../middlewares/adminAuth.js";

const router = express.Router();

router.get("/login", showLogin);
router.post("/login", login);

router.get("/signup", showSignup);
router.post("/signup", signup);



router.get("/users", isAdminLoggedIn, getUsers);

router.patch("/block-user/:id", isAdminLoggedIn, toggleBlockUser);

router.get("/logout", isAdminLoggedIn, logoutUser);


export default router;