import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const schema = z.object({ leadId: z.string().min(1) })

export async function POST(req: Request) {
  try {
    const input = schema.parse(await req.json())
    
    // Hole Make-Webhook-URL aus Einstellungen
    const settings = await prisma.companySettings.findFirst()
    const makeWebhookUrl = settings?.makeWebhookUrl
    
    if (makeWebhookUrl) {
      try {
        // Rufe Make-Webhook auf für vollständige Details
        // Du musst in Make einen separaten Webhook/Route einrichten für Details
        // oder den gleichen Webhook verwenden mit anderem Parameter
        const detailsUrl = makeWebhookUrl.replace('/search', '/details') // oder eigener Webhook
        
        const response = await fetch(detailsUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(settings?.makeApiKey && { 'Authorization': `Bearer ${settings.makeApiKey}` })
          },
          body: JSON.stringify({ leadId: input.leadId }),
          signal: AbortSignal.timeout(10000)
        })
        
        if (response.ok) {
          const data = await response.json()
          return NextResponse.json(data)
        }
      } catch (makeError) {
        console.error('Make API Error:', makeError)
      }
    }
    
    // Fallback: Mock vollständige Daten
    const mockData = {
      firstName: 'Max',
      lastName: 'Mustermann',
      email: 'max@example.com',
      phone: '+49 170 1234567',
      street: 'Hauptstr.',
      houseNumber: '10',
      zip: '12345',
      city: 'Berlin',
      iban: 'DE12 3456 7890 1234 5678 90',
      crmId: input.leadId
    }
    
    return NextResponse.json(mockData)
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return NextResponse.json({ message: 'Ungültige Eingabe', issues: err.issues }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ message: 'Interner Fehler' }, { status: 500 })
  }
}

