import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { dbAll } from '@/lib/dashboard-db'

export const dynamic = 'force-dynamic'

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
    const userId = searchParams.get('userId')
    
    // WICHTIG: Nur eine Activity pro Lead und Activity-Type zählen (neueste)
    // Verwende Subquery um die neueste Activity pro Lead+Type zu finden
    let whereClause = 'WHERE ca.calendly_event_id IS NOT NULL'
    const params: any[] = []
    
    if (startDate) {
      whereClause += ' AND DATE(ce.start_time) >= ?'
      params.push(startDate)
    }
    
    if (endDate) {
      whereClause += ' AND DATE(ce.start_time) <= ?'
      params.push(endDate)
    }
    
    if (userId) {
      whereClause += ' AND ce.user_id = ?'
      params.push(userId)
    }
    
    // Finde die neueste Activity pro Lead+Type und join nur diese
    let query = `
      SELECT 
        ce.id as event_id,
        ce.id,
        ce.event_type_name as event_name,
        ce.start_time,
        ce.user_id,
        COALESCE(u.name, ce.host_name) as host_name,
        ce.invitee_name,
        ce.invitee_email,
        ce.status as calendly_status,
        ca.activity_type,
        ca.result_value as actual_result,
        ca.date_created as activity_date,
        ca.match_confidence,
        ca.lead_email,
        ca.user_name
      FROM calendly_events ce
      INNER JOIN custom_activities ca ON ca.calendly_event_id = ce.id
      LEFT JOIN users u ON ce.user_id = u.id
      INNER JOIN (
        SELECT 
          lead_id,
          activity_type,
          MAX(date_created) as max_date
        FROM custom_activities
        WHERE calendly_event_id IS NOT NULL
        GROUP BY lead_id, activity_type
      ) latest ON ca.lead_id = latest.lead_id 
        AND ca.activity_type = latest.activity_type 
        AND ca.date_created = latest.max_date
      ${whereClause}
      ORDER BY ce.start_time DESC
      LIMIT 1000
    `
    
    const matches = await dbAll(query, params)
    return NextResponse.json(matches)
  } catch (error: any) {
    console.error('Fehler bei /api/dashboard/custom-activities/matched:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

