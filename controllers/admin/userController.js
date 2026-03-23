import User from "../../models/User.js";
import { sendResponse } from "../../utils/sendResponse.js";

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
