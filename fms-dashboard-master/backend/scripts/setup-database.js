const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Datenbank-Pfad
const DB_DIR = path.join(__dirname, '..', 'database');
const DB_PATH = path.join(DB_DIR, 'telefonie.db');

// Stelle sicher, dass das Datenbank-Verzeichnis existiert
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
  console.log(`Verzeichnis ${DB_DIR} erstellt.`);
}

// Öffne/Erstelle Datenbank
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Fehler beim Öffnen/Erstellen der Datenbank:', err.message);
    process.exit(1);
  } else {
    console.log(`Datenbank verbunden: ${DB_PATH}`);
  }
});

// Aktiviere Foreign Keys
db.run("PRAGMA foreign_keys = ON", (err) => {
  if (err) {
    console.error('Fehler beim Aktivieren von Foreign Keys:', err.message);
  } else {
    console.log('Foreign Keys aktiviert.');
  }
});

// Erstelle Tabellen
const createTables = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users Tabelle
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          close_user_id TEXT UNIQUE NOT NULL,
          name TEXT,
          email TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Fehler beim Erstellen der users Tabelle:', err.message);
          reject(err);
        } else {
          console.log('✓ Tabelle "users" erstellt.');
        }
      });

      // Leads Tabelle
      db.run(`
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
        )
      `, (err) => {
        if (err) {
          console.error('Fehler beim Erstellen der leads Tabelle:', err.message);
          reject(err);
        } else {
          console.log('✓ Tabelle "leads" erstellt.');
        }
      });

      // Calls Tabelle
      db.run(`
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
        )
      `, (err) => {
        if (err) {
          console.error('Fehler beim Erstellen der calls Tabelle:', err.message);
          reject(err);
        } else {
          console.log('✓ Tabelle "calls" erstellt.');
        }
      });

      // Custom Activities Tabelle
      db.run(`
        CREATE TABLE IF NOT EXISTS custom_activities (
          id TEXT PRIMARY KEY,
          close_activity_id TEXT UNIQUE NOT NULL,
          activity_type TEXT NOT NULL CHECK(activity_type IN ('erstgespraech', 'konzept', 'umsetzung', 'service')),
          activity_type_id TEXT NOT NULL,
          lead_id INTEGER,
          opportunity_id TEXT,
          user_id INTEGER,
          ergebnis TEXT,
          loss_reason TEXT,
          activity_status TEXT,
          next_appointment_booked INTEGER DEFAULT 0,
          next_appointment_date TEXT,
          next_appointment_type TEXT,
          custom_fields TEXT,
          activity_date TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (lead_id) REFERENCES leads(id),
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `, (err) => {
        if (err) {
          console.error('Fehler beim Erstellen der custom_activities Tabelle:', err.message);
          reject(err);
        } else {
          console.log('✓ Tabelle "custom_activities" erstellt.');
        }
      });

      // Opportunities Tabelle
      db.run(`
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
        )
      `, (err) => {
        if (err) {
          console.error('Fehler beim Erstellen der opportunities Tabelle:', err.message);
          reject(err);
        } else {
          console.log('✓ Tabelle "opportunities" erstellt.');
        }
      });

      // Appointments Tabelle
      db.run(`
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
        )
      `, (err) => {
        if (err) {
          console.error('Fehler beim Erstellen der appointments Tabelle:', err.message);
          reject(err);
        } else {
          console.log('✓ Tabelle "appointments" erstellt.');
        }
      });

      // Appointment History Tabelle
      db.run(`
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
        )
      `, (err) => {
        if (err) {
          console.error('Fehler beim Erstellen der appointment_history Tabelle:', err.message);
          reject(err);
        } else {
          console.log('✓ Tabelle "appointment_history" erstellt.');
        }
      });

      // Sync Log Tabelle
      db.run(`
        CREATE TABLE IF NOT EXISTS sync_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sync_type TEXT NOT NULL,
          last_sync DATETIME NOT NULL,
          records_synced INTEGER DEFAULT 0,
          status TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Fehler beim Erstellen der sync_log Tabelle:', err.message);
          reject(err);
        } else {
          console.log('✓ Tabelle "sync_log" erstellt.');
        }
      });

      // Erstelle Indizes für bessere Performance
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_calls_close_call_id ON calls(close_call_id)
      `, (err) => {
        if (err) console.error('Fehler beim Erstellen des Index idx_calls_close_call_id:', err.message);
      });

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_calls_lead_id ON calls(lead_id)
      `, (err) => {
        if (err) console.error('Fehler beim Erstellen des Index idx_calls_lead_id:', err.message);
      });

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_calls_user_id ON calls(user_id)
      `, (err) => {
        if (err) console.error('Fehler beim Erstellen des Index idx_calls_user_id:', err.message);
      });

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_calls_call_date ON calls(call_date)
      `, (err) => {
        if (err) console.error('Fehler beim Erstellen des Index idx_calls_call_date:', err.message);
      });

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_calls_disposition ON calls(disposition)
      `, (err) => {
        if (err) console.error('Fehler beim Erstellen des Index idx_calls_disposition:', err.message);
      });

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_users_close_user_id ON users(close_user_id)
      `, (err) => {
        if (err) console.error('Fehler beim Erstellen des Index idx_users_close_user_id:', err.message);
      });

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_leads_close_lead_id ON leads(close_lead_id)
      `, (err) => {
        if (err) console.error('Fehler beim Erstellen des Index idx_leads_close_lead_id:', err.message);
      });

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_appointments_lead_id ON appointments(lead_id)
      `, (err) => {
        if (err) console.error('Fehler beim Erstellen des Index idx_appointments_lead_id:', err.message);
      });

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id)
      `, (err) => {
        if (err) console.error('Fehler beim Erstellen des Index idx_appointments_user_id:', err.message);
      });

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_appointments_type ON appointments(appointment_type)
      `, (err) => {
        if (err) console.error('Fehler beim Erstellen des Index idx_appointments_type:', err.message);
      });

      // Index für current_date - nur wenn nicht NULL (SQLite erlaubt keine non-deterministic functions)
      // Wir erstellen einen einfachen Index ohne Funktion
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_appointments_current_date ON appointments(current_date)
        WHERE current_date IS NOT NULL
      `, (err) => {
        if (err) {
          // Fallback: Einfacher Index ohne WHERE (SQLite Version könnte WHERE nicht unterstützen)
          db.run(`
            CREATE INDEX IF NOT EXISTS idx_appointments_current_date_simple ON appointments(current_date)
          `, (err2) => {
            if (err2) console.error('Fehler beim Erstellen des Index idx_appointments_current_date:', err2.message);
          });
        }
      });

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status)
      `, (err) => {
        if (err) console.error('Fehler beim Erstellen des Index idx_appointments_status:', err.message);
      });

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_opportunities_lead_id ON opportunities(lead_id)
      `, (err) => {
        if (err) console.error('Fehler beim Erstellen des Index idx_opportunities_lead_id:', err.message);
      });

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage)
      `, (err) => {
        if (err) console.error('Fehler beim Erstellen des Index idx_opportunities_stage:', err.message);
      });

      // Indizes für custom_activities
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_ca_lead ON custom_activities(lead_id)
      `, (err) => {
        if (err) console.error('Fehler beim Erstellen des Index idx_ca_lead:', err.message);
      });

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_ca_type ON custom_activities(activity_type)
      `, (err) => {
        if (err) console.error('Fehler beim Erstellen des Index idx_ca_type:', err.message);
      });

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_ca_date ON custom_activities(activity_date)
      `, (err) => {
        if (err) console.error('Fehler beim Erstellen des Index idx_ca_date:', err.message);
      });

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_ca_lead_type_date ON custom_activities(lead_id, activity_type, activity_date)
      `, (err) => {
        if (err) console.error('Fehler beim Erstellen des Index idx_ca_lead_type_date:', err.message);
      });

      // Erweitere appointments Tabelle falls sie bereits existiert
      db.run(`
        ALTER TABLE appointments ADD COLUMN result_activity_id TEXT
      `, (err) => {
        // Ignoriere Fehler wenn Spalte bereits existiert
        if (err && !err.message.includes('duplicate column') && !err.message.includes('no such column')) {
          console.error('Fehler beim Hinzufügen der Spalte result_activity_id:', err.message);
        }
      });

      db.run(`
        ALTER TABLE appointments ADD COLUMN compliance_filled INTEGER DEFAULT 0
      `, (err) => {
        // Ignoriere Fehler wenn Spalte bereits existiert
        if (err && !err.message.includes('duplicate column') && !err.message.includes('no such column')) {
          console.error('Fehler beim Hinzufügen der Spalte compliance_filled:', err.message);
        }
      });


      // Warte auf alle Operationen
      db.wait((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✓ Alle Indizes erstellt.');
          resolve();
        }
      });
    });
  });
};

// Hauptfunktion
const setupDatabase = async () => {
  try {
    console.log('\n=== Datenbank Setup gestartet ===\n');
    
    await createTables();
    
    console.log('\n=== Datenbank Setup erfolgreich abgeschlossen ===');
    console.log(`Datenbank-Pfad: ${DB_PATH}\n`);
    
    // Schließe Datenbankverbindung
    db.close((err) => {
      if (err) {
        console.error('Fehler beim Schließen der Datenbank:', err.message);
        process.exit(1);
      } else {
        console.log('Datenbankverbindung geschlossen.');
        process.exit(0);
      }
    });
  } catch (error) {
    console.error('\n=== Fehler beim Setup ===');
    console.error(error);
    db.close();
    process.exit(1);
  }
};

// Führe Setup aus
setupDatabase();

