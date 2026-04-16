import mongoose from "mongoose";
import validator from "validator";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/; // HH:mm
const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "An event must have a title"],
    trim: true,
    maxLength: [120, "An event title must have at most 120 characters"],
  },
  description: {
    type: String,
    default: "",
    maxLength: [4000, "An event description must have at most 4000 characters"],
  },
  settlement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Settlement",
    required: [true, "An event must be associated with a settlement"],
    index: true,
  },
  // Single-day event fields (in the event's chosen timezone)
  localDate: {
    type: String,
    required: [true, "An event must have a date"],
    validate: {
      validator: (v) => dateRegex.test(String(v)),
      message: "localDate must be in YYYY-MM-DD format",
    },
    index: true,
  },
  startTime: {
    type: String,
    required: [true, "An event must have a start time"],
    validate: {
      validator: (v) => timeRegex.test(String(v)),
      message: "startTime must be in HH:mm format",
    },
  },
  endTime: {
    type: String,
    required: [true, "An event must have an end time"],
    validate: {
      validator: (v) => timeRegex.test(String(v)),
      message: "endTime must be in HH:mm format",
    },
  },
  timeZone: {
    type: String,
    required: [true, "An event must have a time zone"],
    default: "Europe/Bucharest",
    trim: true,
    maxLength: [64, "timeZone must have at most 64 characters"],
  },
  location: {
    type: String,
    default: "",
    trim: true,
    maxLength: [200, "location must have at most 200 characters"],
  },
  linkUrl: {
    type: String,
    default: "",
    trim: true,
    maxLength: [500, "linkUrl must have at most 500 characters"],
    validate: {
      validator: (v) => {
        if (!v) return true;
        return validator.isURL(String(v), {
          require_protocol: true,
          protocols: ["http", "https"],
        });
      },
      message: "linkUrl must be a valid URL (include http/https)",
    },
  },
  status: {
    type: String,
    enum: ["draft", "published"],
    default: "draft",
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

eventSchema.index({ settlement: 1, localDate: 1, startTime: 1 });

eventSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

eventSchema.path("endTime").validate(function (value) {
  if (!this.startTime || !value) return true;
  // Lexicographic comparison is valid for HH:mm
  return String(value) > String(this.startTime);
}, "endTime must be after startTime");

const Event = mongoose.model("Event", eventSchema);

export default Event;
