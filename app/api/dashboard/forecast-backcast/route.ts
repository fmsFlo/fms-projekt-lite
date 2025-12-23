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
    const forecastEndDate = searchParams.get('forecastEndDate')
    const userId = searchParams.get('userId')
    
    // Forecast: Zukünftige Calendly Events
    // Prisma verwendet PascalCase für Spaltennamen
    const forecastEnd = forecastEndDate || endDate || null
    let forecastWhereClause = "WHERE ce.\"startTime\" >= NOW() AND ce.status = 'active'"
    const forecastParams: any[] = []
    
    if (forecastEnd) {
      forecastWhereClause += ' AND ce."startTime" <= ?'
      forecastParams.push(forecastEnd)
    }
    if (userId) {
      forecastWhereClause += ' AND ce."userId" = ?'
      forecastParams.push(userId)
    }
    
    const forecastQuery = `
      SELECT 
        ce.*,
        COALESCE(u.name, ce."hostName") as host_name,
        l."crmId" as close_lead_id,
        l.id as lead_db_id,
        o."estimatedValue" as opportunity_value,
        ce."eventTypeName" as event_name
      FROM calendly_events ce
      LEFT JOIN "User" u ON ce."userId" = u.id
      LEFT JOIN "Lead" l ON ce."leadId" = l.id
      LEFT JOIN "Opportunity" o ON o."leadId" = l.id AND o."phaseId" IS NOT NULL
      ${forecastWhereClause}
      ORDER BY ce."startTime" ASC
    `
    
    const forecastEvents = await dbAll(forecastQuery, forecastParams)
    
    // Backcast: Vergangene Calendly Events mit Custom Activities
    // Prisma verwendet PascalCase für Spaltennamen
    let backcastWhereClause = "WHERE ce.\"startTime\" < NOW()"
    const backcastParams: any[] = []
    
    if (startDate) {
      backcastWhereClause += ' AND ce."startTime" >= ?'
      backcastParams.push(startDate)
    }
    if (endDate) {
      backcastWhereClause += ' AND ce."startTime" <= ?'
      backcastParams.push(endDate)
    }
    if (userId) {
      backcastWhereClause += ' AND ce."userId" = ?'
      backcastParams.push(userId)
    }
    
    const backcastQuery = `
      SELECT 
        ce.*,
        COALESCE(u.name, ce."hostName") as host_name,
        l."crmId" as close_lead_id,
        l.id as lead_db_id,
        ca."resultValue" as ergebnis,
        ca."activityType" as activity_type,
        ca."dateCreated" as activity_date
      FROM calendly_events ce
      LEFT JOIN "User" u ON ce."userId" = u.id
      LEFT JOIN "Lead" l ON ce."leadId" = l.id
      LEFT JOIN custom_activities ca ON (
        (ca."leadId" = l."crmId" OR ca."leadId" = l.id)
        AND ca."dateCreated" >= ce."startTime" - INTERVAL '3 days'
        AND ca."dateCreated" <= ce."startTime" + INTERVAL '3 days'
      )
      ${backcastWhereClause}
      ORDER BY ce."startTime" DESC
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



