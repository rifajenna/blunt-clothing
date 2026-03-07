import User from "../models/User.js";
import bcrypt from "bcryptjs";
import Otp from "../models/Otp.js";
import { sendOtpMail } from "../utils/sendOtp.js";
import Address from "../models/Address.js";

// SHOW SIGNUP PAGE
export const showSignup = (req, res) => {
  res.render("user/signup");
};

// SIGNUP LOGIC
export const signupUser = async (req, res) => {

  const { name, email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return res.send("User already exists");

  const otp = Math.floor(100000 + Math.random() * 900000);

  await Otp.create({
    email,
    otp,
    expiresAt: Date.now() + 60000   // 1 min expiry
  });

  await sendOtpMail(email, otp);

  req.session.tempUser = { name, email, password };

  res.redirect("/user/verify-otp");
};


// SHOW LOGIN PAGE
export const showLogin = (req, res) => {
  res.render("user/login");
};


// LOGIN LOGIC
export const loginUser = async (req, res) => {

  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.send("User not found");

  // BLOCK CHECK
  if (user.isBlocked) {
    return res.send("You are blocked by admin");
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.send("Wrong password");

  req.session.user = user._id;

  res.redirect("/user/home");
};


// SHOW HOME
export const showHome = async (req, res) => {

  const user = await User.findById(req.session.user);

  res.render("user/home", { user });
};

// LOGOUT
export const logoutUser = (req, res) => {
  req.session.destroy();
  res.redirect("/user/login");
};


// SHOW PROFILE PAGE
export const showProfile = async (req, res) => {
  const user = await User.findById(req.session.user);
  res.render("user/profile", { user });
};


// SHOW EDIT PROFILE PAGE
export const showEditProfile = async (req, res) => {
  const user = await User.findById(req.session.user);
  res.render("user/edit-profile", { user });
};


// UPDATE PROFILE
export const updateProfile = async (req, res) => {

  const { name, phone } = req.body;

  await User.findByIdAndUpdate(req.session.user, {
    name,
    phone
  });

  res.redirect("/user/profile");
};

export const verifyOtp = async (req, res) => {

  const { otp } = req.body;
  const temp = req.session.tempUser;

  if (!temp) {
    return res.redirect("/user/signup");
  }

  const record = await Otp.findOne({ email: temp.email }).sort({ createdAt: -1 });

  if (!record || record.otp.toString() !== otp || record.expiresAt < Date.now()) {
    return res.send("OTP expired or invalid");
  }

  const hashed = await bcrypt.hash(temp.password, 10);

  await User.create({
    name: temp.name,
    email: temp.email,
    password: hashed
  });

  await Otp.deleteMany({ email: temp.email });

  req.session.tempUser = null;

  res.redirect("/user/login");
};

export const getAddresses = async (req, res) => {

  try {

    const userId = req.session.user;

    const user = await User.findById(userId);

    const addresses = await Address.find({ userId });

    res.render("user/addresses", {
      user,
      addresses
    });

  } catch (error) {

    console.log(error);
    res.redirect("/user/profile");

  }

};

export const showAddAddress = async (req,res)=>{

  const user = await User.findById(req.session.user)

  res.render("user/add-address",{user})

}

export const addAddress = async (req,res)=>{
  try{

    const userId = req.session.user;

    const newAddress = new Address({
      userId,
      ...req.body
    });

    await newAddress.save();

    res.redirect("/user/addresses");

  }catch(error){
    console.log(error);
  }
};

export const deleteAddress = async (req,res)=>{

  try{

    const id = req.params.id;

    await Address.findByIdAndDelete(id);

    res.redirect("/user/addresses");

  }catch(error){
    console.log(error);
  }

};

export const showEditAddress = async (req, res) => {

  try {

    const address = await Address.findById(req.params.id);

    const user = await User.findById(req.session.user);

    res.render("user/edit-address", {
      address,
      user
    });

  } catch (error) {

    console.log(error);
    res.redirect("/user/addresses");

  }

};


export const updateAddress = async (req,res)=>{

  await Address.findByIdAndUpdate(req.params.id, req.body);

  res.redirect("/user/addresses");

};

export const showForgotPassword = (req,res)=>{
  res.render("user/forgot-password")
};

export const sendResetOtp = async (req,res)=>{

  const { email } = req.body

  const user = await User.findOne({email})

  if(!user){
    return res.send("User not found")
  }

  const otp = Math.floor(100000 + Math.random() * 900000)

  console.log("Reset OTP:", otp)

  // 🔹 DELETE OLD OTPs
  await Otp.deleteMany({ email })

  await Otp.create({
    email,
    otp,
    expiresAt: Date.now() + 600000
  })

  await sendOtpMail(email, otp)

  req.session.resetEmail = email

  res.redirect("/user/reset-password")

}

export const showResetPassword = (req,res)=>{
  res.render("user/reset-password")
}

export const resetPassword = async (req, res) => {

  const { otp, password } = req.body;

  const email = req.session.resetEmail;

  const record = await Otp.findOne({ email }).sort({ createdAt: -1 });

console.log("Entered OTP:", otp);
console.log("DB OTP:", record?.otp);
console.log("Expiry:", record?.expiresAt);

  if (!record || record.otp.toString() !== otp || record.expiresAt < Date.now()) {
    return res.send("OTP expired or invalid");
  }

  const hashed = await bcrypt.hash(password, 10);

  await User.updateOne({ email }, { password: hashed });

  await Otp.deleteMany({ email });

  await Otp.create({
  email,
  otp,
  expiresAt: Date.now() + 600000
});

  req.session.resetEmail = null;

  res.redirect("/user/login");
};

export const showChangePassword = (req,res)=>{
  res.render("user/change-password")
}


export const changePassword = async (req,res)=>{

  const { currentPassword, newPassword } = req.body

  const user = await User.findById(req.session.user)

  const match = await bcrypt.compare(currentPassword, user.password)

  if(!match){
    return res.send("Current password incorrect")
  }

  const hashed = await bcrypt.hash(newPassword,10)

  await User.findByIdAndUpdate(req.session.user,{
    password: hashed
  })

  res.redirect("/user/profile")
}