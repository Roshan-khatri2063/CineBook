import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";


export const errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message = "Internal server error";
  let details = null;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
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
    ...(details && { details }),
    ...(env.NODE_ENV === "development" &&
      statusCode === 500 && { stack: err.stack }),
  });
};
