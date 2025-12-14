import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Params {
  params: { id: string }
}

export async function GET(_req: Request, { params }: Params) {
  console.log('=== VERSICHERUNGS-CHECK API GET CALLED ===')
  console.log('Client ID:', params.id)
  console.log('Method: GET')

  try {
    console.log('1. Prüfe Session...')
    const userId = getUserId(_req)
    if (!userId) {
      console.log('❌ Keine Session gefunden')
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }
    console.log('✅ Session OK, User ID:', userId)

    console.log('2. Prüfe Client...')
    const client = await prisma.client.findUnique({
      where: { id: params.id },
    })

    if (!client) {
      console.log('❌ Client nicht gefunden:', params.id)
      return NextResponse.json({ message: 'Client nicht gefunden' }, { status: 404 })
    }
    console.log('✅ Client gefunden:', client.firstName, client.lastName)

    console.log('3. Prüfe VersicherungsCheck Model...')
    // Prüfe ob Model im Prisma Client existiert
    if (!(prisma as any).versicherungsCheck) {
      console.log('⚠️ VersicherungsCheck Model nicht im Prisma Client gefunden')
      console.log('   Verfügbare Models:', Object.keys(prisma).filter(key => !key.startsWith('_')))
      return NextResponse.json(null)
    }
    console.log('✅ VersicherungsCheck Model gefunden')

    console.log('4. Query VersicherungsCheck...')
    const check = await (prisma as any).versicherungsCheck.findFirst({
      where: { clientId: params.id },
      orderBy: { updatedAt: 'desc' },
    })

    if (!check) {
      console.log('ℹ️ Kein VersicherungsCheck für Client gefunden')
      return NextResponse.json(null)
    }
    console.log('✅ VersicherungsCheck gefunden, ID:', check.id)

    console.log('5. Parse JSON fields...')
    // Parse JSON fields
    let versicherungen = []
    try {
      versicherungen = check.versicherungen ? JSON.parse(check.versicherungen as string) : []
    } catch (parseError: any) {
      console.error('❌ JSON Parse Fehler:', parseError.message)
      versicherungen = []
    }

    const result = {
      ...check,
      versicherungen,
    }

    console.log('✅ Erfolgreich, versicherungen count:', versicherungen.length)
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('❌ ERROR in Versicherungs-Check GET:', err)
    console.error('Error name:', err.name)
    console.error('Error message:', err.message)
    console.error('Error stack:', err.stack)
    
    // Spezifische Fehlerbehandlung
    if (err.message?.includes('does not exist') || 
        err.message?.includes('relation') || 
        err.message?.includes('table') ||
        err.message?.includes('Unknown table')) {
      console.log('ℹ️ Tabelle existiert noch nicht, return null')
      return NextResponse.json(null)
    }

    return NextResponse.json(
      { 
        message: err.message || 'Unbekannter Fehler',
        error: err.name,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
      }, 
      { status: 500 }
    )
  }
}

export async function POST(req: Request, { params }: Params) {
  console.log('=== VERSICHERUNGS-CHECK API POST CALLED ===')
  console.log('Client ID:', params.id)
  console.log('Method: POST')

  try {
    console.log('1. Prüfe Session...')
    const userId = getUserId(req)
    if (!userId) {
      console.log('❌ Keine Session gefunden')
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }
    console.log('✅ Session OK, User ID:', userId)

    console.log('2. Prüfe Client...')
    const client = await prisma.client.findUnique({
      where: { id: params.id },
    })

    if (!client) {
      console.log('❌ Client nicht gefunden:', params.id)
      return NextResponse.json({ message: 'Client nicht gefunden' }, { status: 404 })
    }
    console.log('✅ Client gefunden:', client.firstName, client.lastName)

    console.log('3. Parse Request Body...')
    const body = await req.json()
    console.log('Body keys:', Object.keys(body))
    const { versicherungen, gesamtBeitragVorher, gesamtBeitragNachher, einsparung, risikoStatusVorher, risikoStatusNachher } = body

    console.log('4. Prüfe VersicherungsCheck Model...')
    // Prüfe ob Model im Prisma Client existiert
    if (!(prisma as any).versicherungsCheck) {
      console.log('❌ VersicherungsCheck Model nicht im Prisma Client gefunden')
      return NextResponse.json(
        { 
          message: 'VersicherungsCheck Model nicht im Prisma Client gefunden. Bitte `npx prisma generate` ausführen.',
        },
        { status: 503 }
      )
    }
    console.log('✅ VersicherungsCheck Model gefunden')

    console.log('5. Finde oder erstelle Eintrag...')
    // Finde oder erstelle Eintrag
    const existing = await (prisma as any).versicherungsCheck.findFirst({
      where: { clientId: params.id },
    })

    if (existing) {
      console.log('✅ Existierender Eintrag gefunden, ID:', existing.id)
    } else {
      console.log('ℹ️ Kein existierender Eintrag, erstelle neuen...')
    }

    const data = {
      clientId: params.id,
      versicherungen: JSON.stringify(versicherungen || []),
      gesamtBeitragVorher: gesamtBeitragVorher || 0,
      gesamtBeitragNachher: gesamtBeitragNachher || 0,
      einsparung: einsparung || 0,
      risikoStatusVorher: risikoStatusVorher || 'mittel',
      risikoStatusNachher: risikoStatusNachher || 'mittel',
      updatedAt: new Date(),
    }

    console.log('6. Speichere Daten...')
    let result
    if (existing) {
      result = await (prisma as any).versicherungsCheck.update({
        where: { id: existing.id },
        data,
      })
      console.log('✅ Eintrag aktualisiert, ID:', result.id)
    } else {
      result = await (prisma as any).versicherungsCheck.create({
        data: {
          ...data,
          createdAt: new Date(),
        },
      })
      console.log('✅ Neuer Eintrag erstellt, ID:', result.id)
    }

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('❌ ERROR in Versicherungs-Check POST:', err)
    console.error('Error name:', err.name)
    console.error('Error message:', err.message)
    console.error('Error stack:', err.stack)

    // Spezifische Fehlerbehandlung
    if (
      err.message?.includes('does not exist') ||
      err.message?.includes('relation') ||
      err.message?.includes('table') ||
      err.message?.includes('Unknown table')
    ) {
      console.log('ℹ️ Tabelle existiert noch nicht')
      return NextResponse.json(
        { 
          message: 'Datenbank-Migration erforderlich. Bitte `npx prisma migrate dev` ausführen.',
          error: err.message 
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { 
        message: err.message || 'Unbekannter Fehler',
        error: err.name,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
      }, 
      { status: 500 }
    )
  }
}

