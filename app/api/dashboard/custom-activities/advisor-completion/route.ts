import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { dbAll, dbGet } from '@/lib/dashboard-db'

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

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'startDate und endDate sind erforderlich' }, { status: 400 })
    }

    // 1. Hole Calendly Termine (geplant)
    // WICHTIG: Wenn userId angegeben, finde alle User mit demselben Namen (für Florian Hörning Problem)
    let userIdsToQuery: number[] = []
    if (userId) {
      const user = await dbGet('SELECT name FROM users WHERE id = ?', [userId])
      if (user?.name) {
        // Finde alle User mit demselben Namen
        const usersWithSameName = await dbAll('SELECT id FROM users WHERE name = ?', [user.name])
        userIdsToQuery = usersWithSameName.map((u: any) => u.id)
      } else {
        userIdsToQuery = [userId]
      }
    }
    
    let calendlyWhereClause = 'WHERE DATE(ce.start_time) BETWEEN ? AND ? AND ce.status = ?'
    const calendlyParams: any[] = [startDate, endDate, 'active']
    
    if (userId && userIdsToQuery.length > 0) {
      const placeholders = userIdsToQuery.map(() => '?').join(',')
      calendlyWhereClause += ` AND ce.user_id IN (${placeholders})`
      calendlyParams.push(...userIdsToQuery)
    }
    
    const calendlyEvents = await dbAll(`
      SELECT 
        ce.user_id,
        u.name as host_name,
        ce.event_type_name as event_name,
        COUNT(*) as planned_appointments
      FROM calendly_events ce
      LEFT JOIN users u ON ce.user_id = u.id
      ${calendlyWhereClause}
      GROUP BY ce.user_id, u.name, ce.event_type_name
    `, calendlyParams)

    // 2. Hole Calendly Events im Zeitraum für Activities-Matching
    let calendlyEventsForActivities: any[] = []
    if (!userId) {
      calendlyEventsForActivities = await dbAll(`
        SELECT id, user_id, start_time
        FROM calendly_events
        WHERE DATE(start_time) BETWEEN ? AND ? AND status = 'active'
      `, [startDate, endDate])
    } else {
      // Verwende userIdsToQuery wenn vorhanden (für mehrere User mit gleichem Namen)
      const userIds = userIdsToQuery.length > 0 ? userIdsToQuery : [userId]
      const placeholders = userIds.map(() => '?').join(',')
      calendlyEventsForActivities = await dbAll(`
        SELECT id, user_id, start_time
        FROM calendly_events
        WHERE DATE(start_time) BETWEEN ? AND ? AND status = 'active' AND user_id IN (${placeholders})
      `, [startDate, endDate, ...userIds])
    }
    
    const calendlyEventIds = calendlyEventsForActivities.map(e => e.id)
    
    // 3. Hole ALLE Custom Activities im Zeitraum (nicht nur gematched)
    let activitiesWhereClause = 'WHERE DATE(date_created) BETWEEN ? AND ?'
    const activitiesParams: any[] = [startDate, endDate]
    
    if (userId) {
      const user = await dbGet('SELECT close_user_id FROM users WHERE id = ?', [userId])
      if (user?.close_user_id) {
        activitiesWhereClause += ' AND user_id = ?'
        activitiesParams.push(user.close_user_id)
      } else {
        activitiesWhereClause += ' AND 1=0'
      }
    }
    
    // WICHTIG: Nur eine Activity pro Lead und Activity-Type zählen (neueste)
    // Verwende ROW_NUMBER() um Duplikate zu vermeiden
    const dbActivities = await dbAll(`
      SELECT 
        user_id as close_user_id,
        activity_type,
        result_value as ergebnis,
        date_created,
        lead_id,
        close_activity_id,
        calendly_event_id
      FROM (
        SELECT 
          user_id,
          activity_type,
          result_value,
          date_created,
          lead_id,
          close_activity_id,
          calendly_event_id,
          ROW_NUMBER() OVER (PARTITION BY lead_id, activity_type ORDER BY date_created DESC) as rn
        FROM custom_activities
        ${activitiesWhereClause}
      ) ranked
      WHERE rn = 1
    `, activitiesParams)
    
    // 4. Hole User-Mapping
    const users = await dbAll(`
      SELECT id, close_user_id, name
      FROM users
      WHERE close_user_id IS NOT NULL
    `)

    // 5. Erstelle Mapping: Calendly Event ID -> User ID
    const eventToUserMap: Record<string, any> = {}
    calendlyEventsForActivities.forEach(e => {
      if (e.id) {
        eventToUserMap[e.id] = e.user_id
      }
    })
    
    // 6. Merge: Termine vs. Activities
    // WICHTIG: Gruppiere nach Name statt user_id (für mehrere User mit gleichem Namen)
    const userStats: Record<string, any> = {}
    
    // Zähle geplante Termine pro User (gruppiert nach Name)
    calendlyEvents.forEach((event: any) => {
      const advisorName = event.host_name || 'Unbekannt'
      const key = advisorName // Verwende Name als Key statt user_id
      
      if (!userStats[key]) {
        // Finde den primären User (ID 1 für Florian, oder ersten gefundenen)
        const primaryUser = users.find((u: any) => u.name === advisorName && u.id === 1) 
          || users.find((u: any) => u.name === advisorName)
          || users.find((u: any) => u.id === event.user_id)
        
        userStats[key] = {
          advisor: advisorName,
          user_id: primaryUser?.id || event.user_id,
          close_user_id: primaryUser?.close_user_id,
          planned: 0,
          completed: 0,
          all_user_ids: new Set<number>() // Sammle alle user_ids für diesen Namen
        }
      }
      userStats[key].planned += event.planned_appointments || 0
      if (event.user_id) {
        userStats[key].all_user_ids.add(event.user_id)
      }
    })
    
    // Zähle dokumentierte Activities pro User (gruppiert nach Name)
    dbActivities.forEach((activity: any) => {
      // Finde User über close_user_id
      const matchedUser = users.find((u: any) => u.close_user_id === activity.close_user_id)
      if (!matchedUser) return
      
      const advisorName = matchedUser.name || 'Unbekannt'
      const key = advisorName // Verwende Name als Key
      
      // Versuche 1: Über Calendly Event ID (für Matching)
      if (activity.calendly_event_id && eventToUserMap[activity.calendly_event_id]) {
        const eventUserId = eventToUserMap[activity.calendly_event_id]
        // Finde den Advisor-Namen für diesen Event-User
        const eventUser = users.find((u: any) => u.id === eventUserId)
        if (eventUser && eventUser.name === advisorName) {
          // Passt zusammen, zähle es
          if (!userStats[key]) {
            userStats[key] = {
              advisor: advisorName,
              user_id: matchedUser.id,
              close_user_id: matchedUser.close_user_id,
              planned: 0,
              completed: 0,
              all_user_ids: new Set<number>()
            }
          }
          userStats[key].completed++
          return
        }
      }
      
      // Versuche 2: Direkt über Advisor-Name (für Activities ohne Calendly Event)
      if (!userStats[key]) {
        userStats[key] = {
          advisor: advisorName,
          user_id: matchedUser.id,
          close_user_id: matchedUser.close_user_id,
          planned: 0,
          completed: 0,
          all_user_ids: new Set<number>()
        }
      }
      userStats[key].completed++
    })
    
    // Konvertiere zu Array (bereits nach Name gruppiert)
    const result = Object.values(userStats).map((stats: any) => {
      const completionRate = stats.planned > 0 
        ? Math.round((stats.completed / stats.planned) * 100 * 10) / 10 
        : (stats.completed > 0 ? 100 : 0)
      
      return {
        advisor: stats.advisor,
        user_id: stats.user_id, // Primäre user_id (ID 1 für Florian)
        planned: stats.planned,
        completed: stats.completed,
        completionRate: completionRate,
        missing: Math.max(0, stats.planned - stats.completed)
      }
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Fehler bei /api/dashboard/custom-activities/advisor-completion:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

