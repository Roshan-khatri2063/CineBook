import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyToken } from "../utils/jwt.js";
import { findActiveUserById, toPublicUser } from "../services/auth.service.js";

const INVALID_SESSION =
  "Your session is invalid or has expired. Please log in again.";

// Requires a valid "Authorization: Bearer <token>" header.
// Puts the current user (without password hash) on req.user.
export const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new AppError("Authentication required. Please log in.", 401);
  }

  let payload;
  try {
    payload = verifyToken(header.slice(7).trim());
  } catch {
    throw new AppError(INVALID_SESSION, 401);
  }

  const userId = Number(payload.sub);
  if (!Number.isInteger(userId)) throw new AppError(INVALID_SESSION, 401);

  // Always read the user from the database: role and isActive are never
  // trusted from the token.
  const user = await findActiveUserById(userId);
  if (!user) throw new AppError(INVALID_SESSION, 401);
  if (!user.isActive)
    throw new AppError("This account has been deactivated.", 403);

  req.user = toPublicUser(user);
  next();
});

// Use after authenticate:  router.get("/x", authenticate, authorize("ADMIN"), handler)
export const authorize =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user)
      return next(new AppError("Authentication required. Please log in.", 401));
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to access this resource", 403),
      );
    }
    next();
  };
