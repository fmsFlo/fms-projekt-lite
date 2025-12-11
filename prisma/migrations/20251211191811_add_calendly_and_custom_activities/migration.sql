-- AlterTable
ALTER TABLE "public"."CompanySettings" ADD COLUMN     "calendlyApiToken" TEXT;

-- CreateTable
CREATE TABLE "public"."CalendlyEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "calendlyEventUri" TEXT NOT NULL,
    "eventTypeName" TEXT,
    "mappedType" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" TEXT,
    "hostName" TEXT,
    "hostEmail" TEXT,
    "userId" TEXT,
    "inviteeName" TEXT,
    "inviteeEmail" TEXT,
    "leadId" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalendlyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomActivity" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closeActivityId" TEXT NOT NULL,
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
    "dateCreated" TIMESTAMP(3) NOT NULL,
    "dateUpdated" TIMESTAMP(3),
    "calendlyEventId" TEXT,
    "matchedAt" TIMESTAMP(3),
    "matchConfidence" DOUBLE PRECISION,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CalendlyEvent_calendlyEventUri_key" ON "public"."CalendlyEvent"("calendlyEventUri");

-- CreateIndex
CREATE INDEX "CalendlyEvent_inviteeEmail_idx" ON "public"."CalendlyEvent"("inviteeEmail");

-- CreateIndex
CREATE INDEX "CalendlyEvent_startTime_idx" ON "public"."CalendlyEvent"("startTime");

-- CreateIndex
CREATE INDEX "CalendlyEvent_leadId_idx" ON "public"."CalendlyEvent"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomActivity_closeActivityId_key" ON "public"."CustomActivity"("closeActivityId");

-- CreateIndex
CREATE INDEX "CustomActivity_closeActivityId_idx" ON "public"."CustomActivity"("closeActivityId");

-- CreateIndex
CREATE INDEX "CustomActivity_leadEmail_idx" ON "public"."CustomActivity"("leadEmail");

-- CreateIndex
CREATE INDEX "CustomActivity_activityType_idx" ON "public"."CustomActivity"("activityType");

-- CreateIndex
CREATE INDEX "CustomActivity_dateCreated_idx" ON "public"."CustomActivity"("dateCreated");

-- CreateIndex
CREATE INDEX "CustomActivity_calendlyEventId_idx" ON "public"."CustomActivity"("calendlyEventId");

-- AddForeignKey
ALTER TABLE "public"."CustomActivity" ADD CONSTRAINT "CustomActivity_calendlyEventId_fkey" FOREIGN KEY ("calendlyEventId") REFERENCES "public"."CalendlyEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
