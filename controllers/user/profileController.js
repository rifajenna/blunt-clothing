import User from "../../models/User.js";
import bcrypt from "bcryptjs";
import { sendResponse } from "../../utils/sendResponse.js";

export const showLandingPage = (req, res) => {
  res.render("user/landing", { layout: false, user: req.session.user });
};

export const showHome = async (req, res) => {
  const user = await User.findById(req.session.user);
  res.render("user/home", { layout: false, user });
};

export const showProfile = async (req, res) => {
  const user = await User.findById(req.session.user);
  res.render("user/profile", { layout: false, user });
};

export const showEditProfile = async (req, res) => {
  const user = await User.findById(req.session.user);
  res.render("user/edit-profile", { layout: false, user });
};

export const updateProfile = async (req, res) => {
  const { name, phone } = req.body;
  await User.findByIdAndUpdate(req.session.user, { name, phone });
  return sendResponse(res, {
    code: 200,
    message: "Profile updated",
    redirectUrl: "/user/profile",
  });
};

export const showChangePassword = (req, res) => {
  res.render("user/change-password", { layout: false });
};

export const showNewPassword = (req, res) => {
  res.render("user/new-password", { layout: false });
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.session.user);

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match)
    return sendResponse(res, { code: 401, message: "Current password incorrect" });

  const hashed = await bcrypt.hash(newPassword, 10);
  await User.findByIdAndUpdate(req.session.user, { password: hashed });

  return sendResponse(res, {
    code: 200,
    message: "Password changed successfully",
    redirectUrl: "/user/profile",
  });
};
