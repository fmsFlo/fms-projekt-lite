require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'database', 'telefonie.db');

console.log('\n=== Diagnose ===\n');

// Prüfe Datenbank-Inhalt
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Datenbank-Fehler:', err.message);
    process.exit(1);
  }
  
  console.log('✓ Datenbank verbunden');
  
  // Prüfe Tabellen-Struktur
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error('❌ Fehler:', err.message);
      db.close();
      process.exit(1);
    }
    
    console.log('\n📋 Tabellen:');
    tables.forEach(table => {
      console.log(`  - ${table.name}`);
    });
    
    // Prüfe Users Tabelle Struktur
    db.all("PRAGMA table_info(users)", (err, columns) => {
      if (err) {
        console.error('❌ Fehler:', err.message);
        db.close();
        process.exit(1);
      }
      
      console.log('\n📊 Users Tabelle Spalten:');
      columns.forEach(col => {
        console.log(`  - ${col.name} (${col.type})`);
      });
      
      // Zähle Einträge
      db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
        const userCount = row ? row.count : 0;
        db.get('SELECT COUNT(*) as count FROM leads', (err, row) => {
          const leadCount = row ? row.count : 0;
          db.get('SELECT COUNT(*) as count FROM calls', (err, row) => {
            const callCount = row ? row.count : 0;
            
            console.log('\n📈 Datenbank-Inhalt:');
            console.log(`  - Users: ${userCount}`);
            console.log(`  - Leads: ${leadCount}`);
            console.log(`  - Calls: ${callCount}`);
            
            console.log('\n💡 Lösung:');
            if (userCount === 0 && leadCount === 0 && callCount === 0) {
              console.log('  1. Starte einen Sync:');
              console.log('     curl -X POST http://localhost:3001/api/sync');
              console.log('\n  2. Oder teste die Close API:');
              console.log('     npm run test-close');
            } else {
              console.log('  ✓ Datenbank enthält bereits Daten');
            }
            
            db.close();
            process.exit(0);
          });
        });
      });
    });
  });
});

