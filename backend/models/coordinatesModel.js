import mongoose from "mongoose";

const coordinatesSchema = new mongoose.Schema({
  latitude: {
    type: Number,
    required: [true, "Coordinates must have a latitude"],
    min: [-90, "Latitude must be greater than or equal to -90"],
    max: [90, "Latitude must be less than or equal to 90"],
  },
  longitude: {
    type: Number,
    required: [true, "Coordinates must have a longitude"],
    min: [-180, "Longitude must be greater than or equal to -180"],
    max: [180, "Longitude must be less than or equal to 180"],
  },
  settlement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Settlement",
    required: [true, "Coordinates must be associated with a settlement"],
  },
});

const Coordinates = mongoose.model("Coordinates", coordinatesSchema);

export default Coordinates;
