import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    // Session prüfen
    const session = req.cookies.get('session')?.value
    if (!session || !session.includes(':')) {
      return NextResponse.json({ message: 'Nicht authentifiziert' }, { status: 401 })
    }

    const [role] = session.split(':')
    if (role !== 'admin') {
      return NextResponse.json({ message: 'Nur Administratoren können Dashboards anzeigen' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)

    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const userId = searchParams.get('userId')
    const limit = Number(searchParams.get('limit') ?? 100)
    const offset = Number(searchParams.get('offset') ?? 0)

    // Prisma Query
    const calls = await prisma.calls.findMany({
      where: {
        ...(startDate && { call_date: { gte: new Date(startDate) } }),
        ...(endDate && { call_date: { lte: new Date(endDate) } }),
        ...(userId && { user_id: userId })
      },
      include: {
        user: true,
        lead: true
      },
      orderBy: {
        call_date: 'desc'
      },
      take: limit,
      skip: offset
    })

    return NextResponse.json(calls)

  } catch (error: any) {
    console.error("Fehler bei /api/dashboard/calls:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}




