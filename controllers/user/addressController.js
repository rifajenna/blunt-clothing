import User from "../../models/User.js";
import Address from "../../models/Address.js";
import { sendResponse } from "../../utils/sendResponse.js";

export const getAddresses = async (req, res) => {
  const userId = req.session.user;
  const user = await User.findById(userId);
  const addresses = await Address.find({ userId });
  res.render("user/addresses", { layout: false, user, addresses });
};

export const showAddAddress = async (req, res) => {
  const user = await User.findById(req.session.user);
  res.render("user/add-address", { layout: false, user });
};

export const addAddress = async (req, res) => {
  const userId = req.session.user;
  const newAddress = new Address({ userId, ...req.body });
  await newAddress.save();
  return sendResponse(res, {
    code: 200,
    message: "Address added",
    redirectUrl: "/user/addresses",
  });
};

export const deleteAddress = async (req, res) => {
  await Address.findByIdAndDelete(req.params.id);
  return sendResponse(res, {
    code: 200,
    message: "Address deleted",
    redirectUrl: "/user/addresses",
  });
};

export const showEditAddress = async (req, res) => {
  const address = await Address.findById(req.params.id);
  const user = await User.findById(req.session.user);
  res.render("user/edit-address", { layout: false, address, user });
};

export const updateAddress = async (req, res) => {
  await Address.findByIdAndUpdate(req.params.id, req.body);
  return sendResponse(res, {
    code: 200,
    message: "Address updated",
    redirectUrl: "/user/addresses",
  });
};

export const setDefaultAddress = async (req, res) => {
  const userId = req.session.user;
  
  await Address.updateMany({ userId }, { isDefault: false });
  await Address.findByIdAndUpdate(req.params.id, { isDefault: true });
  
  return sendResponse(res, {
    code: 200,
    message: "Default address updated",
  });
};
