import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

// Central error handler. Every error in the app ends up here.
// Response shape: { success: false, message, details? }
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message = "Internal server error";
  let details = null;
  let code = null;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
    code = err.code;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation failed";
    details = err.issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
    }));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      statusCode = 409;
      message = "A record with this value already exists";
    } else if (err.code === "P2025") {
      statusCode = 404;
      message = "Record not found";
    } else if (err.code === "P2003") {
      statusCode = 409;
      message = "This record is linked to other records";
    }
  } else if (String(err.message).includes("showtimes_no_overlap_per_screen")) {
    // PostgreSQL exclusion constraint (see prisma/constraints.sql)
    statusCode = 409;
    message = "This time overlaps another showtime on the same screen";
  } else if (
    String(err.message).includes("booking_seats_one_active_per_show_seat")
  ) {
    statusCode = 409;
    message = "One of the selected seats has just been booked";
  } else if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Invalid JSON in request body";
  }

  if (statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(code && { code }),
    ...(details && { details }),
    ...(env.NODE_ENV === "development" &&
      statusCode === 500 && { stack: err.stack }),
  });
};
