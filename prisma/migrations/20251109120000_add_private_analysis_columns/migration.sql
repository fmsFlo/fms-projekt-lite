-- Ergänzt optionale Felder für Analyse & Empfehlung in Schritt 4
PRAGMA foreign_keys=OFF;

-- Falls die Tabelle noch nicht existiert (z. B. frische DB), wird sie mit dem aktuellen Schema erstellt.
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
    "notes" TEXT,
    "statutoryStrengths" TEXT,
    "statutoryWeaknesses" TEXT,
    "privateStrengths" TEXT,
    "privateWeaknesses" TEXT,
    "recommendationDelta" REAL,
    CONSTRAINT "RetirementConcept_clientId_fkey"
      FOREIGN KEY ("clientId") REFERENCES "Client" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

-- Neue Felder hinzufügen, falls sie noch nicht vorhanden sind.
ALTER TABLE "RetirementConcept"
  ADD COLUMN IF NOT EXISTS "privateStrengths" TEXT;

ALTER TABLE "RetirementConcept"
  ADD COLUMN IF NOT EXISTS "privateWeaknesses" TEXT;

ALTER TABLE "RetirementConcept"
  ADD COLUMN IF NOT EXISTS "recommendationDelta" REAL;

ALTER TABLE "RetirementConcept"
  ADD COLUMN IF NOT EXISTS "customTemplateHtml" TEXT;

PRAGMA foreign_keys=ON;

