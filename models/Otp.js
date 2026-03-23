import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: String,
  otp: String,
  expiresAt: { type: Date, expires: 0 }
},{timestamps: true});

export default mongoose.model("Otp", otpSchema);