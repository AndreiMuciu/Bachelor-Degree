import mongoose from "mongoose";

const settlementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "A settlement must have a name"],
  },
  judet: {
    type: String,
    required: [true, "A settlement must have a judet"],
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
