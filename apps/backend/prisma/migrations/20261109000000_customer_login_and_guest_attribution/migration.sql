-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "passwordHash" TEXT;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "guestName" TEXT;
