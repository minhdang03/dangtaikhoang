-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "lookupPin" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lookupPin" TEXT NOT NULL DEFAULT '';
