-- Migration: Add product comparison fields to RetirementConcept
-- Run this manually: psql -d your_database -f prisma/migrations/add_product_comparison_fields.sql

ALTER TABLE "public"."RetirementConcept" 
ADD COLUMN IF NOT EXISTS "productBefore" TEXT,
ADD COLUMN IF NOT EXISTS "additionalRenteBefore" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "providerAfter" TEXT,
ADD COLUMN IF NOT EXISTS "advantages" TEXT,
ADD COLUMN IF NOT EXISTS "renteAfter1" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "renteAfter2" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "renteAfter3" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "returnRate1" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "returnRate2" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "returnRate3" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "monthlyContributionBefore" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "monthlyContributionAfter" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "recommendationProvider" TEXT,
ADD COLUMN IF NOT EXISTS "recommendationAdvantages" TEXT,
ADD COLUMN IF NOT EXISTS "expectedRente" DOUBLE PRECISION;




