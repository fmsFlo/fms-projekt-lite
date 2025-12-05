PRAGMA foreign_keys=OFF;

CREATE TABLE IF NOT EXISTS "RetirementConcept" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "clientId" TEXT NOT NULL,
    "birthDate" DATETIME,
    "desiredRetirementAge" INTEGER,
    "targetPensionNetto" REAL,
    "hasCurrentPensionInfo" BOOLEAN,
    "pensionAtRetirement" REAL,
    "pensionIncrease" REAL,
    "inflationRate" REAL,
    "calculatedPensionAtRetirement" REAL,
    "existingProvisionData" TEXT,
    "totalExistingProvision" REAL,
    "totalPensionWithProvision" REAL,
    "calculatedTargetPension" REAL,
    "lifeExpectancy" INTEGER,
    "monthlySavings" REAL,
    "returnRate" REAL,
    "withdrawalRate" REAL,
    "hasChildren" BOOLEAN DEFAULT true,
    "isCompulsoryInsured" BOOLEAN DEFAULT true,
    "kvBaseRate" REAL DEFAULT 7.3,
    "kvAdditionalRate" REAL DEFAULT 2.5,
    "kvContributionIncrease" REAL DEFAULT 0,
    "taxFilingStatus" TEXT DEFAULT 'single',
    "taxFreeAmount" REAL DEFAULT 12096,
    "taxIncreaseRate" REAL DEFAULT 0,
    "taxFreePercentage" REAL DEFAULT 83.5,
    "capitalGainsTaxRate" REAL DEFAULT 25,
    "capitalGainsSoliRate" REAL DEFAULT 5.5,
    "capitalGainsChurchRate" REAL DEFAULT 0,
    "capitalGainsAllowance" REAL DEFAULT 1000,
    "calculationSnapshot" TEXT,
    "notes" TEXT,
    "statutoryStrengths" TEXT,
    "statutoryWeaknesses" TEXT,
    "privateStrengths" TEXT,
    "privateWeaknesses" TEXT,
    "customTemplateHtml" TEXT,
    "recommendationDelta" REAL,
    CONSTRAINT "RetirementConcept_clientId_fkey"
      FOREIGN KEY ("clientId") REFERENCES "Client" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE "RetirementConcept"
ADD COLUMN "calculationSnapshot" TEXT;

PRAGMA foreign_keys=ON;

