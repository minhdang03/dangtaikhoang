-- Add shareType to Account (account = email/password sharing, invite = link-based)
ALTER TABLE "Account" ADD COLUMN "shareType" TEXT NOT NULL DEFAULT 'account';
ALTER TABLE "Account" ALTER COLUMN "email" SET DEFAULT '';
ALTER TABLE "Account" ALTER COLUMN "password" SET DEFAULT '';
