import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { dbGet, dbAll } from '@/lib/dashboard-db'

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
    
    // Gesamt-Statistiken
    const totalStatsQuery = `
      SELECT 
        COUNT(*) as totalEvents,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeEvents,
        SUM(CASE WHEN status = 'canceled' THEN 1 ELSE 0 END) as canceledEvents,
        COUNT(DISTINCT invitee_email) as uniqueClients
      FROM calendly_events
      ${whereClause}
    `
    
    const totalStats = await dbGet(totalStatsQuery, params)
    
    // Event Types
    const eventTypesQuery = `
      SELECT 
        event_type_name as event_name,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'canceled' THEN 1 ELSE 0 END) as canceled
      FROM calendly_events
      ${whereClause}
      GROUP BY event_type_name
      ORDER BY count DESC
    `
    
    const eventTypes = await dbAll(eventTypesQuery, params)
    
    // Events pro Tag
    const eventsByDayQuery = `
      SELECT 
        DATE(start_time) as date,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'canceled' THEN 1 ELSE 0 END) as canceled
      FROM calendly_events
      ${whereClause}
      GROUP BY DATE(start_time)
      ORDER BY date DESC
      LIMIT 90
    `
    
    const eventsByDay = await dbAll(eventsByDayQuery, params)
    
    // Best Time (Stunde)
    const bestTimeQuery = `
      SELECT 
        CAST(strftime('%H', start_time) AS INTEGER) as hour,
        COUNT(*) as totalEvents,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active
      FROM calendly_events
      ${whereClause}
      GROUP BY hour
      HAVING totalEvents >= 2
      ORDER BY totalEvents DESC
    `
    
    const bestTime = await dbAll(bestTimeQuery, params)
    
    // Wochentag-Analyse
    const weekdayQuery = `
      SELECT 
        CASE CAST(strftime('%w', start_time) AS INTEGER)
          WHEN 0 THEN 'Sunday'
          WHEN 1 THEN 'Monday'
          WHEN 2 THEN 'Tuesday'
          WHEN 3 THEN 'Wednesday'
          WHEN 4 THEN 'Thursday'
          WHEN 5 THEN 'Friday'
          WHEN 6 THEN 'Saturday'
        END as weekday,
        COUNT(*) as count
      FROM calendly_events
      ${whereClause}
      GROUP BY strftime('%w', start_time)
      ORDER BY CAST(strftime('%w', start_time) AS INTEGER)
    `
    
    const weekdayStats = await dbAll(weekdayQuery, params)
    
    return NextResponse.json({
      totalEvents: totalStats?.totalEvents || 0,
      activeEvents: totalStats?.activeEvents || 0,
      canceledEvents: totalStats?.canceledEvents || 0,
      uniqueClients: totalStats?.uniqueClients || 0,
      cancelRate: totalStats?.totalEvents > 0 
        ? Math.round((totalStats.canceledEvents / totalStats.totalEvents) * 100 * 10) / 10 
        : 0,
      eventTypes,
      eventsByDay,
      bestTime,
      weekdayStats
    })
  } catch (error: any) {
    console.error('Fehler bei /api/dashboard/calendly/stats:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

