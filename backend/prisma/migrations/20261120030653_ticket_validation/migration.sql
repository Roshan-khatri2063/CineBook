-- AlterEnum
ALTER TYPE "TicketStatus" ADD VALUE 'USED';

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "usedAt" TIMESTAMP(3);

-- A ticket is USED exactly when it has a usedAt time.
ALTER TABLE "tickets"
  ADD CONSTRAINT "tickets_used_has_date" CHECK (("status"::text = 'USED') = ("usedAt" IS NOT NULL));