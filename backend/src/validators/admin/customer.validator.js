import { z } from "zod";
import { booleanQuery, optionalQuery, paginationShape } from "../common.js";

export const listCustomersQuerySchema = z.object({
  ...paginationShape,
  q: optionalQuery(z.string().trim().max(100)), // name, email or phone
  isActive: optionalQuery(booleanQuery),
});

export const updateCustomerStatusSchema = z.strictObject({
  isActive: z.boolean({ error: "isActive must be true or false" }),
});
