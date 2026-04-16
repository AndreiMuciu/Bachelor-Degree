import mongoose from "mongoose";
import Event from "../models/eventModel.js";
import APIFeatures from "../utils/APIFeatures.js";

const clampLimit = (value, { min, max, fallback }) => {
  const num = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, num));
};

const isValidLocalDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value));

const isValidObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(String(value ?? ""));

const userCanAccessSettlement = (user, settlementId) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (!settlementId) return false;
  return (user.settlements || []).some(
    (id) => id.toString() === String(settlementId),
  );
};

const pickEventPayload = (body, { allowSettlement }) => {
  const allowedKeys = [
    "title",
    "description",
    "localDate",
    "startTime",
    "endTime",
    "timeZone",
    "location",
    "linkUrl",
    "status",
  ];

  if (allowSettlement) allowedKeys.push("settlement");

  const payload = {};
  for (const key of allowedKeys) {
    if (body?.[key] !== undefined) payload[key] = body[key];
  }
  return payload;
};

export const getAllEvents = async (req, res) => {
  try {
    // Enforce settlement-based scoping for non-admin users to prevent IDOR.
    if (req.user?.role !== "admin") {
      const settlementQuery = req.query?.settlement;
      if (
        typeof settlementQuery === "string" &&
        settlementQuery &&
        !userCanAccessSettlement(req.user, settlementQuery)
      ) {
        return res.status(403).json({
          status: "fail",
          message:
            "You do not have permission to access events for this settlement.",
        });
      }
    }

    const baseFilter =
      req.user?.role === "admin"
        ? {}
        : { settlement: { $in: req.user?.settlements || [] } };

    const features = new APIFeatures(Event.find(baseFilter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const docs = await features.query;

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

export const getEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid event ID",
      });
    }

    const doc = await Event.findById(id).select("-__v");

    if (!doc) {
      return res.status(404).json({
        status: "fail",
        message: "No document found with that ID",
      });
    }

    if (!userCanAccessSettlement(req.user, doc.settlement)) {
      return res.status(403).json({
        status: "fail",
        message: "You do not have permission to access this event.",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err?.message || "Failed to fetch event",
    });
  }
};

export const createEvent = async (req, res) => {
  try {
    const payload = pickEventPayload(req.body, { allowSettlement: true });

    if (!payload.settlement) {
      return res.status(400).json({
        status: "fail",
        message: "An event must be associated with a settlement",
      });
    }

    if (!isValidObjectId(payload.settlement)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid settlement ID",
      });
    }

    if (!userCanAccessSettlement(req.user, payload.settlement)) {
      return res.status(403).json({
        status: "fail",
        message:
          "You do not have permission to create events for this settlement.",
      });
    }

    const doc = await Event.create(payload);

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
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid event ID",
      });
    }

    const existing = await Event.findById(id);
    if (!existing) {
      return res.status(404).json({
        status: "fail",
        message: "No document found with that ID",
      });
    }

    if (!userCanAccessSettlement(req.user, existing.settlement)) {
      return res.status(403).json({
        status: "fail",
        message: "You do not have permission to update this event.",
      });
    }

    // By default, do not allow moving events between settlements for non-admin users.
    const allowSettlement = req.user?.role === "admin";
    const updates = pickEventPayload(req.body, { allowSettlement });

    // Ensure updatedAt is bumped even for findByIdAndUpdate
    updates.updatedAt = new Date();

    const doc = await Event.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select("-__v");

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

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid event ID",
      });
    }

    const existing = await Event.findById(id);
    if (!existing) {
      return res.status(404).json({
        status: "fail",
        message: "No document found with that ID",
      });
    }

    if (!userCanAccessSettlement(req.user, existing.settlement)) {
      return res.status(403).json({
        status: "fail",
        message: "You do not have permission to delete this event.",
      });
    }

    await Event.findByIdAndDelete(id);

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err?.message || "Failed to delete event",
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

    if (!isValidObjectId(settlement)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid settlement",
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

    if (from && to && String(from) > String(to)) {
      return res.status(400).json({
        status: "fail",
        message: "from must be <= to",
      });
    }

    const query = {
      settlement: String(settlement),
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
