import prisma from "../../config/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { buildPagination, getSkip } from "../../utils/pagination.js";

// passwordHash is deliberately not selected.
const customerSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  isActive: true,
  createdAt: true,
  _count: { select: { bookings: true } },
};

export const listCustomers = async ({ page, limit, q, isActive }) => {
  const where = {
    role: "CUSTOMER", // admins never appear in this list
    ...(isActive !== undefined && { isActive }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ],
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: getSkip(page, limit),
      take: limit,
      select: customerSelect,
    }),
    prisma.user.count({ where }),
  ]);

  return { items, pagination: buildPagination(page, limit, total) };
};

// Activate or deactivate a customer account. Deactivated customers cannot log in.
// Only CUSTOMER accounts can be changed here, never admins.
export const setCustomerActive = async (id, isActive) => {
  const customer = await prisma.user.findFirst({
    where: { id, role: "CUSTOMER" },
    select: { id: true },
  });
  if (!customer) throw new AppError("Customer not found", 404);
  return prisma.user.update({
    where: { id },
    data: { isActive },
    select: customerSelect,
  });
};
