-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."Client" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "street" TEXT,
    "houseNumber" TEXT,
    "city" TEXT,
    "zip" TEXT,
    "iban" TEXT,
    "crmId" TEXT,
    "isCompany" BOOLEAN NOT NULL DEFAULT false,
    "companyName" TEXT,
    "birthDate" TIMESTAMP(3),
    "profession" TEXT,
    "employmentStatus" TEXT,
    "salaryGrade" TEXT,
    "grvInsuranceStatus" TEXT,
    "nextCallDate" TIMESTAMP(3),
    "callNotes" TEXT,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContractTemplate" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "fields" TEXT NOT NULL,
    "category" TEXT DEFAULT 'Honorar Beratung',

    CONSTRAINT "ContractTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Contract" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,
    "templateSlug" TEXT NOT NULL,
    "variables" TEXT NOT NULL,
    "pdfFileName" TEXT,
    "signedPdfFileName" TEXT,
    "stripeCustomerId" TEXT,
    "stripeMandateId" TEXT,
    "stripeMandateStatus" TEXT,
    "sevdeskInvoiceId" TEXT,
    "sevdeskInvoiceNumber" TEXT,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Company" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CompanySettings" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Berlin',
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
    "logoUrl" TEXT,
    "companySlogan" TEXT,
    "advisorIban" TEXT,
    "paymentSubject" TEXT,
    "creditorId" TEXT,
    "stripeSecretKey" TEXT,
    "stripePublishableKey" TEXT,
    "sevdeskApiToken" TEXT,
    "sevdeskApiUrl" TEXT,

    CONSTRAINT "CompanySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PipelinePhase" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "type" TEXT NOT NULL DEFAULT 'opportunity',
    "description" TEXT,
    "probability" INTEGER,
    "status" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isConverted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PipelinePhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Lead" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "phaseId" TEXT NOT NULL,
    "clientId" TEXT,
    "source" TEXT,
    "notes" TEXT,
    "nextActionDate" TIMESTAMP(3),
    "nextActionNote" TEXT,
    "automationData" TEXT,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Opportunity" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "phaseId" TEXT NOT NULL,
    "clientId" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "estimatedValue" DOUBLE PRECISION,
    "probability" INTEGER,
    "nextActionDate" TIMESTAMP(3),
    "nextActionNote" TEXT,
    "automationData" TEXT,
    "airCallContactId" TEXT,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RetirementConcept" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
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
    "notes" TEXT,

    CONSTRAINT "RetirementConcept_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RetirementConceptAttachment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "conceptId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,

    CONSTRAINT "RetirementConceptAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ServiceContact" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "category" TEXT,
    "phone" TEXT,
    "notes" TEXT,

    CONSTRAINT "ServiceContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "resetToken" TEXT,
    "resetTokenExpires" TIMESTAMP(3),
    "visibleCategories" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContractTemplate_slug_key" ON "public"."ContractTemplate"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CompanySettings_companyId_key" ON "public"."CompanySettings"("companyId");

-- CreateIndex
CREATE INDEX "CompanySettings_companyId_idx" ON "public"."CompanySettings"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "PipelinePhase_slug_key" ON "public"."PipelinePhase"("slug");

-- CreateIndex
CREATE INDEX "RetirementConceptAttachment_conceptId_category_idx" ON "public"."RetirementConceptAttachment"("conceptId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- AddForeignKey
ALTER TABLE "public"."Contract" ADD CONSTRAINT "Contract_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CompanySettings" ADD CONSTRAINT "CompanySettings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lead" ADD CONSTRAINT "Lead_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "public"."PipelinePhase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lead" ADD CONSTRAINT "Lead_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Opportunity" ADD CONSTRAINT "Opportunity_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "public"."PipelinePhase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Opportunity" ADD CONSTRAINT "Opportunity_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RetirementConcept" ADD CONSTRAINT "RetirementConcept_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RetirementConceptAttachment" ADD CONSTRAINT "RetirementConceptAttachment_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "public"."RetirementConcept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

