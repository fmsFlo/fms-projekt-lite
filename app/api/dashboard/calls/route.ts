import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { dbAll } from '@/lib/dashboard-db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    console.log('[Calls] API Request received')
    
    // Session prüfen
    const session = req.cookies.get('session')?.value
    if (!session || !session.includes(':')) {
      console.log('[Calls] ❌ Nicht authentifiziert')
      return NextResponse.json({ message: 'Nicht authentifiziert' }, { status: 401 })
    }

    const [role] = session.split(':')
    if (role !== 'admin') {
      console.log('[Calls] ❌ Keine Admin-Berechtigung')
      return NextResponse.json({ message: 'Nur Administratoren können Dashboards anzeigen' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)

    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const userId = searchParams.get('userId')
    const limit = Number(searchParams.get('limit') ?? 100)
    const offset = Number(searchParams.get('offset') ?? 0)

    console.log('[Calls] Query params:', { startDate, endDate, userId, limit, offset })

    // Verwende Raw Query da Prisma kein Call Model hat
    // WICHTIG: Spaltennamen sind camelCase (userId, callDate, leadId) - müssen in Anführungszeichen
    let whereClause = 'WHERE 1=1'
    const params: any[] = []
    
    if (startDate) {
      whereClause += ' AND c."callDate" >= CAST(? AS timestamp)'
      params.push(startDate)
    }
    
    if (endDate) {
      whereClause += ' AND c."callDate" <= CAST(? AS timestamp)'
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
    
    console.log('[Calls] Executing query:', query.substring(0, 200))
    console.log('[Calls] Query params:', params)
    
    const calls = await dbAll(query, params)
    
    console.log('[Calls] ✅ Found', calls?.length || 0, 'calls')
    
    return NextResponse.json(calls || [])

  } catch (error: any) {
    console.error("[Calls] ❌ Fehler bei /api/dashboard/calls:", error)
    console.error("[Calls] Error Stack:", error.stack)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}




