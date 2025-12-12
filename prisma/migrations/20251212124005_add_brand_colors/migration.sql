-- AlterTable
ALTER TABLE "public"."CompanySettings" ADD COLUMN     "primaryColor" TEXT NOT NULL DEFAULT '#007AFF',
ADD COLUMN     "secondaryColor" TEXT NOT NULL DEFAULT '#5856D6';
