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
    const activityType = searchParams.get('activityType')
    
    // WICHTIG: Nur eine Activity pro Lead und Activity-Type zählen (neueste)
    // Verwende Subquery mit ROW_NUMBER() um Duplikate zu vermeiden
    // Prisma verwendet PascalCase für Spaltennamen
    let baseQuery = `
      SELECT 
        "activityType" as activity_type,
        "resultValue" as result_value,
        "leadId" as lead_id,
        "calendlyEventId" as calendly_event_id,
        "dateCreated" as date_created,
        ROW_NUMBER() OVER (PARTITION BY "leadId", "activityType" ORDER BY "dateCreated" DESC) as rn
      FROM custom_activities
      WHERE 1=1
    `
    
    const baseParams: any[] = []
    
    if (startDate) {
      baseQuery += ' AND DATE("dateCreated") >= ?'
      baseParams.push(startDate)
    }
    
    if (endDate) {
      baseQuery += ' AND DATE("dateCreated") <= ?'
      baseParams.push(endDate)
    }
    
    if (userId) {
      baseQuery += ' AND "userId" = ?'
      baseParams.push(userId)
    }
    
    if (activityType) {
      baseQuery += ' AND "activityType" = ?'
      baseParams.push(activityType)
    }
    
    // Nur die neueste Activity pro Lead+Type (rn = 1)
    // Verwende calendly_event_id aus dem Subquery (bereits als Alias)
    let query = `
      SELECT 
        activity_type,
        result_value,
        COUNT(*) as count,
        COUNT(calendly_event_id) as matched,
        COUNT(*) - COUNT(calendly_event_id) as unmatched
      FROM (
        ${baseQuery}
      ) ranked
      WHERE rn = 1
      GROUP BY activity_type, result_value
    `
    
    const results = await dbAll(query, baseParams)
    
    // Hole auch User-Informationen für byAdvisor (nur eine Activity pro Lead+Type)
    // Prisma verwendet PascalCase für Spaltennamen
    const activitiesWithUsersBaseQuery = `
      SELECT 
        ca."activityType" as activity_type,
        ca."resultValue" as result_value,
        ca."userId" as close_user_id,
        ca."leadId" as lead_id,
        ca."dateCreated" as date_created,
        ROW_NUMBER() OVER (PARTITION BY ca."leadId", ca."activityType" ORDER BY ca."dateCreated" DESC) as rn
      FROM custom_activities ca
      WHERE 1=1
      ${startDate ? ' AND DATE(ca."dateCreated") >= ?' : ''}
      ${endDate ? ' AND DATE(ca."dateCreated") <= ?' : ''}
      ${userId ? ' AND ca."userId" = ?' : ''}
      ${activityType ? ' AND ca."activityType" = ?' : ''}
    `
    
    const activitiesWithUsersParams: any[] = [
      ...(startDate ? [startDate] : []),
      ...(endDate ? [endDate] : []),
      ...(userId ? [userId] : []),
      ...(activityType ? [activityType] : [])
    ]
    
    const activitiesWithUsers = await dbAll(`
      SELECT 
        ranked.activity_type,
        ranked.result_value,
        ranked.close_user_id,
        u.id as user_id,
        u.name as user_name
      FROM (
        ${activitiesWithUsersBaseQuery}
      ) ranked
      LEFT JOIN "User" u ON ranked.close_user_id = u."closeUserId"
      WHERE ranked.rn = 1
    `, activitiesWithUsersParams)
    
    // Aggregiere pro Type
    const byType: Record<string, any> = {}
    results.forEach((row: any) => {
      if (!byType[row.activity_type]) {
        byType[row.activity_type] = {
          total: 0,
          matched: 0,
          unmatched: 0,
          results: {}
        }
      }
      
      byType[row.activity_type].total += row.count
      byType[row.activity_type].matched += row.matched
      byType[row.activity_type].unmatched += row.unmatched
      byType[row.activity_type].results[row.result_value || 'Nicht ausgefüllt'] = row.count
    })
    
    // Aggregiere pro Advisor (Key ist user_id aus DB)
    const byAdvisor: Record<string, any> = {}
    activitiesWithUsers.forEach((row: any) => {
      // Verwende user_id als Key (DB User ID, nicht Close User ID)
      const advisorKey = row.user_id || 'unbekannt'
      const advisorName = row.user_name || 'Unbekannt'
      
      if (!byAdvisor[advisorKey]) {
        byAdvisor[advisorKey] = {
          user_id: row.user_id,
          advisor: advisorName,
          total: 0,
          results: {}
        }
      }
      
      byAdvisor[advisorKey].total++
      const resultKey = row.result_value || 'Nicht ausgefüllt'
      byAdvisor[advisorKey].results[resultKey] = (byAdvisor[advisorKey].results[resultKey] || 0) + 1
    })
    
    // Aggregiere pro Result (gesamt)
    const byResult: Record<string, number> = {}
    results.forEach((row: any) => {
      const resultKey = row.result_value || 'Nicht ausgefüllt'
      byResult[resultKey] = (byResult[resultKey] || 0) + row.count
    })
    
    return NextResponse.json({
      total: results.reduce((sum: number, row: any) => sum + row.count, 0),
      byType,
      byResult,
      byAdvisor
    })
  } catch (error: any) {
    console.error('Fehler bei /api/dashboard/custom-activities/stats:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

