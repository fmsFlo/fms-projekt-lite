require('dotenv').config();
const CalendlySyncService = require('../services/calendlySyncService');

async function syncCalendly() {
  try {
    console.log('=== Calendly Synchronisation gestartet ===\n');
    
    const syncService = new CalendlySyncService();
    const result = await syncService.syncCalendlyEvents(90, 90); // 90 Tage zurück + 90 Tage voraus
    
    console.log('\n=== Synchronisation abgeschlossen ===');
    console.log(`Ergebnis: ${result} Events synchronisiert`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fehler bei der Calendly-Synchronisation:', error);
    process.exit(1);
  }
}

// Führe Sync aus
syncCalendly();


