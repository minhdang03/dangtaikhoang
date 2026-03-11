-- Add slug field for friendly URLs
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "slug" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Account_slug_key" ON "Account"("slug");
