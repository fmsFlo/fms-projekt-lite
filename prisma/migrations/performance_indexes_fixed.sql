-- Performance Indexes for Dashboard Queries
-- Fügt Indizes für häufige Dashboard-Abfragen hinzu

-- Custom Activities Performance Indexes
CREATE INDEX IF NOT EXISTS idx_custom_activities_composite 
ON "CustomActivity" ("activityType", "dateCreated" DESC, "userId");

CREATE INDEX IF NOT EXISTS idx_custom_activities_lead_type 
ON "CustomActivity" ("leadId", "activityType", "dateCreated" DESC);

CREATE INDEX IF NOT EXISTS idx_custom_activities_date_range 
ON "CustomActivity" ("dateCreated" DESC) 
WHERE "dateCreated" >= NOW() - INTERVAL '90 days';

-- Calendly Events Performance Indexes
CREATE INDEX IF NOT EXISTS idx_calendly_events_composite 
ON "CalendlyEvent" ("startTime" DESC, "userId");

CREATE INDEX IF NOT EXISTS idx_calendly_events_date_range 
ON "CalendlyEvent" ("startTime" DESC) 
WHERE "startTime" >= NOW() - INTERVAL '90 days';

-- Clients Performance Indexes
CREATE INDEX IF NOT EXISTS idx_clients_search 
ON "Client" ("lastName", "firstName", "email", "companyName");

CREATE INDEX IF NOT EXISTS idx_clients_pipeline 
ON "Client" ("nextCallDate" DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_clients_updated 
ON "Client" ("updatedAt" DESC);

-- Contracts Performance Indexes
CREATE INDEX IF NOT EXISTS idx_contracts_client_created 
ON "Contract" ("clientId", "createdAt" DESC);

-- Opportunities Performance Indexes
CREATE INDEX IF NOT EXISTS idx_opportunities_pipeline 
ON "Opportunity" ("phaseId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_opportunities_client 
ON "Opportunity" ("clientId", "createdAt" DESC);

-- Leads Performance Indexes
CREATE INDEX IF NOT EXISTS idx_leads_pipeline 
ON "Lead" ("phaseId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_leads_client 
ON "Lead" ("clientId", "createdAt" DESC);

-- Retirement Concepts Performance Indexes
CREATE INDEX IF NOT EXISTS idx_retirement_concepts_client_created 
ON "RetirementConcept" ("clientId", "createdAt" DESC);

-- EinnahmenAusgaben Performance Indexes
CREATE INDEX IF NOT EXISTS idx_einnahmen_ausgaben_client_created 
ON "EinnahmenAusgaben" ("clientId", "createdAt" DESC);
