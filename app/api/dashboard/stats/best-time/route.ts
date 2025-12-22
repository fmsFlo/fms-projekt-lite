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
    
    // PostgreSQL verwendet EXTRACT statt strftime
    let query = `
      SELECT 
        EXTRACT(HOUR FROM "callDate")::INTEGER as hour,
        COUNT(*) as total_calls,
        SUM(CASE 
          WHEN status = 'completed' AND duration > 0 
          THEN 1 
          ELSE 0 
        END) as reached,
        CAST(SUM(CASE 
          WHEN status = 'completed' AND duration > 0 
          THEN 1 
          ELSE 0 
        END) AS FLOAT) / NULLIF(COUNT(*), 0) * 100 as success_rate
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
    
    query += ' GROUP BY EXTRACT(HOUR FROM "callDate") HAVING COUNT(*) >= 3 ORDER BY success_rate DESC, hour ASC'
    
    const results = await dbAll(query, params)
    return NextResponse.json(results)
  } catch (error: any) {
    console.error('Fehler bei /api/dashboard/stats/best-time:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}



