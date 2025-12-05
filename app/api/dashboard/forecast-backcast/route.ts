import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { dbAll } from '@/lib/dashboard-db'

export async function GET(req: NextRequest) {
  try {
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
    const forecastEndDate = searchParams.get('forecastEndDate')
    const userId = searchParams.get('userId')
    
    // Forecast: Zukünftige Calendly Events
    const forecastEnd = forecastEndDate || endDate || null
    let forecastWhereClause = "WHERE ce.start_time >= datetime('now') AND ce.status = 'active'"
    const forecastParams: any[] = []
    
    if (forecastEnd) {
      forecastWhereClause += ' AND ce.start_time <= ?'
      forecastParams.push(forecastEnd)
    }
    if (userId) {
      forecastWhereClause += ' AND ce.user_id = ?'
      forecastParams.push(parseInt(userId))
    }
    
    const forecastQuery = `
      SELECT 
        ce.*,
        COALESCE(u.name, ce.host_name) as host_name,
        l.close_lead_id,
        l.id as lead_db_id,
        o.value as opportunity_value,
        ce.event_type_name as event_name
      FROM calendly_events ce
      LEFT JOIN users u ON ce.user_id = u.id
      LEFT JOIN leads l ON ce.lead_id = l.id
      LEFT JOIN opportunities o ON o.lead_id = l.id AND o.status = 'open'
      ${forecastWhereClause}
      ORDER BY ce.start_time ASC
    `
    
    const forecastEvents = await dbAll(forecastQuery, forecastParams)
    
    // Backcast: Vergangene Calendly Events mit Custom Activities
    let backcastWhereClause = "WHERE ce.start_time < datetime('now')"
    const backcastParams: any[] = []
    
    if (startDate) {
      backcastWhereClause += ' AND ce.start_time >= ?'
      backcastParams.push(startDate)
    }
    if (endDate) {
      backcastWhereClause += ' AND ce.start_time <= ?'
      backcastParams.push(endDate)
    }
    if (userId) {
      backcastWhereClause += ' AND ce.user_id = ?'
      backcastParams.push(parseInt(userId))
    }
    
    const backcastQuery = `
      SELECT 
        ce.*,
        COALESCE(u.name, ce.host_name) as host_name,
        l.close_lead_id,
        l.id as lead_db_id,
        ca.result_value as ergebnis,
        ca.activity_type,
        ca.date_created as activity_date
      FROM calendly_events ce
      LEFT JOIN users u ON ce.user_id = u.id
      LEFT JOIN leads l ON ce.lead_id = l.id
      LEFT JOIN custom_activities ca ON (
        (ca.lead_id = l.close_lead_id OR ca.lead_id = CAST(l.id AS TEXT))
        AND ca.date_created >= datetime(ce.start_time, '-3 days')
        AND ca.date_created <= datetime(ce.start_time, '+3 days')
      )
      ${backcastWhereClause}
      ORDER BY ce.start_time DESC
    `
    
    const backcastEvents = await dbAll(backcastQuery, backcastParams)
    
    return NextResponse.json({
      forecast: forecastEvents,
      backcast: backcastEvents
    })
  } catch (error: any) {
    console.error('Fehler bei /api/dashboard/forecast-backcast:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

