const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database', 'telefonie.db');

function setupCalendlyTables() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log('📦 Erstelle Calendly Tabellen...');
      
      db.serialize(() => {
        // Calendly Events Tabelle
        db.run(`
          CREATE TABLE IF NOT EXISTS calendly_events (
            id TEXT PRIMARY KEY,
            calendly_event_id TEXT UNIQUE NOT NULL,
            event_name TEXT NOT NULL,
            event_type TEXT,
            mapped_appointment_type TEXT,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            duration_minutes INTEGER,
            status TEXT NOT NULL,
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
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            synced_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (lead_id) REFERENCES leads(id)
          )
        `, (err) => {
          if (err) {
            console.error('❌ Fehler beim Erstellen von calendly_events:', err);
          } else {
            console.log('  ✓ calendly_events Tabelle erstellt');
          }
        });
        
        // Indexes für bessere Performance
        db.run(`
          CREATE INDEX IF NOT EXISTS idx_calendly_events_start_time 
          ON calendly_events(start_time)
        `);
        
        db.run(`
          CREATE INDEX IF NOT EXISTS idx_calendly_events_user_id 
          ON calendly_events(user_id)
        `);
        
        db.run(`
          CREATE INDEX IF NOT EXISTS idx_calendly_events_status 
          ON calendly_events(status)
        `);
        
        // Indexes mit Fehlerbehandlung
        db.run(`CREATE INDEX IF NOT EXISTS idx_calendly_events_invitee_email ON calendly_events(invitee_email)`, (err) => {
          if (err) console.warn('  ⚠️  Index invitee_email:', err.message);
        });
        
        db.run(`CREATE INDEX IF NOT EXISTS idx_calendly_events_lead_id ON calendly_events(lead_id)`, (err) => {
          if (err) console.warn('  ⚠️  Index lead_id:', err.message);
        });
        
        db.run(`CREATE INDEX IF NOT EXISTS idx_calendly_events_host_email ON calendly_events(host_email)`, (err) => {
          if (err) console.warn('  ⚠️  Index host_email:', err.message);
        }, () => {
          console.log('  ✓ Alle Indexes erstellt/geprüft');
          resolve();
        });
      });
      
      db.close();
    });
  });
}

// Wenn direkt ausgeführt
if (require.main === module) {
  setupCalendlyTables()
    .then(() => {
      console.log('✅ Calendly Tabellen erfolgreich erstellt!');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Fehler:', err);
      process.exit(1);
    });
}

module.exports = { setupCalendlyTables };
