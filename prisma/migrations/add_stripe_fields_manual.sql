-- Add Stripe fields to Contract table
ALTER TABLE "Contract" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "Contract" ADD COLUMN "stripeMandateId" TEXT;
ALTER TABLE "Contract" ADD COLUMN "stripeMandateStatus" TEXT;

-- Add Stripe and Creditor ID fields to CompanySettings table
ALTER TABLE "CompanySettings" ADD COLUMN "creditorId" TEXT;
ALTER TABLE "CompanySettings" ADD COLUMN "stripeSecretKey" TEXT;
ALTER TABLE "CompanySettings" ADD COLUMN "stripePublishableKey" TEXT;

