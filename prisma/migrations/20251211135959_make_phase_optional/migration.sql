-- DropForeignKey
ALTER TABLE "public"."Lead" DROP CONSTRAINT "Lead_phaseId_fkey";

-- AlterTable
ALTER TABLE "public"."Lead" ALTER COLUMN "phaseId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Lead" ADD CONSTRAINT "Lead_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "public"."PipelinePhase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
