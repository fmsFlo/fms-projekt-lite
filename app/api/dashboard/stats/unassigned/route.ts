import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { dbGet, dbAll } from '@/lib/dashboard-db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    // Prüfe Session
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
    
    console.log('[Unassigned] Query params:', { startDate, endDate })
    
    // Vereinfachte Query: Zähle alle Calls ohne zugeordneten User
    // WICHTIG: Spaltennamen sind camelCase (userId, callDate) - müssen in Anführungszeichen
    let query = 'SELECT COUNT(*) as count FROM calls WHERE "userId" IS NULL'
    const params: any[] = []
    
    if (startDate) {
      query += ' AND "callDate" >= ?::timestamp'
      params.push(startDate)
    }
    
    if (endDate) {
      query += ' AND "callDate" <= ?::timestamp'
      params.push(endDate)
    }
    
    console.log('[Unassigned] Final query:', query)
    console.log('[Unassigned] Final params:', params)
    
    const result = await dbGet(query, params)
    console.log('[Unassigned] Result:', result)
    
    // Konvertiere BigInt zu Number für JSON Serialisierung
    return NextResponse.json({ unassignedCalls: Number(result?.count || 0) })
  } catch (error: any) {
    console.error('[Unassigned] Fehler bei /api/dashboard/stats/unassigned:', error)
    console.error('[Unassigned] Error stack:', error.stack)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}



