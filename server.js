import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import adminRoutes from "./routes/admin/adminRoutes.js";
import connectDB from "./config/db.js";
import methodOverride from "method-override";
import userRoutes from "./routes/user/userRoutes.js";
import { createDefaultAdmin } from "./utils/createAdmin.js";
import { createPermanentAdmin } from "./controllers/AdminController.js";

dotenv.config();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.use(methodOverride("_method"));

app.set("view engine", "ejs");

app.use(session({
  secret: "adminSecret",
  resave: false,
  saveUninitialized: true
}));

/* 🔹 ADD THIS MIDDLEWARE */
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

connectDB().then(async () => {
  await createDefaultAdmin();
  await createPermanentAdmin();
});

app.use("/admin", adminRoutes);
app.use("/user", userRoutes);

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});