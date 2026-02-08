/*
  # Initial Schema - Finance Made Simple CRM
  
  Creates all database tables for the CRM system including:
  - User management (Admin/Advisor)
  - Client management with pipeline integration
  - Contract and template management
  - Lead and Opportunity pipelines
  - Calendly and Close CRM integrations
  - Retirement concepts and financial analysis tools
*/

-- User table
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email TEXT UNIQUE NOT NULL,
  "passwordHash" TEXT NOT NULL,
  role TEXT NOT NULL,
  name TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "resetToken" TEXT,
  "resetTokenExpires" TIMESTAMPTZ,
  "visibleCategories" TEXT,
  "closeUserId" TEXT UNIQUE
);

-- Client table
CREATE TABLE IF NOT EXISTS "Client" (
  id TEXT PRIMARY KEY,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  street TEXT,
  "houseNumber" TEXT,
  city TEXT,
  zip TEXT,
  iban TEXT,
  "crmId" TEXT,
  "isCompany" BOOLEAN NOT NULL DEFAULT false,
  "companyName" TEXT,
  "birthDate" TIMESTAMPTZ,
  profession TEXT,
  "employmentStatus" TEXT,
  "salaryGrade" TEXT,
  "grvInsuranceStatus" TEXT,
  "nextCallDate" TIMESTAMPTZ,
  "callNotes" TEXT,
  "targetPensionNetto" DOUBLE PRECISION,
  "desiredRetirementAge" INTEGER,
  "monthlySavings" DOUBLE PRECISION
);

-- ContractTemplate table
CREATE TABLE IF NOT EXISTS "ContractTemplate" (
  id TEXT PRIMARY KEY,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  fields TEXT NOT NULL,
  category TEXT DEFAULT 'Honorar Beratung'
);

-- Contract table
CREATE TABLE IF NOT EXISTS "Contract" (
  id TEXT PRIMARY KEY,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "clientId" TEXT NOT NULL,
  "templateSlug" TEXT NOT NULL,
  variables TEXT NOT NULL,
  "pdfFileName" TEXT,
  "signedPdfFileName" TEXT,
  "stripeCustomerId" TEXT,
  "stripeMandateId" TEXT,
  "stripeMandateStatus" TEXT,
  "sevdeskInvoiceId" TEXT,
  "sevdeskInvoiceNumber" TEXT,
  FOREIGN KEY ("clientId") REFERENCES "Client"(id)
);

-- Company table
CREATE TABLE IF NOT EXISTS "Company" (
  id TEXT PRIMARY KEY,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CompanySettings table
CREATE TABLE IF NOT EXISTS "CompanySettings" (
  id TEXT PRIMARY KEY,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "companyId" TEXT UNIQUE,
  "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
  "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
  currency TEXT NOT NULL DEFAULT 'EUR',
  timezone TEXT NOT NULL DEFAULT 'Europe/Berlin',
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
  "billingEmail" TEXT,
  "makeWebhookUrl" TEXT,
  "makeApiKey" TEXT,
  "closeApiKey" TEXT,
  "calendlyApiToken" TEXT,
  "logoUrl" TEXT,
  "companySlogan" TEXT,
  "primaryColor" TEXT NOT NULL DEFAULT '#007AFF',
  "secondaryColor" TEXT NOT NULL DEFAULT '#5856D6',
  "advisorIban" TEXT,
  "paymentSubject" TEXT,
  "creditorId" TEXT,
  "stripeSecretKey" TEXT,
  "stripePublishableKey" TEXT,
  "sevdeskApiToken" TEXT,
  "sevdeskApiUrl" TEXT,
  FOREIGN KEY ("companyId") REFERENCES "Company"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "CompanySettings_companyId_idx" ON "CompanySettings"("companyId");

-- PipelinePhase table
CREATE TABLE IF NOT EXISTS "PipelinePhase" (
  id TEXT PRIMARY KEY,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  color TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  type TEXT NOT NULL DEFAULT 'opportunity',
  description TEXT,
  probability INTEGER,
  status TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isConverted" BOOLEAN NOT NULL DEFAULT false
);

-- Lead table
CREATE TABLE IF NOT EXISTS "Lead" (
  id TEXT PRIMARY KEY,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "firstName" TEXT,
  "lastName" TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  "phaseId" TEXT,
  "clientId" TEXT,
  source TEXT,
  notes TEXT,
  "nextActionDate" TIMESTAMPTZ,
  "nextActionNote" TEXT,
  "automationData" TEXT,
  FOREIGN KEY ("phaseId") REFERENCES "PipelinePhase"(id),
  FOREIGN KEY ("clientId") REFERENCES "Client"(id)
);

-- Opportunity table
CREATE TABLE IF NOT EXISTS "Opportunity" (
  id TEXT PRIMARY KEY,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  title TEXT NOT NULL,
  description TEXT,
  "phaseId" TEXT NOT NULL,
  "clientId" TEXT,
  "firstName" TEXT,
  "lastName" TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  "estimatedValue" DOUBLE PRECISION,
  probability INTEGER,
  "nextActionDate" TIMESTAMPTZ,
  "nextActionNote" TEXT,
  "automationData" TEXT,
  "airCallContactId" TEXT,
  FOREIGN KEY ("phaseId") REFERENCES "PipelinePhase"(id),
  FOREIGN KEY ("clientId") REFERENCES "Client"(id)
);

-- Call table
CREATE TABLE IF NOT EXISTS calls (
  id TEXT PRIMARY KEY,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "closeCallId" TEXT UNIQUE NOT NULL,
  "syncedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "callDate" TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL DEFAULT 0,
  direction TEXT DEFAULT 'outbound',
  status TEXT,
  disposition TEXT,
  note TEXT,
  "userId" TEXT,
  "leadId" TEXT,
  FOREIGN KEY ("userId") REFERENCES "User"(id),
  FOREIGN KEY ("leadId") REFERENCES "Lead"(id)
);

CREATE INDEX IF NOT EXISTS "calls_closeCallId_idx" ON calls("closeCallId");
CREATE INDEX IF NOT EXISTS "calls_callDate_idx" ON calls("callDate");
CREATE INDEX IF NOT EXISTS "calls_userId_idx" ON calls("userId");
CREATE INDEX IF NOT EXISTS "calls_leadId_idx" ON calls("leadId");

-- CalendlyEvent table
CREATE TABLE IF NOT EXISTS calendly_events (
  id TEXT PRIMARY KEY,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "calendlyEventUri" TEXT UNIQUE NOT NULL,
  "eventTypeName" TEXT,
  "mappedType" TEXT,
  "startTime" TIMESTAMPTZ NOT NULL,
  "endTime" TIMESTAMPTZ NOT NULL,
  status TEXT,
  "hostName" TEXT,
  "hostEmail" TEXT,
  "userId" TEXT,
  "inviteeName" TEXT,
  "inviteeEmail" TEXT,
  "leadId" TEXT,
  "syncedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "calendly_events_inviteeEmail_idx" ON calendly_events("inviteeEmail");
CREATE INDEX IF NOT EXISTS "calendly_events_startTime_idx" ON calendly_events("startTime");
CREATE INDEX IF NOT EXISTS "calendly_events_leadId_idx" ON calendly_events("leadId");

-- CustomActivity table
CREATE TABLE IF NOT EXISTS custom_activities (
  id TEXT PRIMARY KEY,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "closeActivityId" TEXT UNIQUE NOT NULL,
  "activityType" TEXT NOT NULL,
  "activityTypeId" TEXT,
  "leadId" TEXT,
  "leadEmail" TEXT,
  "leadName" TEXT,
  "userId" TEXT,
  "userEmail" TEXT,
  "userName" TEXT,
  "resultFieldId" TEXT,
  "resultValue" TEXT,
  "dateCreated" TIMESTAMPTZ NOT NULL,
  "dateUpdated" TIMESTAMPTZ,
  "calendlyEventId" TEXT,
  "matchedAt" TIMESTAMPTZ,
  "matchConfidence" DOUBLE PRECISION,
  "syncedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("calendlyEventId") REFERENCES calendly_events(id)
);

CREATE INDEX IF NOT EXISTS "custom_activities_closeActivityId_idx" ON custom_activities("closeActivityId");
CREATE INDEX IF NOT EXISTS "custom_activities_leadEmail_idx" ON custom_activities("leadEmail");
CREATE INDEX IF NOT EXISTS "custom_activities_activityType_idx" ON custom_activities("activityType");
CREATE INDEX IF NOT EXISTS "custom_activities_dateCreated_idx" ON custom_activities("dateCreated");
CREATE INDEX IF NOT EXISTS "custom_activities_calendlyEventId_idx" ON custom_activities("calendlyEventId");

-- RetirementConcept table
CREATE TABLE IF NOT EXISTS "RetirementConcept" (
  id TEXT PRIMARY KEY,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "clientId" TEXT NOT NULL,
  "birthDate" TIMESTAMPTZ,
  "desiredRetirementAge" INTEGER,
  "targetPensionNetto" DOUBLE PRECISION,
  "hasCurrentPensionInfo" BOOLEAN,
  "pensionAtRetirement" DOUBLE PRECISION,
  "pensionIncrease" DOUBLE PRECISION,
  "inflationRate" DOUBLE PRECISION,
  "calculatedPensionAtRetirement" DOUBLE PRECISION,
  "existingProvisionData" TEXT,
  "totalExistingProvision" DOUBLE PRECISION,
  "totalPensionWithProvision" DOUBLE PRECISION,
  "calculatedTargetPension" DOUBLE PRECISION,
  "lifeExpectancy" INTEGER,
  "monthlySavings" DOUBLE PRECISION,
  "returnRate" DOUBLE PRECISION,
  "withdrawalRate" DOUBLE PRECISION,
  "hasChildren" BOOLEAN DEFAULT true,
  "isCompulsoryInsured" BOOLEAN DEFAULT true,
  "kvBaseRate" DOUBLE PRECISION DEFAULT 7.3,
  "kvAdditionalRate" DOUBLE PRECISION DEFAULT 2.5,
  "kvContributionIncrease" DOUBLE PRECISION DEFAULT 0,
  "taxFilingStatus" TEXT DEFAULT 'single',
  "taxFreeAmount" DOUBLE PRECISION DEFAULT 12096,
  "taxIncreaseRate" DOUBLE PRECISION DEFAULT 0,
  "taxFreePercentage" DOUBLE PRECISION DEFAULT 83.5,
  "capitalGainsTaxRate" DOUBLE PRECISION DEFAULT 25,
  "capitalGainsSoliRate" DOUBLE PRECISION DEFAULT 5.5,
  "capitalGainsChurchRate" DOUBLE PRECISION DEFAULT 0,
  "capitalGainsAllowance" DOUBLE PRECISION DEFAULT 1000,
  "calculationSnapshot" TEXT,
  "statutoryStrengths" TEXT,
  "statutoryWeaknesses" TEXT,
  "privateStrengths" TEXT,
  "privateWeaknesses" TEXT,
  "customTemplateHtml" TEXT,
  "recommendationDelta" DOUBLE PRECISION,
  notes TEXT,
  "recommendationProvider" TEXT,
  "recommendationAdvantages" TEXT,
  "expectedRente" DOUBLE PRECISION,
  "productBefore" TEXT,
  "additionalRenteBefore" DOUBLE PRECISION,
  "providerAfter" TEXT,
  advantages TEXT,
  "renteAfter1" DOUBLE PRECISION,
  "renteAfter2" DOUBLE PRECISION,
  "renteAfter3" DOUBLE PRECISION,
  "returnRate1" DOUBLE PRECISION,
  "returnRate2" DOUBLE PRECISION,
  "returnRate3" DOUBLE PRECISION,
  "monthlyContributionBefore" DOUBLE PRECISION,
  "monthlyContributionAfter" DOUBLE PRECISION,
  FOREIGN KEY ("clientId") REFERENCES "Client"(id)
);

-- RetirementConceptAttachment table
CREATE TABLE IF NOT EXISTS "RetirementConceptAttachment" (
  id TEXT PRIMARY KEY,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "conceptId" TEXT NOT NULL,
  category TEXT NOT NULL,
  "filePath" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  size INTEGER NOT NULL,
  FOREIGN KEY ("conceptId") REFERENCES "RetirementConcept"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "RetirementConceptAttachment_conceptId_category_idx" ON "RetirementConceptAttachment"("conceptId", category);

-- ServiceContact table
CREATE TABLE IF NOT EXISTS "ServiceContact" (
  id TEXT PRIMARY KEY,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT,
  address TEXT,
  category TEXT,
  phone TEXT,
  notes TEXT
);

-- EinnahmenAusgaben table
CREATE TABLE IF NOT EXISTS "EinnahmenAusgaben" (
  id TEXT PRIMARY KEY,
  "clientId" TEXT NOT NULL,
  beruf TEXT,
  "nettoEinkommen" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "persoenlicheDaten" TEXT,
  fixkosten TEXT,
  "variableKosten" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("clientId") REFERENCES "Client"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "EinnahmenAusgaben_clientId_idx" ON "EinnahmenAusgaben"("clientId");

-- VersicherungsCheck table
CREATE TABLE IF NOT EXISTS "VersicherungsCheck" (
  id TEXT PRIMARY KEY,
  "clientId" TEXT NOT NULL,
  versicherungen TEXT,
  "gesamtBeitragVorher" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "gesamtBeitragNachher" DOUBLE PRECISION NOT NULL DEFAULT 0,
  einsparung DOUBLE PRECISION NOT NULL DEFAULT 0,
  "risikoStatusVorher" TEXT,
  "risikoStatusNachher" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("clientId") REFERENCES "Client"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "VersicherungsCheck_clientId_idx" ON "VersicherungsCheck"("clientId");

-- EmpfehlungsCheck table
CREATE TABLE IF NOT EXISTS "EmpfehlungsCheck" (
  id TEXT PRIMARY KEY,
  "clientId" TEXT NOT NULL,
  empfehlungen TEXT,
  "gesamtEinsparungMonatlich" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "gesamtEinsparungJaehrlich" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "anzahlOptimierungen" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("clientId") REFERENCES "Client"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "EmpfehlungsCheck_clientId_idx" ON "EmpfehlungsCheck"("clientId");