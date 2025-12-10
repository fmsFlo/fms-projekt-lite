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
    let baseQuery = `
      SELECT 
        activity_type,
        result_value,
        lead_id,
        calendly_event_id,
        date_created,
        ROW_NUMBER() OVER (PARTITION BY lead_id, activity_type ORDER BY date_created DESC) as rn
      FROM custom_activities
      WHERE 1=1
    `
    
    const baseParams: any[] = []
    
    if (startDate) {
      baseQuery += ' AND DATE(date_created) >= ?'
      baseParams.push(startDate)
    }
    
    if (endDate) {
      baseQuery += ' AND DATE(date_created) <= ?'
      baseParams.push(endDate)
    }
    
    if (userId) {
      baseQuery += ' AND user_id = ?'
      baseParams.push(userId)
    }
    
    if (activityType) {
      baseQuery += ' AND activity_type = ?'
      baseParams.push(activityType)
    }
    
    // Nur die neueste Activity pro Lead+Type (rn = 1)
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
    const activitiesWithUsersBaseQuery = `
      SELECT 
        ca.activity_type,
        ca.result_value,
        ca.user_id as close_user_id,
        ca.lead_id,
        ca.date_created,
        ROW_NUMBER() OVER (PARTITION BY ca.lead_id, ca.activity_type ORDER BY ca.date_created DESC) as rn
      FROM custom_activities ca
      WHERE 1=1
      ${startDate ? ' AND DATE(ca.date_created) >= ?' : ''}
      ${endDate ? ' AND DATE(ca.date_created) <= ?' : ''}
      ${userId ? ' AND ca.user_id = ?' : ''}
      ${activityType ? ' AND ca.activity_type = ?' : ''}
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
      LEFT JOIN users u ON ranked.close_user_id = u.close_user_id
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

