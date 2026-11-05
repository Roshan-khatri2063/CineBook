import bcrypt from "bcrypt";
import prisma from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { signToken } from "../utils/jwt.js";

const SALT_ROUNDS = 10;

// Used when the email does not exist, so a failed login takes about the same
// time whether or not the account exists (prevents user enumeration by timing).
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", SALT_ROUNDS);

// passwordHash is deliberately NOT in this list.
const SAFE_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  createdAt: true,
};

// Whitelist of fields that may leave the server. Never spread a user object.
export const toPublicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  createdAt: user.createdAt,
});

export const registerCustomer = async ({ name, email, phone, password }) => {
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    throw new AppError("An account with this email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // The role is hard-coded: public registration can never create an admin.
  const user = await prisma.user.create({
    data: { name, email, phone: phone ?? null, passwordHash, role: "CUSTOMER" },
    select: SAFE_SELECT,
  });

  return { user: toPublicUser(user), token: signToken(user) };
};

export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  const passwordOk = await bcrypt.compare(
    password,
    user ? user.passwordHash : DUMMY_HASH,
  );
  if (!user || !passwordOk) {
    // Same message for "no such email" and "wrong password".
    throw new AppError("Invalid email or password", 401);
  }
  if (!user.isActive) {
    throw new AppError(
      "This account has been deactivated. Please contact the cinema.",
      403,
    );
  }

  return { user: toPublicUser(user), token: signToken(user) };
};

export const findActiveUserById = (id) =>
  prisma.user.findUnique({ where: { id }, select: SAFE_SELECT });
