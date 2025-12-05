-- Manuelles SQL zur Erstellung der CompanySettings-Tabelle
CREATE TABLE IF NOT EXISTS "CompanySettings" (
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

-- Contract-Tabelle bereinigen (Signature-Felder entfernen)
CREATE TABLE IF NOT EXISTS "new_Contract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "clientId" TEXT NOT NULL,
    "templateSlug" TEXT NOT NULL,
    "variables" TEXT NOT NULL,
    "pdfFileName" TEXT,
    CONSTRAINT "Contract_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Daten kopieren (nur wenn alte Contract-Tabelle existiert)
INSERT OR IGNORE INTO "new_Contract" ("id", "createdAt", "updatedAt", "clientId", "templateSlug", "variables", "pdfFileName") 
SELECT "id", "createdAt", "updatedAt", "clientId", "templateSlug", "variables", "pdfFileName" FROM "Contract";

-- Alte Tabelle löschen und umbenennen
DROP TABLE IF EXISTS "Contract";
ALTER TABLE "new_Contract" RENAME TO "Contract";

