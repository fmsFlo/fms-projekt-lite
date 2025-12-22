import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { dbGet } from '@/lib/dashboard-db'

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
    
    let dateFilter = ''
    const params: any[] = []
    
    if (startDate) {
      dateFilter += ' AND "createdAt" >= ?'
      params.push(startDate)
    }
    
    if (endDate) {
      dateFilter += ' AND "createdAt" <= ?'
      params.push(endDate)
    }
    
    // 1. Leads erstellt
    const leadsQuery = `SELECT COUNT(DISTINCT id) as count FROM leads WHERE 1=1 ${dateFilter}`
    const leadsResult = await dbGet(leadsQuery, params)
    const leadsCreated = leadsResult?.count || 0
    
    // 2. Kontaktiert (mindestens 1 Call) - UNIQUE lead_ids
    let contactedParams = [...params]
    let contactedFilter = dateFilter.replace('"createdAt"', 'c."callDate"')
    if (userId) {
      contactedFilter += ' AND c."userId" = ?'
      contactedParams.push(userId)
    }
    const contactedQuery = `
      SELECT COUNT(DISTINCT c."leadId") as count
      FROM calls c
      WHERE c."leadId" IS NOT NULL 
        AND c.direction = 'outbound'
        ${contactedFilter}
    `
    const contactedResult = await dbGet(contactedQuery, contactedParams)
    const contacted = contactedResult?.count || 0
    
    // 3. Erreicht - UNIQUE lead_ids
    let reachedParams = [...contactedParams]
    const reachedQuery = `
      SELECT COUNT(DISTINCT c."leadId") as count
      FROM calls c
      WHERE c."leadId" IS NOT NULL 
        AND c.direction = 'outbound'
        AND (
          (c.status = 'completed' AND c.duration > 0)
          OR (
            c.disposition IS NOT NULL 
            AND c.disposition NOT IN ('Nicht erreicht', 'Mailbox', 'Falsche Nummer')
          )
        )
        ${contactedFilter}
    `
    const reachedResult = await dbGet(reachedQuery, reachedParams)
    const reached = reachedResult?.count || 0
    
    // 4. Termin vereinbart
    let meetingParams = [...contactedParams]
    const meetingQuery = `
      SELECT COUNT(DISTINCT c."leadId") as count
      FROM calls c
      WHERE c."leadId" IS NOT NULL 
        AND c.direction = 'outbound'
        AND c.disposition LIKE 'Termin vereinbart%' 
        ${contactedFilter}
    `
    const meetingResult = await dbGet(meetingQuery, meetingParams)
    const meetingSet = meetingResult?.count || 0
    
    // 5. Durchschnittliche Versuche bis erreicht
    const avgAttemptsQuery = `
      WITH first_reached AS (
        SELECT 
          c."leadId" as lead_id,
          MIN(c."callDate") as first_reached_date
        FROM calls c
        WHERE c."leadId" IS NOT NULL 
          AND c.direction = 'outbound'
          AND (
            (c.status = 'completed' AND c.duration > 0)
            OR (
              c.disposition IS NOT NULL 
              AND c.disposition NOT IN ('Nicht erreicht', 'Mailbox', 'Falsche Nummer')
            )
          )
          ${contactedFilter}
        GROUP BY c."leadId"
      ),
      lead_attempts AS (
        SELECT 
          c."leadId" as lead_id,
          COUNT(*) as attempts_to_reach
        FROM calls c
        INNER JOIN first_reached fr ON c."leadId" = fr.lead_id
        WHERE c.direction = 'outbound'
          AND c."callDate" <= fr.first_reached_date 
          ${contactedFilter}
        GROUP BY c."leadId"
      )
      SELECT AVG(attempts_to_reach) as avg_attempts
      FROM lead_attempts
    `
    const avgAttemptsResult = await dbGet(avgAttemptsQuery, contactedParams)
    const avgAttemptsToReach = avgAttemptsResult?.avg_attempts 
      ? Math.round(avgAttemptsResult.avg_attempts * 10) / 10 
      : 0
    
    // 6. Terminquote
    const meetingRate = reached > 0 
      ? Math.round((Math.min(meetingSet, reached) / reached) * 100) 
      : (contacted > 0 ? Math.round((meetingSet / contacted) * 100) : 0)
    
    return NextResponse.json({
      leadsCreated,
      contacted,
      reached,
      meetingSet,
      avgAttemptsToReach,
      meetingRate
    })
  } catch (error: any) {
    console.error('Fehler bei /api/dashboard/stats/funnel:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}



