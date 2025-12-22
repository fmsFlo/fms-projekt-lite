import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { dbAll } from '@/lib/dashboard-db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

    // Verwende Raw Query da Prisma kein Call Model hat
    // WICHTIG: Spaltennamen sind camelCase (userId, callDate, leadId) - müssen in Anführungszeichen
    let whereClause = 'WHERE 1=1'
    const params: any[] = []
    
    if (startDate) {
      whereClause += ' AND c."callDate" >= ?::timestamp'
      params.push(startDate)
    }
    
    if (endDate) {
      whereClause += ' AND c."callDate" <= ?::timestamp'
      params.push(endDate)
    }
    
    if (userId) {
      whereClause += ' AND c."userId" = ?'
      params.push(userId)
    }
    
    const query = `
      SELECT 
        c.*,
        u.name as user_name,
        l.name as lead_name
      FROM calls c
      LEFT JOIN "User" u ON c."userId" = u.id
      LEFT JOIN leads l ON c."leadId" = l.id
      ${whereClause}
      ORDER BY c."callDate" DESC
      LIMIT ? OFFSET ?
    `
    
    params.push(limit, offset)
    const calls = await dbAll(query, params)

    return NextResponse.json(calls)

  } catch (error: any) {
    console.error("Fehler bei /api/dashboard/calls:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}




