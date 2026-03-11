-- Rename monthlyFee → price1m, yearlyFee → price12m
ALTER TABLE "Account" RENAME COLUMN "monthlyFee" TO "price1m";
ALTER TABLE "Account" RENAME COLUMN "yearlyFee" TO "price12m";

-- Add new price columns
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "price3m" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "price6m" DOUBLE PRECISION NOT NULL DEFAULT 0;
