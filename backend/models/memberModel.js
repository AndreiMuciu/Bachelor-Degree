import mongoose from "mongoose";

const memberSchema = new mongoose.Schema({
  lastName: {
    type: String,
    required: [true, "A member must have a last name"],
  },
  firstName: {
    type: String,
    required: [true, "A member must have a first name"],
  },
  dateOfBirth: {
    type: Date,
    required: [true, "A member must have a date of birth"],
  },
  description: {
    type: String,
  },
  gender: {
    type: String,
    default: "nespecificat",
  },
  position: {
    type: String,
  },
  settlement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Settlement",
    required: [true, "A member must belong to a settlement"],
  },
});

const Member = mongoose.model("Member", memberSchema);

export default Member;
