-- Performance Indexes for Dashboard Queries
-- Fügt Indizes für häufige Dashboard-Abfragen hinzu

-- Custom Activities Performance Indexes
CREATE INDEX IF NOT EXISTS idx_custom_activities_composite 
ON custom_activities (activity_type, date_created DESC, user_id);

CREATE INDEX IF NOT EXISTS idx_custom_activities_lead_type 
ON custom_activities (lead_id, activity_type, date_created DESC);

CREATE INDEX IF NOT EXISTS idx_custom_activities_date_range 
ON custom_activities (date_created DESC) 
WHERE date_created >= NOW() - INTERVAL '90 days';

-- Calendly Events Performance Indexes
CREATE INDEX IF NOT EXISTS idx_calendly_events_composite 
ON calendly_events (start_time DESC, user_id);

CREATE INDEX IF NOT EXISTS idx_calendly_events_date_range 
ON calendly_events (start_time DESC) 
WHERE start_time >= NOW() - INTERVAL '90 days';

-- Clients Performance Indexes
CREATE INDEX IF NOT EXISTS idx_clients_search 
ON clients (last_name, first_name, email, company_name);

CREATE INDEX IF NOT EXISTS idx_clients_pipeline 
ON clients (next_call_date DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_clients_updated 
ON clients (updated_at DESC);

-- Contracts Performance Indexes
CREATE INDEX IF NOT EXISTS idx_contracts_client_created 
ON contracts (client_id, created_at DESC);

-- Opportunities Performance Indexes
CREATE INDEX IF NOT EXISTS idx_opportunities_pipeline 
ON opportunities (phase_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_opportunities_client 
ON opportunities (client_id, created_at DESC);

-- Leads Performance Indexes
CREATE INDEX IF NOT EXISTS idx_leads_pipeline 
ON leads (phase_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leads_client 
ON leads (client_id, created_at DESC);

-- Retirement Concepts Performance Indexes
CREATE INDEX IF NOT EXISTS idx_retirement_concepts_client_created 
ON retirement_concepts (client_id, created_at DESC);

-- EinnahmenAusgaben Performance Indexes
CREATE INDEX IF NOT EXISTS idx_einnahmen_ausgaben_client_created 
ON einnahmen_ausgaben (client_id, created_at DESC);
