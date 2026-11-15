// Prisma's `contains` does not escape the SQL wildcards % and _, so searching
// for "%" or "_" would match everything. This makes them ordinary characters.
export const escapeLike = (text) => text.replace(/[\\%_]/g, "\\$&");
