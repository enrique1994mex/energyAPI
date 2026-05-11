import { AppError } from "../errors/AppError.js";

export const parseId = (param) => {
  const id = parseInt(param);
  if (isNaN(id)) throw new AppError("Invalid ID", 400);
  return id;
};
