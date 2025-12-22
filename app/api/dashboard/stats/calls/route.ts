import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { dbAll } from '@/lib/dashboard-db'

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
    const userId = searchParams.get('userId')
    const period = searchParams.get('period') || 'day'
    
    // PostgreSQL-spezifische GROUP BY
    let groupBy = "DATE(\"callDate\")"
    
    if (period === 'week') {
      groupBy = "TO_CHAR(\"callDate\", 'IYYY-IW')" // ISO Week
    } else if (period === 'month') {
      groupBy = "TO_CHAR(\"callDate\", 'YYYY-MM')"
    }
    
    let query = `
      SELECT 
        ${groupBy} as period,
        COUNT(*) as total_calls,
        SUM(CASE 
          WHEN status = 'completed' AND duration > 0 
          THEN 1 
          ELSE 0 
        END) as reached,
        SUM(CASE 
          WHEN status IN ('no_answer', 'busy', 'failed', 'canceled')
          OR (status = 'completed' AND duration = 0)
          THEN 1 
          ELSE 0 
        END) as not_reached
      FROM calls
      WHERE direction = 'outbound'
    `
    
    const params: any[] = []
    
    if (startDate) {
      query += ' AND "callDate" >= ?::timestamp'
      params.push(startDate)
    }
    
    if (endDate) {
      query += ' AND "callDate" <= ?::timestamp'
      params.push(endDate)
    }
    
    if (userId) {
      query += ' AND "userId" = ?'
      params.push(userId)
    }
    
    query += ` GROUP BY ${groupBy} ORDER BY period DESC LIMIT 100`
    
    const results = await dbAll(query, params)
    
    // Konvertiere BigInt zu Number für JSON Serialisierung
    const serializedResults = results.map((row: any) => ({
      ...row,
      total_calls: Number(row.total_calls),
      reached: Number(row.reached),
      not_reached: Number(row.not_reached)
    }))
    
    return NextResponse.json(serializedResults)
  } catch (error: any) {
    console.error('Fehler bei /api/dashboard/stats/calls:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}



