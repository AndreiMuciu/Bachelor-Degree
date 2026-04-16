import Event from "../models/eventModel.js";
import { deleteOne, getAll, getOne } from "./handleFactory.js";

const clampLimit = (value, { min, max, fallback }) => {
  const num = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, num));
};

const isValidLocalDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value));

export const getAllEvents = getAll(Event);
export const getEvent = getOne(Event);
export const deleteEvent = deleteOne(Event);

export const createEvent = async (req, res) => {
  try {
    const doc = await Event.create(req.body);

    res.status(201).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err?.message || "Invalid data sent",
    });
  }
};

export const updateEvent = async (req, res) => {
  try {
    // Ensure updatedAt is bumped even for findByIdAndUpdate
    const updates = { ...req.body, updatedAt: new Date() };

    const doc = await Event.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return res.status(404).json({
        status: "fail",
        message: "No document found with that ID",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err?.message || "Invalid data sent",
    });
  }
};

// Public endpoint used by generated static sites (no auth)
// Query params:
// - settlement (required)
// - from (optional, YYYY-MM-DD)
// - to (optional, YYYY-MM-DD)
// - limit (optional, max 500)
export const getPublicEvents = async (req, res) => {
  try {
    const { settlement, from, to, limit } = req.query;

    if (!settlement) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide settlement",
      });
    }

    if (from && !isValidLocalDate(from)) {
      return res.status(400).json({
        status: "fail",
        message: "from must be in YYYY-MM-DD format",
      });
    }

    if (to && !isValidLocalDate(to)) {
      return res.status(400).json({
        status: "fail",
        message: "to must be in YYYY-MM-DD format",
      });
    }

    const query = {
      settlement,
      status: "published",
    };

    if (from || to) {
      query.localDate = {};
      if (from) query.localDate.$gte = String(from);
      if (to) query.localDate.$lte = String(to);
    }

    const cappedLimit = clampLimit(limit, { min: 1, max: 500, fallback: 200 });

    const docs = await Event.find(query)
      .sort({ localDate: 1, startTime: 1 })
      .limit(cappedLimit)
      .select("-__v");

    res.status(200).json({
      status: "success",
      results: docs.length,
      data: {
        data: docs,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err?.message || "Failed to fetch events",
    });
  }
};
