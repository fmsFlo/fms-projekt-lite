require('dotenv').config();
const CloseApiService = require('../services/closeApi');

async function testCustomActivities() {
  console.log('🔍 Teste Custom Activities Abruf...\n');
  
  const closeApi = new CloseApiService();
  
  // Test Activity Type Config
  console.log('📋 Activity Type Config:');
  console.log(CloseApiService.ACTIVITY_TYPE_CONFIG);
  console.log('\n');
  
  // Test jeden Activity Type
  for (const [typeKey, typeConfig] of Object.entries(CloseApiService.ACTIVITY_TYPE_CONFIG)) {
    console.log(`\n📋 Teste ${typeConfig.name} (${typeKey})...`);
    console.log(`   Type ID: ${typeConfig.id}`);
    console.log(`   Result Field: ${typeConfig.resultField}`);
    
    try {
      // Hole Activities für letzten 30 Tage
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      console.log(`   Zeitraum: ${startDate.toISOString()} bis ${endDate.toISOString()}`);
      
      const activities = await closeApi.getCustomActivitiesByType(
        typeConfig.id,
        startDate.toISOString(),
        endDate.toISOString()
      );
      
      console.log(`   ✅ Gefunden: ${activities.length} Activities`);
      
      if (activities.length > 0) {
        console.log(`   📄 Erste Activity:`);
        console.log(`      - ID: ${activities[0].id}`);
        console.log(`      - Lead ID: ${activities[0].lead_id}`);
        console.log(`      - User ID: ${activities[0].created_by || activities[0].user_id}`);
        console.log(`      - Date Created: ${activities[0].date_created}`);
        console.log(`      - Custom Fields:`, Object.keys(activities[0]).filter(k => k.startsWith('custom.')).slice(0, 5));
        
        // Prüfe Ergebnis-Feld
        const resultValue = activities[0][`custom.${typeConfig.resultField}`] || 
                           activities[0].custom?.[typeConfig.resultField];
        console.log(`      - Ergebnis: ${resultValue || 'Nicht ausgefüllt'}`);
      }
      
    } catch (error) {
      console.error(`   ❌ Fehler:`, error.message);
      if (error.response) {
        console.error(`      Status: ${error.response.status}`);
        console.error(`      Data:`, JSON.stringify(error.response.data).substring(0, 200));
      }
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n✅ Test abgeschlossen');
}

testCustomActivities().catch(console.error);

