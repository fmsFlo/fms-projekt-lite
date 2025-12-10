-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- AlterTable
ALTER TABLE "CompanySettings" ADD COLUMN "companyId" TEXT;
ALTER TABLE "CompanySettings" ADD COLUMN "emailNotifications" BOOLEAN DEFAULT true;
ALTER TABLE "CompanySettings" ADD COLUMN "smsNotifications" BOOLEAN DEFAULT false;
ALTER TABLE "CompanySettings" ADD COLUMN "currency" TEXT DEFAULT 'EUR';
ALTER TABLE "CompanySettings" ADD COLUMN "timezone" TEXT DEFAULT 'Europe/Berlin';

-- CreateIndex
CREATE UNIQUE INDEX "CompanySettings_companyId_key" ON "CompanySettings"("companyId");

-- CreateIndex
CREATE INDEX "CompanySettings_companyId_idx" ON "CompanySettings"("companyId");

-- AddForeignKey
-- Note: SQLite doesn't support adding foreign keys to existing tables easily
-- This will need to be handled manually or through a table recreation
-- For now, we'll add the constraint if possible
PRAGMA foreign_keys=OFF;

-- Since SQLite has limitations with ALTER TABLE for foreign keys,
-- we'll note that the relation should be added manually if needed
-- or the table should be recreated with the foreign key constraint

PRAGMA foreign_keys=ON;

