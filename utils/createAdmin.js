import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";

export const createDefaultAdmin = async () => {

  const existingAdmin = await Admin.findOne({ email: "admin@blunt.com" });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin123", 10);

    await Admin.create({
      email: "admin@blunt.com",
      password: hashedPassword
    });

    console.log("Default Admin Created");
  }
};