import User from "../models/userModel.js";
import {
  updateOne,
  getOne,
  getAll,
  deleteOne,
  createOne,
} from "./handleFactory.js";

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("settlements");

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: error.message,
    });
  }
};

export const getAllUsers = getAll(User);
export const getUser = getOne(User);
export const createUser = createOne(User);
export const updateUser = updateOne(User);
export const deleteUser = deleteOne(User);
