import Coordinates from "../models/coordinatesModel.js";
import {
  updateOne,
  getOne,
  getAll,
  deleteOne,
  createOne,
} from "./handleFactory.js";

export const getAllCoordinates = getAll(Coordinates);
export const getCoordinates = getOne(Coordinates);
export const createCoordinates = createOne(Coordinates);
export const updateCoordinates = updateOne(Coordinates);
export const deleteCoordinates = deleteOne(Coordinates);
