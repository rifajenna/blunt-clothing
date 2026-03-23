import mongoose from "mongoose";

const userSchema = new mongoose.Schema({

  name: String,

  email: {
    type: String,
    unique: true
  },

  password: {
    type: String
  },

  phone: String,

  profileImage: {
    type: String,
    default: "/images/default-user.png"
  },

  googleId: {
    type: String
  },

  address: {
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