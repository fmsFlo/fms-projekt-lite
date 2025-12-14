import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Params {
  params: { id: string }
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const session = await getServerSession()
    if (!session || !session.userId) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Prüfe ob Client existiert und User Zugriff hat
    const client = await prisma.client.findUnique({
      where: { id: params.id },
    })

    if (!client) {
      return NextResponse.json({ message: 'Client nicht gefunden' }, { status: 404 })
    }

    const situation = await prisma.einnahmenAusgaben.findFirst({
      where: { clientId: params.id },
      orderBy: { updatedAt: 'desc' },
    })

    if (!situation) {
      return NextResponse.json(null)
    }

    // Parse JSON fields
    const result = {
      ...situation,
      persoenlicheDaten: situation.persoenlicheDaten
        ? JSON.parse(situation.persoenlicheDaten as string)
        : null,
      fixkosten: situation.fixkosten ? JSON.parse(situation.fixkosten as string) : [],
      variableKosten: situation.variableKosten ? JSON.parse(situation.variableKosten as string) : [],
    }

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('Error fetching Einnahmen-Ausgaben:', err)
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const session = await getServerSession()
    if (!session || !session.userId) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Prüfe ob Client existiert
    const client = await prisma.client.findUnique({
      where: { id: params.id },
    })

    if (!client) {
      return NextResponse.json({ message: 'Client nicht gefunden' }, { status: 404 })
    }

    const body = await req.json()
    const { persoenlicheDaten, fixkosten, variableKosten } = body

    // Finde oder erstelle Eintrag
    const existing = await prisma.einnahmenAusgaben.findFirst({
      where: { clientId: params.id },
    })

    const data = {
      clientId: params.id,
      beruf: persoenlicheDaten?.beruf || '',
      nettoEinkommen: persoenlicheDaten?.nettoEinkommen || 0,
      persoenlicheDaten: JSON.stringify(persoenlicheDaten || {}),
      fixkosten: JSON.stringify(fixkosten || []),
      variableKosten: JSON.stringify(variableKosten || []),
      updatedAt: new Date(),
    }

    if (existing) {
      const updated = await prisma.einnahmenAusgaben.update({
        where: { id: existing.id },
        data,
      })
      return NextResponse.json(updated)
    } else {
      const created = await prisma.einnahmenAusgaben.create({
        data: {
          ...data,
          createdAt: new Date(),
        },
      })
      return NextResponse.json(created)
    }
  } catch (err: any) {
    console.error('Error saving Einnahmen-Ausgaben:', err)
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

