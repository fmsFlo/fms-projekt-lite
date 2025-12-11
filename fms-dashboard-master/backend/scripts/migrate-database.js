const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Datenbank-Pfad
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'database', 'telefonie.db');

// Öffne Datenbank
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Fehler beim Öffnen der Datenbank:', err.message);
    process.exit(1);
  } else {
    console.log(`Datenbank verbunden: ${DB_PATH}`);
  }
});

// Migriere Users Tabelle
const migrateUsersTable = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Prüfe ob Tabelle existiert
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          console.log('Users Tabelle existiert nicht, wird übersprungen.');
          resolve();
          return;
        }
        
        // Prüfe ob bereits migriert (close_user_id existiert)
        db.get("PRAGMA table_info(users)", (err, columns) => {
          if (err) {
            reject(err);
            return;
          }
          
          const hasCloseUserId = columns && columns.some(col => col.name === 'close_user_id');
          
          if (hasCloseUserId) {
            console.log('✓ Users Tabelle ist bereits migriert.');
            
            // Mache email optional (falls noch NOT NULL)
            db.run(`
              CREATE TABLE IF NOT EXISTS users_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                close_user_id TEXT UNIQUE NOT NULL,
                name TEXT,
                email TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
              )
            `, (err) => {
              if (err) {
                console.log('Tabelle users_new konnte nicht erstellt werden (möglicherweise existiert bereits).');
                resolve();
                return;
              }
              
              // Kopiere Daten
              db.run(`
                INSERT OR IGNORE INTO users_new (id, close_user_id, name, email, created_at)
                SELECT id, close_user_id, name, email, created_at FROM users
              `, (err) => {
                if (err) {
                  console.log('Daten konnten nicht kopiert werden:', err.message);
                }
                
                // Ersetze alte Tabelle
                db.run('DROP TABLE IF EXISTS users_old', () => {
                  db.run('ALTER TABLE users RENAME TO users_old', () => {
                    db.run('ALTER TABLE users_new RENAME TO users', (err) => {
                      if (err) {
                        console.error('Fehler beim Umbenennen:', err.message);
                        reject(err);
                      } else {
                        console.log('✓ Users Tabelle erfolgreich migriert (email ist jetzt optional).');
                        resolve();
                      }
                    });
                  });
                });
              });
            });
          } else {
            console.log('Users Tabelle hat alte Struktur, wird übersprungen (bitte Setup-Script ausführen).');
            resolve();
          }
        });
      });
    });
  });
};

// Hauptfunktion
const migrateDatabase = async () => {
  try {
    console.log('\n=== Datenbank Migration gestartet ===\n');
    
    await migrateUsersTable();
    
    console.log('\n=== Migration abgeschlossen ===\n');
    
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
    console.error('\n=== Fehler bei Migration ===');
    console.error(error);
    db.close();
    process.exit(1);
  }
};

// Führe Migration aus
migrateDatabase();

