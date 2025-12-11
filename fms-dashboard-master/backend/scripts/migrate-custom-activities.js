const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, '..', 'database');
const DB_PATH = path.join(DB_DIR, 'telefonie.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Fehler beim Öffnen der Datenbank:', err.message);
    process.exit(1);
  }
});

db.serialize(() => {
  // Prüfe ob alte Tabelle existiert
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='custom_activities'", (err, row) => {
    if (err) {
      console.error('Fehler:', err);
      db.close();
      process.exit(1);
    }

    if (row) {
      console.log('Alte custom_activities Tabelle gefunden. Starte Migration...');
      
      // Erstelle Backup-Tabelle
      db.run(`
        CREATE TABLE IF NOT EXISTS custom_activities_backup AS 
        SELECT * FROM custom_activities
      `, (err) => {
        if (err) {
          console.error('Fehler beim Erstellen des Backups:', err);
        } else {
          console.log('✓ Backup erstellt');
        }
      });

      // Lösche alte Tabelle
      db.run(`DROP TABLE IF EXISTS custom_activities`, (err) => {
        if (err) {
          console.error('Fehler beim Löschen der alten Tabelle:', err);
          db.close();
          process.exit(1);
        }
        console.log('✓ Alte Tabelle gelöscht');

        // Erstelle neue Tabelle
        db.run(`
          CREATE TABLE custom_activities (
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
            console.error('Fehler beim Erstellen der neuen Tabelle:', err);
            db.close();
            process.exit(1);
          }
          console.log('✓ Neue custom_activities Tabelle erstellt');

          // Erstelle Indizes
          db.run(`CREATE INDEX IF NOT EXISTS idx_ca_lead ON custom_activities(lead_id)`, () => {});
          db.run(`CREATE INDEX IF NOT EXISTS idx_ca_type ON custom_activities(activity_type)`, () => {});
          db.run(`CREATE INDEX IF NOT EXISTS idx_ca_date ON custom_activities(activity_date)`, () => {});
          db.run(`CREATE INDEX IF NOT EXISTS idx_ca_lead_type_date ON custom_activities(lead_id, activity_type, activity_date)`, () => {
            console.log('✓ Indizes erstellt');
            console.log('\n✅ Migration abgeschlossen!');
            db.close();
            process.exit(0);
          });
        });
      });
    } else {
      console.log('Keine alte Tabelle gefunden. Migration nicht notwendig.');
      db.close();
      process.exit(0);
    }
  });
});

