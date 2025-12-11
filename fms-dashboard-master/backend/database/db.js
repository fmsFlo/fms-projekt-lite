const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'telefonie.db');
const DB_DIR = path.dirname(DB_PATH);

// Stelle sicher, dass das Datenbank-Verzeichnis existiert
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Öffne Datenbankverbindung
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Fehler beim Öffnen der Datenbank:', err.message);
  } else {
    console.log('Verbindung zur SQLite Datenbank hergestellt.');
    enableForeignKeys();
    initializeDatabase();
  }
});

// Aktiviere Foreign Keys
function enableForeignKeys() {
  db.run("PRAGMA foreign_keys = ON", (err) => {
    if (err) {
      console.error('Fehler beim Aktivieren von Foreign Keys:', err.message);
    }
  });
}

// Initialisiere Datenbank mit Schema
function initializeDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  db.exec(schema, (err) => {
    if (err) {
      console.error('Fehler beim Initialisieren der Datenbank:', err.message);
    } else {
      console.log('Datenbank Schema initialisiert.');
    }
  });
}

// Promise-basierte Wrapper für Datenbankoperationen
const dbGet = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

const dbRun = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

module.exports = {
  db,
  dbGet,
  dbAll,
  dbRun
};


