-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "joinLink" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "requireEmail" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customerEmail" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "promoCodeId" TEXT;

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "ogImage" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "shopDescription" TEXT NOT NULL DEFAULT 'Đăng ký dịch vụ với giá tốt nhất';

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "endDate" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountType" TEXT NOT NULL DEFAULT 'percent',
    "discountValue" DOUBLE PRECISION NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "maxUses" INTEGER NOT NULL DEFAULT 0,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");
