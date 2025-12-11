require('dotenv').config();
const CustomActivitiesSyncService = require('../services/customActivitiesSyncService');

async function testSync() {
  console.log('🔍 Teste Custom Activities Sync direkt...\n');
  
  const syncService = new CustomActivitiesSyncService();
  
  try {
    const result = await syncService.syncAllCustomActivities(30);
    console.log('\n✅ Sync abgeschlossen:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('\n❌ Fehler:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

testSync();

