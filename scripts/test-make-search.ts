import { prisma } from '../lib/prisma'

async function testMakeSearch() {
  try {
    console.log('🔍 Teste Make-Suche...\n')
    
    // Hole Make-Webhook-URL aus Einstellungen
    const settings = await prisma.companySettings.findFirst()
    const makeWebhookUrl = settings?.makeWebhookUrl || process.env.MAKE_WEBHOOK_URL
    
    if (!makeWebhookUrl) {
      console.error('❌ Keine Make-Webhook-URL gefunden!')
      console.log('Bitte setze MAKE_WEBHOOK_URL in .env oder in den Company Settings')
      process.exit(1)
    }
    
    console.log('✅ Make-Webhook-URL gefunden:', makeWebhookUrl)
    console.log('📤 Sende Test-Query: "test@example.com"\n')
    
    // Test-Query
    const testQuery = 'test@example.com'
    
    // Rufe Make-Webhook auf
    const response = await fetch(makeWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(settings?.makeApiKey && { 'Authorization': `Bearer ${settings.makeApiKey}` })
      },
      body: JSON.stringify({ query: testQuery }),
      signal: AbortSignal.timeout(15000) // 15 Sekunden Timeout
    })
    
    console.log('📥 Response Status:', response.status)
    console.log('📥 Response Headers:', Object.fromEntries(response.headers.entries()))
    console.log('📥 Content-Type:', response.headers.get('content-type'))
    console.log()
    
    const status = response.status
    const contentType = response.headers.get('content-type') || ''
    
    if (status === 202) {
      console.log('⚠️ Make gibt 202 Accepted zurück - asynchroner Prozess')
      console.log('   → Prüfe Make History für die Ergebnisse')
      process.exit(0)
    }
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Keine Fehlermeldung')
      console.error('❌ Make Response nicht OK:', status)
      console.error('❌ Error Text:', errorText.substring(0, 500))
      process.exit(1)
    }
    
    if (contentType.includes('application/json')) {
      try {
        const data = await response.json()
        console.log('📥 Make Raw Response (JSON):')
        console.log(JSON.stringify(data, null, 2))
        console.log()
        console.log('📊 Response Type:', typeof data)
        console.log('📊 Is Array:', Array.isArray(data))
        console.log('📊 Keys:', Object.keys(data || {}))
        console.log()
        
        // Prüfe verschiedene mögliche Feldnamen
        if (Array.isArray(data)) {
          console.log('✅ Make gibt Array direkt zurück')
          console.log('📊 Array Length:', data.length)
          if (data.length > 0) {
            console.log('📊 Erstes Element:', JSON.stringify(data[0], null, 2))
          }
        } else if (data.results && Array.isArray(data.results)) {
          console.log('✅ Make gibt {results: [...]} zurück')
          console.log('📊 Results Length:', data.results.length)
          if (data.results.length > 0) {
            console.log('📊 Erstes Result:', JSON.stringify(data.results[0], null, 2))
          }
        } else if (data.clients && Array.isArray(data.clients)) {
          console.log('✅ Make gibt {clients: [...]} zurück')
          console.log('📊 Clients Length:', data.clients.length)
          if (data.clients.length > 0) {
            console.log('📊 Erster Client:', JSON.stringify(data.clients[0], null, 2))
          }
        } else if (data.data && Array.isArray(data.data)) {
          console.log('✅ Make gibt {data: [...]} zurück')
          console.log('📊 Data Length:', data.data.length)
          if (data.data.length > 0) {
            console.log('📊 Erstes Data Element:', JSON.stringify(data.data[0], null, 2))
          }
        } else {
          console.log('⚠️ Unbekanntes Format!')
          console.log('📊 Versuche alle Array-Felder zu finden...')
          for (const key in data) {
            if (Array.isArray(data[key])) {
              console.log(`✅ Gefunden: data.${key} ist ein Array mit ${data[key].length} Elementen`)
              if (data[key].length > 0) {
                console.log(`📊 Erstes Element von ${key}:`, JSON.stringify(data[key][0], null, 2))
              }
            }
          }
        }
      } catch (jsonError: any) {
        console.error('❌ JSON Parse Error:', jsonError.message)
        const text = await response.text()
        console.error('❌ Response Text:', text.substring(0, 500))
      }
    } else {
      const text = await response.text()
      console.log('⚠️ Make gibt nicht-JSON zurück:')
      console.log(text.substring(0, 500))
    }
    
    await prisma.$disconnect()
  } catch (error: any) {
    console.error('❌ Fehler:', error.message)
    console.error('❌ Stack:', error.stack)
    await prisma.$disconnect()
    process.exit(1)
  }
}

testMakeSearch()

