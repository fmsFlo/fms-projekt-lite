import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { dbGet } from '@/lib/dashboard-db'
import { mapUserId } from '@/lib/dashboard-utils'

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
    const userIdParam = searchParams.get('userId')
    
    // Mappe Close User ID zu lokaler User ID
    const userId = await mapUserId(userIdParam)
    
    // 1. Leads erstellt - falls leads Tabelle existiert
    // WICHTIG: Spaltennamen sind camelCase (createdAt) - müssen in Anführungszeichen
    let leadsCreated = 0
    let leadsDateFilter = ''
    const leadsParams: any[] = []
    
    if (startDate) {
      leadsDateFilter += ' AND "createdAt" >= ?::timestamp'
      leadsParams.push(startDate)
    }
    
    if (endDate) {
      leadsDateFilter += ' AND "createdAt" <= ?::timestamp'
      leadsParams.push(endDate)
    }
    
    try {
      const leadsQuery = `SELECT COUNT(DISTINCT id) as count FROM leads WHERE 1=1 ${leadsDateFilter}`
      const leadsResult = await dbGet(leadsQuery, leadsParams)
      leadsCreated = leadsResult?.count || 0
    } catch (e: any) {
      // leads Tabelle existiert möglicherweise nicht - verwende 0
      console.log('[Funnel] leads Tabelle nicht verfügbar, verwende 0:', e.message)
    }
    
    // 2. Kontaktiert (mindestens 1 Call) - UNIQUE lead_ids
    let contactedParams: any[] = []
    let contactedFilter = ''
    
    if (startDate) {
      contactedFilter += ' AND c."callDate" >= ?::timestamp'
      contactedParams.push(startDate)
    }
    
    if (endDate) {
      contactedFilter += ' AND c."callDate" <= ?::timestamp'
      contactedParams.push(endDate)
    }
    
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
    
    // 3. Erreicht - UNIQUE lead_ids (eigene Parameter)
    let reachedParams: any[] = []
    let reachedFilter = ''
    
    if (startDate) {
      reachedFilter += ' AND c."callDate" >= ?::timestamp'
      reachedParams.push(startDate)
    }
    
    if (endDate) {
      reachedFilter += ' AND c."callDate" <= ?::timestamp'
      reachedParams.push(endDate)
    }
    
    if (userId) {
      reachedFilter += ' AND c."userId" = ?'
      reachedParams.push(userId)
    }
    
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
        ${reachedFilter}
    `
    const reachedResult = await dbGet(reachedQuery, reachedParams)
    const reached = reachedResult?.count || 0
    
    // 4. Termin vereinbart (eigene Parameter)
    let meetingParams: any[] = []
    let meetingFilter = ''
    
    if (startDate) {
      meetingFilter += ' AND c."callDate" >= ?::timestamp'
      meetingParams.push(startDate)
    }
    
    if (endDate) {
      meetingFilter += ' AND c."callDate" <= ?::timestamp'
      meetingParams.push(endDate)
    }
    
    if (userId) {
      meetingFilter += ' AND c."userId" = ?'
      meetingParams.push(userId)
    }
    
    const meetingQuery = `
      SELECT COUNT(DISTINCT c."leadId") as count
      FROM calls c
      WHERE c."leadId" IS NOT NULL 
        AND c.direction = 'outbound'
        AND c.disposition LIKE 'Termin vereinbart%' 
        ${meetingFilter}
    `
    const meetingResult = await dbGet(meetingQuery, meetingParams)
    const meetingSet = meetingResult?.count || 0
    
    // 5. Durchschnittliche Versuche bis erreicht (eigene Parameter)
    let avgAttemptsParams: any[] = []
    let avgAttemptsFilter = ''
    
    if (startDate) {
      avgAttemptsFilter += ' AND c."callDate" >= ?::timestamp'
      avgAttemptsParams.push(startDate)
    }
    
    if (endDate) {
      avgAttemptsFilter += ' AND c."callDate" <= ?::timestamp'
      avgAttemptsParams.push(endDate)
    }
    
    if (userId) {
      avgAttemptsFilter += ' AND c."userId" = ?'
      avgAttemptsParams.push(userId)
    }
    
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
          ${avgAttemptsFilter}
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
          ${avgAttemptsFilter}
        GROUP BY c."leadId"
      )
      SELECT AVG(attempts_to_reach) as avg_attempts
      FROM lead_attempts
    `
    // Parameter duplizieren, da avgAttemptsFilter zweimal in der Query verwendet wird
    // (einmal im "first_reached" CTE und einmal im "lead_attempts" CTE)
    const paramsForQuery = [...avgAttemptsParams, ...avgAttemptsParams]
    const avgAttemptsResult = await dbGet(avgAttemptsQuery, paramsForQuery)
    const avgAttemptsToReach = avgAttemptsResult?.avg_attempts 
      ? Math.round(avgAttemptsResult.avg_attempts * 10) / 10 
      : 0
    
    // 6. Terminquote
    const meetingRate = reached > 0 
      ? Math.round((Math.min(meetingSet, reached) / reached) * 100) 
      : (contacted > 0 ? Math.round((meetingSet / contacted) * 100) : 0)
    
    // Konvertiere BigInt zu Number für JSON Serialisierung
    return NextResponse.json({
      leadsCreated: Number(leadsCreated),
      contacted: Number(contacted),
      reached: Number(reached),
      meetingSet: Number(meetingSet),
      avgAttemptsToReach,
      meetingRate
    })
  } catch (error: any) {
    console.error('Fehler bei /api/dashboard/stats/funnel:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}



