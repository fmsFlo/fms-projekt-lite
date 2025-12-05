-- ============================================
-- FMS Dashboard - Vollständiges Datenbank-Schema
-- ============================================
-- 
-- HINWEIS: Dieses Schema wird automatisch von db.js geladen.
-- Für manuelle Initialisierung: node scripts/setup-database.js
-- ============================================

-- Users Tabelle für Close Berater
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    close_user_id TEXT UNIQUE NOT NULL,
    name TEXT,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Leads Tabelle für Grunddaten
CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    close_lead_id TEXT UNIQUE NOT NULL,
    name TEXT,
    email TEXT,
    phone TEXT,
    status TEXT,
    first_contact_date DATETIME,
    assigned_user_id INTEGER,
    erstgespraech_am DATETIME,
    erstgespraech_ergebnis TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_user_id) REFERENCES users(id)
);

-- Calls Tabelle für Call Activities
CREATE TABLE IF NOT EXISTS calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    close_call_id TEXT UNIQUE NOT NULL,
    lead_id INTEGER,
    user_id INTEGER,
    call_date DATETIME NOT NULL,
    duration INTEGER DEFAULT 0,
    direction TEXT,
    status TEXT,
    disposition TEXT,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Custom Activities Tabelle (Vorqualifizierung, Termine, etc.)
CREATE TABLE IF NOT EXISTS custom_activities (
    id TEXT PRIMARY KEY,
    close_activity_id TEXT UNIQUE NOT NULL,
    activity_type TEXT NOT NULL,
    activity_type_id TEXT NOT NULL,
    
    -- Lead & User Info
    lead_id TEXT NOT NULL,
    lead_email TEXT,
    lead_name TEXT,
    user_id TEXT NOT NULL,
    user_email TEXT,
    user_name TEXT,
    
    -- Ergebnis
    result_field_id TEXT,
    result_value TEXT,
    
    -- Termine-Matching
    calendly_event_id TEXT,
    matched_at TIMESTAMP,
    match_confidence REAL,
    
    -- Zeitstempel
    date_created TIMESTAMP NOT NULL,
    date_updated TIMESTAMP,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (calendly_event_id) REFERENCES calendly_events(id)
);

-- Matching-Log für Debugging
CREATE TABLE IF NOT EXISTS activity_matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    custom_activity_id TEXT NOT NULL,
    calendly_event_id TEXT NOT NULL,
    match_score REAL,
    match_reason TEXT,
    matched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (custom_activity_id) REFERENCES custom_activities(id),
    FOREIGN KEY (calendly_event_id) REFERENCES calendly_events(id)
);

-- Opportunities Tabelle
CREATE TABLE IF NOT EXISTS opportunities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    close_opportunity_id TEXT UNIQUE NOT NULL,
    lead_id INTEGER NOT NULL,
    name TEXT,
    value NUMERIC,
    status TEXT,
    stage TEXT,
    stage_id TEXT,
    date_created DATETIME,
    date_won DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id)
);

-- Appointments Tabelle
CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    lead_id INTEGER NOT NULL,
    user_id INTEGER,
    appointment_type TEXT NOT NULL,
    original_date DATE NOT NULL,
    original_booked_at DATETIME NOT NULL,
    current_date DATE,
    status TEXT NOT NULL,
    result TEXT,
    result_details TEXT,
    reschedule_count INTEGER DEFAULT 0,
    result_activity_id TEXT,
    compliance_filled INTEGER DEFAULT 0,
    last_modified DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Appointment History Tabelle (für Verschiebungen)
CREATE TABLE IF NOT EXISTS appointment_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id TEXT NOT NULL,
    action TEXT NOT NULL,
    old_date DATE,
    new_date DATE,
    reason TEXT,
    changed_by TEXT,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

-- Sync Log Tabelle
CREATE TABLE IF NOT EXISTS sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sync_type TEXT NOT NULL,
    last_sync DATETIME NOT NULL,
    records_synced INTEGER DEFAULT 0,
    status TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Calendly Events Tabelle
CREATE TABLE IF NOT EXISTS calendly_events (
    id TEXT PRIMARY KEY,
    calendly_event_id TEXT UNIQUE NOT NULL,
    event_name TEXT,
    event_type TEXT,
    mapped_appointment_type TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration_minutes INTEGER,
    status TEXT,
    location_type TEXT,
    host_name TEXT,
    host_email TEXT,
    host_calendly_uri TEXT,
    user_id INTEGER,
    invitee_name TEXT,
    invitee_email TEXT,
    invitee_phone TEXT,
    invitee_status TEXT,
    lead_id INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    synced_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (lead_id) REFERENCES leads(id)
);

-- ============================================
-- Indizes für bessere Performance
-- ============================================

-- Users Indizes
CREATE INDEX IF NOT EXISTS idx_users_close_user_id ON users(close_user_id);

-- Leads Indizes
CREATE INDEX IF NOT EXISTS idx_leads_close_lead_id ON leads(close_lead_id);

-- Calls Indizes
CREATE INDEX IF NOT EXISTS idx_calls_close_call_id ON calls(close_call_id);
CREATE INDEX IF NOT EXISTS idx_calls_lead_id ON calls(lead_id);
CREATE INDEX IF NOT EXISTS idx_calls_user_id ON calls(user_id);
CREATE INDEX IF NOT EXISTS idx_calls_call_date ON calls(call_date);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_disposition ON calls(disposition);

-- Custom Activities Indizes
CREATE INDEX IF NOT EXISTS idx_ca_lead ON custom_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_ca_type ON custom_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_ca_date ON custom_activities(date_created);
CREATE INDEX IF NOT EXISTS idx_ca_lead_type_date ON custom_activities(lead_id, activity_type, date_created);
CREATE INDEX IF NOT EXISTS idx_custom_activities_lead_email ON custom_activities(lead_email);
CREATE INDEX IF NOT EXISTS idx_custom_activities_user_email ON custom_activities(user_email);
CREATE INDEX IF NOT EXISTS idx_custom_activities_result ON custom_activities(result_value);
CREATE INDEX IF NOT EXISTS idx_custom_activities_calendly_event ON custom_activities(calendly_event_id);

-- Appointments Indizes
CREATE INDEX IF NOT EXISTS idx_appointments_lead_id ON appointments(lead_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_type ON appointments(appointment_type);
CREATE INDEX IF NOT EXISTS idx_appointments_current_date ON appointments(current_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Opportunities Indizes
CREATE INDEX IF NOT EXISTS idx_opportunities_lead_id ON opportunities(lead_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);

-- Calendly Events Indizes
CREATE INDEX IF NOT EXISTS idx_calendly_start_time ON calendly_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendly_user_id ON calendly_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendly_status ON calendly_events(status);
CREATE INDEX IF NOT EXISTS idx_calendly_events_invitee_email ON calendly_events(invitee_email);
CREATE INDEX IF NOT EXISTS idx_calendly_events_lead_id ON calendly_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_calendly_events_host_email ON calendly_events(host_email);
