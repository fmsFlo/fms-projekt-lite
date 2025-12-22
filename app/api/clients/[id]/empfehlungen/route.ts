import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Params {
  params: { id: string }
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const userId = getUserId(_req)
    if (!userId) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const client = await prisma.client.findUnique({
      where: { id: params.id },
    })

    if (!client) {
      return NextResponse.json({ message: 'Client nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob Model existiert
    if (!(prisma as any).empfehlungsCheck) {
      return NextResponse.json(null)
    }

    const check = await (prisma as any).empfehlungsCheck.findFirst({
      where: { clientId: params.id },
      orderBy: { updatedAt: 'desc' },
    })

    if (!check) {
      return NextResponse.json(null)
    }

    // Parse JSON fields
    let empfehlungen = []
    try {
      empfehlungen = check.empfehlungen ? JSON.parse(check.empfehlungen as string) : []
    } catch (parseError: any) {
      console.error('JSON Parse Fehler:', parseError.message)
      empfehlungen = []
    }

    const result = {
      ...check,
      empfehlungen,
    }

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('ERROR in Empfehlungen GET:', err)

    if (
      err.message?.includes('does not exist') ||
      err.message?.includes('relation') ||
      err.message?.includes('table') ||
      err.message?.includes('Unknown table')
    ) {
      return NextResponse.json(null)
    }

    return NextResponse.json(
      {
        message: err.message || 'Unbekannter Fehler',
        error: err.name,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      },
      { status: 500 }
    )
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const userId = getUserId(req)
    if (!userId) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const client = await prisma.client.findUnique({
      where: { id: params.id },
    })

    if (!client) {
      return NextResponse.json({ message: 'Client nicht gefunden' }, { status: 404 })
    }

    const body = await req.json()
    const {
      empfehlungen,
      gesamtEinsparungMonatlich = 0,
      gesamtEinsparungJaehrlich = 0,
      anzahlOptimierungen = 0,
    } = body

    // Prüfe ob Model existiert
    if (!(prisma as any).empfehlungsCheck) {
      console.log('⚠️ EmpfehlungsCheck Model nicht gefunden, verwende localStorage Fallback')
      // Fallback: Speichere in Response-Body für Client-seitiges localStorage
      return NextResponse.json({
        success: false,
        message: 'Datenbank-Model nicht verfügbar. Daten werden lokal gespeichert.',
        fallback: true,
        data: body,
      })
    }

    // Finde oder erstelle Eintrag
    const existing = await (prisma as any).empfehlungsCheck.findFirst({
      where: { clientId: params.id },
    })

    const data = {
      clientId: params.id,
      empfehlungen: JSON.stringify(empfehlungen || []),
      gesamtEinsparungMonatlich: gesamtEinsparungMonatlich || 0,
      gesamtEinsparungJaehrlich: gesamtEinsparungJaehrlich || 0,
      anzahlOptimierungen: anzahlOptimierungen || 0,
      updatedAt: new Date(),
    }

    let result
    if (existing) {
      result = await (prisma as any).empfehlungsCheck.update({
        where: { id: existing.id },
        data,
      })
    } else {
      result = await (prisma as any).empfehlungsCheck.create({
        data: {
          ...data,
          createdAt: new Date(),
        },
      })
    }

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('ERROR in Empfehlungen POST:', err)

    if (
      err.message?.includes('does not exist') ||
      err.message?.includes('relation') ||
      err.message?.includes('table') ||
      err.message?.includes('Unknown table')
    ) {
      return NextResponse.json(
        {
          message: 'Datenbank-Migration erforderlich. Bitte `npx prisma migrate dev` ausführen.',
          error: err.message,
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        message: err.message || 'Unbekannter Fehler',
        error: err.name,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      },
      { status: 500 }
    )
  }
}

