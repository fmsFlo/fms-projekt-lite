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
    let whereClause = 'WHERE ca."calendlyEventId" IS NOT NULL'
    const params: any[] = []
    
    if (startDate) {
      whereClause += ' AND DATE(ce."startTime") >= ?'
      params.push(startDate)
    }
    
    if (endDate) {
      whereClause += ' AND DATE(ce."startTime") <= ?'
      params.push(endDate)
    }
    
    if (userId) {
      whereClause += ' AND ce."userId" = ?'
      params.push(userId)
    }
    
    // Finde die neueste Activity pro Lead+Type und join nur diese
    // Prisma verwendet PascalCase für Spaltennamen, snake_case für Tabellennamen (dank @@map)
    let query = `
      SELECT 
        ce.id as event_id,
        ce.id,
        ce."eventTypeName" as event_name,
        ce."startTime" as start_time,
        ce."userId" as user_id,
        COALESCE(u.name, ce."hostName") as host_name,
        ce."inviteeName" as invitee_name,
        ce."inviteeEmail" as invitee_email,
        ce.status as calendly_status,
        ca."activityType" as activity_type,
        ca."resultValue" as actual_result,
        ca."dateCreated" as activity_date,
        ca."matchConfidence" as match_confidence,
        ca."leadEmail" as lead_email,
        ca."userName" as user_name
      FROM calendly_events ce
      INNER JOIN custom_activities ca ON ca."calendlyEventId" = ce.id
      LEFT JOIN "User" u ON ce."userId" = u.id
      INNER JOIN (
        SELECT 
          "leadId" as lead_id,
          "activityType" as activity_type,
          MAX("dateCreated") as max_date
        FROM custom_activities
        WHERE "calendlyEventId" IS NOT NULL
        GROUP BY "leadId", "activityType"
      ) latest ON ca."leadId" = latest.lead_id 
        AND ca."activityType" = latest.activity_type 
        AND ca."dateCreated" = latest.max_date
      ${whereClause}
      ORDER BY ce."startTime" DESC
      LIMIT 1000
    `
    
    const matches = await dbAll(query, params)
    return NextResponse.json(matches)
  } catch (error: any) {
    console.error('Fehler bei /api/dashboard/custom-activities/matched:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

