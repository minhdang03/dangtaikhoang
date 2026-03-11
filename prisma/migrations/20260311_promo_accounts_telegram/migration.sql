-- Add applicable account IDs to PromoCode
ALTER TABLE "PromoCode" ADD COLUMN "applicableAccountIds" TEXT[] DEFAULT '{}';

-- Add Telegram fields to Settings
ALTER TABLE "Settings" ADD COLUMN "telegramBotToken" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Settings" ADD COLUMN "telegramChatId" TEXT NOT NULL DEFAULT '';
