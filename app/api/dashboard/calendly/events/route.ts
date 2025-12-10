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
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam) : null // Kein Limit wenn nicht angegeben
    const offset = parseInt(searchParams.get('offset') || '0')
    
    let whereClause = 'WHERE 1=1'
    const params: any[] = []
    
    // Wenn startDate/endDate NICHT angegeben sind, lade ALLE Events (für Forecast)
    // Wenn angegeben, filtere nach Datum
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
    
    let query = `
      SELECT 
        ce.*,
        COALESCE(u.name, ce.host_name) as host_name
      FROM calendly_events ce
      LEFT JOIN users u ON ce.user_id = u.id
      ${whereClause}
      ORDER BY ce.start_time ASC
    `
    
    // Nur Limit hinzufügen wenn angegeben
    if (limit !== null) {
      query += ' LIMIT ? OFFSET ?'
      params.push(limit, offset)
    }
    
    const events = await dbAll(query, params)
    return NextResponse.json(events)
  } catch (error: any) {
    console.error('Fehler bei /api/dashboard/calendly/events:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

