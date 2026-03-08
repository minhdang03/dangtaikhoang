-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "duration" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "duration" INTEGER NOT NULL DEFAULT 1;
