-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."EmpfehlungsCheck" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "empfehlungen" TEXT,
    "gesamtEinsparungMonatlich" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gesamtEinsparungJaehrlich" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "anzahlOptimierungen" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmpfehlungsCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EmpfehlungsCheck_clientId_idx" ON "public"."EmpfehlungsCheck"("clientId");

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'EmpfehlungsCheck_clientId_fkey'
    ) THEN
        ALTER TABLE "public"."EmpfehlungsCheck" 
        ADD CONSTRAINT "EmpfehlungsCheck_clientId_fkey" 
        FOREIGN KEY ("clientId") 
        REFERENCES "public"."Client"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
    END IF;
END $$;

