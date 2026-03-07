import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  name: String,
  phone: String,
  pincode: String,
  city: String,
  state: String,
  house: String,
  area: String,
  landmark: String,
  type: {
    type: String,
    enum: ["Home", "Work"],
    default: "Home"
  }
});

const Address = mongoose.model("Address", addressSchema);

export default Address;