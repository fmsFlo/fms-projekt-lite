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
    
    let whereClause = 'WHERE 1=1'
    const params: any[] = []
    
    if (startDate) {
      whereClause += ' AND start_time >= ?'
      params.push(startDate)
    }
    
    if (endDate) {
      whereClause += ' AND start_time <= ?'
      params.push(endDate)
    }
    
    if (userId) {
      whereClause += ' AND user_id = ?'
      params.push(userId)
    }
    
    const query = `
      SELECT 
        COALESCE(u.name, ce.host_name, 'Unbekannt') as host_name,
        ce.user_id,
        COUNT(*) as totalEvents,
        SUM(CASE WHEN ce.status = 'active' THEN 1 ELSE 0 END) as activeEvents,
        SUM(CASE WHEN ce.status = 'canceled' THEN 1 ELSE 0 END) as canceledEvents,
        COUNT(DISTINCT ce.invitee_email) as uniqueClients,
        CAST(SUM(CASE WHEN ce.status = 'canceled' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100 as cancelRate
      FROM calendly_events ce
      LEFT JOIN users u ON ce.user_id = u.id
      ${whereClause}
      GROUP BY ce.user_id, ce.host_name, u.name
      HAVING COUNT(*) > 0
      ORDER BY totalEvents DESC
    `
    
    const results = await dbAll(query, params)
    
    // Formatiere Ergebnisse
    const hostStats = results.map((row: any) => ({
      hostName: row.host_name,
      userId: row.user_id,
      totalEvents: row.totalEvents || 0,
      activeEvents: row.activeEvents || 0,
      canceledEvents: row.canceledEvents || 0,
      uniqueClients: row.uniqueClients || 0,
      cancelRate: row.cancelRate ? Math.round(row.cancelRate * 10) / 10 : 0
    }))
    
    return NextResponse.json(hostStats)
  } catch (error: any) {
    console.error('Fehler bei /api/dashboard/calendly/host-stats:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}



