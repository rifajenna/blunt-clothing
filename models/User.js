import mongoose from "mongoose";

const userSchema = new mongoose.Schema({

  name: String,

  email: {
    type: String,
    unique: true
  },

  password: String,

  phone: String,   // ✅ new

  profileImage: {  // ✅ new
    type: String,
    default: "/images/default-user.png"
  },

  address: {       // ✅ new
    house: String,
    city: String,
    state: String,
    pincode: String
  },

  isBlocked: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

export default mongoose.model("User", userSchema);

