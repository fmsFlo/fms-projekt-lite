import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const schema = z.object({ query: z.string().min(1) })

export async function POST(req: Request) {
  try {
    const input = schema.parse(await req.json())
    
    // Hole Make-Webhook-URL aus Einstellungen
    const settings = await prisma.companySettings.findFirst()
    const makeWebhookUrl = settings?.makeWebhookUrl || process.env.MAKE_WEBHOOK_URL
    
    if (makeWebhookUrl) {
      try {
        // Rufe Make-Webhook auf
        const response = await fetch(makeWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(settings?.makeApiKey && { 'Authorization': `Bearer ${settings.makeApiKey}` })
          },
          body: JSON.stringify({ query: input.query }),
          signal: AbortSignal.timeout(10000) // 10 Sekunden Timeout
        })
        
        // Prüfe Status Code (200-299 sind OK, 202 Accepted bedeutet asynchroner Prozess)
        const status = response.status
        const contentType = response.headers.get('content-type') || ''
        
        console.log('📥 Make Response Status:', status)
        console.log('📥 Make Content-Type:', contentType)
        
        // HTTP 202 Accepted bedeutet, dass die Anfrage akzeptiert wurde, aber noch verarbeitet wird
        // In diesem Fall gibt es oft keine JSON-Antwort
        if (status === 202) {
          console.log('⚠️ Make gibt 202 Accepted zurück - asynchroner Prozess, verwende Fallback')
          // Fallback zu Mock-Daten
        } else if (response.ok && status >= 200 && status < 300) {
          // Versuche JSON zu parsen (auch wenn Content-Type fehlt)
          let data: any = null
          let responseText: string = ''
          
          try {
            // Lese Response als Text (kann dann als JSON geparst werden)
            responseText = await response.text()
            console.log('📥 Make Raw Response Text (erste 500 Zeichen):', responseText.substring(0, 500))
            
            // Versuche JSON zu parsen, auch wenn Content-Type fehlt oder leer ist
            // Prüfe ob Text wie JSON aussieht (startet mit { oder [)
            if (contentType.includes('application/json') || responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
              try {
                data = JSON.parse(responseText)
                console.log('✅ JSON erfolgreich geparst')
              } catch (parseError: any) {
                console.error('❌ JSON Parse Error:', parseError.message)
                console.error('❌ Response Text (erste 500 Zeichen):', responseText.substring(0, 500))
                // Fallback zu Mock-Daten
              }
            } else {
              console.log('⚠️ Content-Type ist nicht JSON und Text startet nicht mit { oder [')
              console.log('⚠️ Response Text (erste 200 Zeichen):', responseText.substring(0, 200))
              // Fallback zu Mock-Daten
            }
          } catch (textError: any) {
            console.error('❌ Fehler beim Lesen der Response:', textError.message)
            // Fallback zu Mock-Daten
          }
          
          // Wenn wir Daten haben, verarbeite sie
          if (data !== null) {
            console.log('📥 Make Parsed Data:', JSON.stringify(data, null, 2))
            console.log('📊 Response Type:', typeof data)
            console.log('📊 Is Array:', Array.isArray(data))
            console.log('📊 Keys:', Object.keys(data || {}))
            console.log()
            
            // Erwarte Format: { results: [...] } oder { clients: [...] }
            // Manchmal gibt Make ein Array direkt zurück
            if (Array.isArray(data)) {
              console.log('✅ Make gibt Array direkt zurück, Länge:', data.length)
              if (data.length > 0) {
                console.log('📊 Erstes Element:', JSON.stringify(data[0], null, 2))
              }
              return NextResponse.json({ results: data })
            }
            
            // Prüfe verschiedene mögliche Feldnamen
            if (data.results && Array.isArray(data.results)) {
              console.log('✅ Make gibt {results: [...]} zurück, Länge:', data.results.length)
              if (data.results.length > 0) {
                console.log('📊 Erstes Result:', JSON.stringify(data.results[0], null, 2))
              }
              return NextResponse.json({ results: data.results })
            }
            
            if (data.clients && Array.isArray(data.clients)) {
              console.log('✅ Make gibt {clients: [...]} zurück, Länge:', data.clients.length)
              if (data.clients.length > 0) {
                console.log('📊 Erster Client:', JSON.stringify(data.clients[0], null, 2))
              }
              return NextResponse.json({ results: data.clients })
            }
            
            if (data.data && Array.isArray(data.data)) {
              console.log('✅ Make gibt {data: [...]} zurück, Länge:', data.data.length)
              if (data.data.length > 0) {
                console.log('📊 Erstes Data Element:', JSON.stringify(data.data[0], null, 2))
              }
              return NextResponse.json({ results: data.data })
            }
            
            if (data.items && Array.isArray(data.items)) {
              console.log('✅ Make gibt {items: [...]} zurück, Länge:', data.items.length)
              if (data.items.length > 0) {
                console.log('📊 Erstes Item:', JSON.stringify(data.items[0], null, 2))
              }
              return NextResponse.json({ results: data.items })
            }
            
            // Prüfe ob es ein einzelnes Objekt ist (nicht Array)
            if (data && typeof data === 'object' && !Array.isArray(data)) {
              // Wenn es ein einzelnes Client-Objekt ist, wrappe es in ein Array
              if (data.firstName || data.email || data.lastName) {
                console.log('✅ Make gibt einzelnes Client-Objekt zurück, wrappe es in Array')
                return NextResponse.json({ results: [data] })
              }
            }
            
            console.log('⚠️ Unbekanntes Format von Make:', data)
            console.log('⚠️ Versuche trotzdem, alle Array-Felder zu finden...')
            // Versuche alle Array-Felder zu finden
            for (const key in data) {
              if (Array.isArray(data[key])) {
                console.log(`✅ Gefunden: data.${key} ist ein Array mit ${data[key].length} Elementen`)
                if (data[key].length > 0) {
                  console.log(`📊 Erstes Element von ${key}:`, JSON.stringify(data[key][0], null, 2))
                }
                return NextResponse.json({ results: data[key] })
              }
            }
            
            console.log('⚠️ Kein Array gefunden, gebe leeres Array zurück')
            return NextResponse.json({ results: [] })
          }
        } else {
          const errorText = await response.text().catch(() => 'Keine Fehlermeldung')
          console.error('❌ Make Response nicht OK:', status, errorText.substring(0, 200))
          // Fallback zu Mock-Daten
        }
      } catch (makeError) {
        console.error('Make API Error:', makeError)
        // Fallback zu Mock-Daten bei Fehler
      }
    }
    
    // Fallback: Mock-Daten wenn Make nicht konfiguriert oder Fehler
    // Vollständige Daten direkt bei der Suche!
    const mockResults = [
      { 
        id: 'mock-1', 
        firstName: 'Max', 
        lastName: 'Mustermann', 
        email: 'max@example.com',
        phone: '+49 170 1234567',
        street: 'Hauptstr.',
        houseNumber: '10',
        zip: '12345',
        city: 'Berlin',
        iban: 'DE12 3456 7890 1234 5678 90',
        crmId: 'CRM-001' 
      },
      { 
        id: 'mock-2', 
        firstName: 'Erika', 
        lastName: 'Musterfrau', 
        email: 'erika@example.com',
        phone: '+49 171 9876543',
        street: 'Nebenweg',
        houseNumber: '5',
        zip: '20095',
        city: 'Hamburg',
        iban: 'DE98 7654 3210 9876 5432 10',
        crmId: 'CRM-002' 
      }
    ]
    const filtered = mockResults.filter(c => {
      const fullName = `${c.firstName} ${c.lastName}`.toLowerCase()
      return fullName.includes(input.query.toLowerCase()) || c.email.toLowerCase().includes(input.query.toLowerCase())
    })
    return NextResponse.json({ results: filtered })
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return NextResponse.json({ message: 'Ungültige Eingabe', issues: err.issues }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ message: 'Interner Fehler' }, { status: 500 })
  }
}
