require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const CloseApiService = require('../services/closeApi');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'database', 'telefonie.db');

console.log('\n=== Status Check ===\n');

// 1. Prüfe Datenbank
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Datenbank-Fehler:', err.message);
    process.exit(1);
  }
  
  console.log('✓ Datenbank verbunden:', DB_PATH);
  
  // Zähle Einträge
  db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
    if (err) {
      console.error('❌ Fehler beim Zählen der Users:', err.message);
    } else {
      console.log(`📊 Users in DB: ${row.count}`);
    }
    
    db.get('SELECT COUNT(*) as count FROM leads', (err, row) => {
      if (err) {
        console.error('❌ Fehler beim Zählen der Leads:', err.message);
      } else {
        console.log(`📊 Leads in DB: ${row.count}`);
      }
      
      db.get('SELECT COUNT(*) as count FROM calls', (err, row) => {
        if (err) {
          console.error('❌ Fehler beim Zählen der Calls:', err.message);
        } else {
          console.log(`📊 Calls in DB: ${row.count}`);
        }
        
        // Prüfe API
        console.log('\n=== API Check ===\n');
        testCloseApi();
      });
    });
  });
});

async function testCloseApi() {
  try {
    console.log('✓ Prüfe Close API...');
    const closeApi = new CloseApiService();
    
    const users = await closeApi.getUsers();
    console.log(`✓ Close API Users gefunden: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\nErste 3 Users:');
      users.slice(0, 3).forEach((user, i) => {
        console.log(`  ${i + 1}. ${user.name || 'N/A'} (${user.close_user_id})`);
      });
    }
    
    const leads = await closeApi.getLeads();
    console.log(`✓ Close API Leads gefunden: ${leads.length}`);
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const calls = await closeApi.getCallsByDateRange(
      startDate.toISOString(),
      endDate.toISOString()
    );
    console.log(`✓ Close API Calls gefunden (letzte 30 Tage): ${calls.length}`);
    
    console.log('\n=== Zusammenfassung ===\n');
    console.log('✅ API funktioniert');
    console.log('⚠️  Wenn DB leer ist, führe einen Sync aus:');
    console.log('   curl -X POST http://localhost:3001/api/sync\n');
    
    db.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ API Fehler:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Response:', JSON.stringify(error.response.data, null, 2));
    }
    db.close();
    process.exit(1);
  }
}

