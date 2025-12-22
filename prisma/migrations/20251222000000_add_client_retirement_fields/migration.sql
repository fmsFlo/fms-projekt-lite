-- Add missing retirement fields to Client table if they don't exist
DO $$ 
BEGIN
    -- Add targetPensionNetto if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'Client' 
        AND column_name = 'targetPensionNetto'
    ) THEN
        ALTER TABLE "Client" ADD COLUMN "targetPensionNetto" DOUBLE PRECISION;
    END IF;

    -- Add desiredRetirementAge if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'Client' 
        AND column_name = 'desiredRetirementAge'
    ) THEN
        ALTER TABLE "Client" ADD COLUMN "desiredRetirementAge" INTEGER;
    END IF;

    -- Add monthlySavings if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'Client' 
        AND column_name = 'monthlySavings'
    ) THEN
        ALTER TABLE "Client" ADD COLUMN "monthlySavings" DOUBLE PRECISION;
    END IF;
END $$;

