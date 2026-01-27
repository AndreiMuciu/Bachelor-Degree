import mongoose from "mongoose";

const coordinatesSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Coordinates must have a name"],
    trim: true,
    maxlength: [
      100,
      "Coordinates name must have less than or equal to 100 characters",
    ],
    minlength: [
      1,
      "Coordinates name must have more than or equal to 1 character",
    ],
  },
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
