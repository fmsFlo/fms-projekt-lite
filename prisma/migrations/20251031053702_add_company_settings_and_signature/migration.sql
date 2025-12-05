-- AlterTable
ALTER TABLE "Contract" ADD COLUMN "signatureMethod" TEXT;
ALTER TABLE "Contract" ADD COLUMN "signatureStatus" TEXT DEFAULT 'pending';
ALTER TABLE "Contract" ADD COLUMN "signedAt" DATETIME;

-- CreateTable
CREATE TABLE "CompanySettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "personalName" TEXT,
    "personalEmail" TEXT,
    "personalStreet" TEXT,
    "personalHouseNumber" TEXT,
    "personalZip" TEXT,
    "personalCity" TEXT,
    "personalPhone" TEXT,
    "personalWebsite" TEXT,
    "companyName" TEXT,
    "contactPerson" TEXT,
    "companyEmail" TEXT,
    "companyStreet" TEXT,
    "companyHouseNumber" TEXT,
    "companyZip" TEXT,
    "companyCity" TEXT,
    "companyPhone" TEXT,
    "companyWebsite" TEXT,
    "billingStreet" TEXT,
    "billingHouseNumber" TEXT,
    "billingZip" TEXT,
    "billingCity" TEXT,
    "billingEmail" TEXT
);
