-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customerConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentProof" TEXT;

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "shopTitle" TEXT NOT NULL DEFAULT 'Dịch vụ chia sẻ';
