import mongoose from "mongoose";

const settlementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
    trim: true,
  },
  judet: {
    type: String,
    required: [true, "A settlement must have a judet"],
    trim: true,
  },
  lat: {
    type: Number,
    required: [true, "A settlement must have a latitude"],
  },
  lng: {
    type: Number,
    required: [true, "A settlement must have a longitude"],
  },
  active: {
    type: Boolean,
    default: false,
  },
});

const Settlement = mongoose.model("Settlement", settlementSchema);

export default Settlement;
