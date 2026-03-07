import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

export const showSignup = (req, res) => {
  res.render("admin/signup");
};

export const signup = async (req, res) => {
  const { name, email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = new Admin({
    name,
    email,
    password: hashedPassword
  });

  await admin.save();
  res.send("Admin created");
};

export const showLogin = (req, res) => {
  res.render("admin/login");
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email });
  if (!admin) return res.send("Admin not found");

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) return res.send("Wrong password");

 req.session.admin = admin._id;
res.redirect("/admin/users");
};

export const getUsers = async (req, res) => {

  const search = req.query.search || "";
  const page = parseInt(req.query.page) || 1;
  const limit = 5;

  const query = {
    email: { $regex: search, $options: "i" }
  };

  const totalUsers = await User.countDocuments(query);

  const users = await User.find(query)
    .sort({ createdAt: -1 })   // latest first
    .skip((page - 1) * limit)
    .limit(limit);

  res.render("admin/users", {
    users,
    totalPages: Math.ceil(totalUsers / limit),
    currentPage: page,
    search
  });
};

export const toggleBlockUser = async (req, res) => {

  const user = await User.findById(req.params.id);

  user.isBlocked = !user.isBlocked;

  await user.save();

  res.redirect("/admin/users");
};

export const createPermanentAdmin = async () => {

  const exists = await Admin.findOne({ email: "admin@blunt.com" });

  if (!exists) {
    const hashedPassword = await bcrypt.hash("admin123", 10);

    await Admin.create({
      name: "Super Admin",
      email: "admin@blunt.com",
      password: hashedPassword
    });

    console.log("Permanent Admin Created");
  }
};

export const logoutUser = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/user/login");
  });
};