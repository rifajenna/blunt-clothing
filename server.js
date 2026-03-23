import dotenv from "dotenv";
dotenv.config();

import express from "express";
import session from "express-session";
import expressEjsLayouts from "express-ejs-layouts";
import path from "path";
import { fileURLToPath } from "url";
import adminRoutes from "./routes/adminRoutes.js";
import connectDB from "./config/db.js";
import methodOverride from "method-override";
import userRoutes from "./routes/userRoutes.js";
import { createDefaultAdmin } from "./utils/createAdmin.js";
import { createPermanentAdmin } from "./controllers/admin/authController.js";
import { errorHandler } from "./utils/errorHandler.js";
import passport, { initPassport } from "./config/passport.js";
import MongoStore from "connect-mongo";

initPassport(); 

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"), { maxAge: 0 }));
app.use(expressEjsLayouts);
app.use(methodOverride("_method"));

app.set("view engine", "ejs");

app.use(session({
  secret: process.env.SESSION_SECRET || "adminSecret",
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

import { showLandingPage } from "./controllers/user/profileController.js";

app.use("/admin", adminRoutes);
app.use("/user", userRoutes);

app.get("/", showLandingPage);

app.use(errorHandler);

connectDB().then(async () => {
  await createDefaultAdmin();
  await createPermanentAdmin();
  app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
  });
}).catch(err => console.error(err));
