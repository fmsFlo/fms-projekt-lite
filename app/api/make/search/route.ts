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
          // Prüfe ob Content-Type JSON ist
          if (contentType.includes('application/json')) {
            try {
              const data = await response.json()
              console.log('📥 Make Raw Response:', JSON.stringify(data, null, 2))
              
              // Erwarte Format: { results: [...] } oder { clients: [...] }
              // Manchmal gibt Make ein Array direkt zurück
              if (Array.isArray(data)) {
                console.log('✅ Make gibt Array direkt zurück')
                return NextResponse.json({ results: data })
              }
              
              if (data.results) {
                console.log('✅ Make gibt {results: [...]} zurück')
                return NextResponse.json({ results: data.results })
              }
              
              console.log('⚠️ Unbekanntes Format von Make:', data)
              return NextResponse.json(data)
            } catch (jsonError: any) {
              console.error('❌ JSON Parse Error:', jsonError.message)
              const text = await response.text()
              console.error('❌ Response Text:', text.substring(0, 200))
              // Fallback zu Mock-Daten
            }
          } else {
            // Nicht JSON Response
            const text = await response.text()
            console.log('⚠️ Make gibt nicht-JSON zurück:', text.substring(0, 200))
            // Fallback zu Mock-Daten
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
