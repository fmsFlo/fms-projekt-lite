import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { dbAll } from '@/lib/dashboard-db'

// Activity Type Konfiguration (muss mit Backend übereinstimmen)
const ACTIVITY_TYPES: Record<string, { id: string, dbType: string, resultField: string }> = {
  vorqualifizierung: {
    id: 'actitype_1H3wPemMNkfkmT0nJuEBUT',
    dbType: 'vorqualifizierung',
    resultField: 'cf_xnH96817ih93fVQRG75NuqlCTJCNTkJ0OHCuup2iPLg'
  },
  erstgespraech: {
    id: 'actitype_6VB2MiuFziQxyuzfMzHy7q',
    dbType: 'erstgespraech',
    resultField: 'cf_QDWQYVNx3jMp1Pv0SIvzeoDigjMulHFh5qJQwWcesGZ'
  },
  konzeptgespraech: {
    id: 'actitype_6ftbHtxSEz9wIwdLnovYP0',
    dbType: 'konzeptgespraech',
    resultField: 'cf_XqpdiUMWiYCaw5uW9DRkSiXlOgBrdZtdEf2L8XmjNhT'
  },
  umsetzungsgespraech: {
    id: 'actitype_6nwTHKNbqf3EbQIjORgPg5',
    dbType: 'umsetzungsgespraech',
    resultField: 'cf_bd4BlLaCpH6uyfldREh1t9MAv7OCRcrZ5CxzJbpUIJf'
  },
  servicegespraech: {
    id: 'actitype_7dOp29fi26OKZQeXd9bCYP',
    dbType: 'servicegespraech',
    resultField: 'cf_PZvw6SxG2UlSSQNQeDmu63gdMTDP24JG6kfxWB8RXH4'
  }
}

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
    const activityType = searchParams.get('activityType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const userId = searchParams.get('userId')
    const useCache = searchParams.get('useCache') !== 'false'

    if (!activityType || !ACTIVITY_TYPES[activityType]) {
      return NextResponse.json({ 
        error: 'Ungültiger activityType. Mögliche Werte: ' + Object.keys(ACTIVITY_TYPES).join(', ')
      }, { status: 400 })
    }

    const typeConfig = ACTIVITY_TYPES[activityType]

    if (useCache) {
      // Lese aus lokaler DB
      let whereClause = 'WHERE activity_type = ?'
      const params: any[] = [typeConfig.dbType]

      if (startDate) {
        whereClause += ' AND date_created >= ?'
        params.push(startDate)
      }
      if (endDate) {
        whereClause += ' AND date_created <= ?'
        params.push(endDate)
      }

      // Performance: Für letzte 30/90 Tage schnell, alles darüber langsamer
      const daysDiff = startDate ? Math.floor((new Date().getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) : 0
      const limitClause = daysDiff <= 90 ? '' : 'LIMIT 10000' // Max 10000 für ältere Daten
      
      // WICHTIG: Nur eine Activity pro Lead und Activity-Type zählen (neueste)
      const dbActivities = await dbAll(`
        SELECT 
          ranked.*,
          l.close_lead_id,
          COALESCE(ranked.lead_email, l.email) as lead_email,
          u.name as user_name,
          ranked.result_value
        FROM (
          SELECT 
            ca.*,
            ROW_NUMBER() OVER (PARTITION BY ca.lead_id, ca.activity_type ORDER BY ca.date_created DESC) as rn
          FROM custom_activities ca
          ${whereClause}
        ) ranked
        LEFT JOIN leads l ON ranked.lead_id = l.close_lead_id OR CAST(ranked.lead_id AS INTEGER) = l.id
        LEFT JOIN users u ON ranked.user_id = u.close_user_id
        WHERE ranked.rn = 1
        ORDER BY ranked.date_created DESC
        ${limitClause}
      `, params)

      // Parse für Frontend
      const parsedActivities = dbActivities.map((activity: any) => {
        const result = activity.result_value || 'Nicht ausgefüllt'
        return {
          id: activity.close_activity_id,
          type: activityType,
          result: result,
          user_id: activity.user_id, // Close User ID
          user_email: activity.user_email,
          lead_id: activity.lead_close_id || activity.close_lead_id || activity.lead_id, // Close Lead ID
          lead_db_id: activity.lead_id, // DB Lead ID (für Matching)
          lead: {
            id: activity.lead_close_id || activity.close_lead_id || activity.lead_id,
            email: activity.lead_email
          },
          date_created: activity.date_created || activity.created_at,
          activity_date: activity.date_created, // Alias für Kompatibilität
          created: activity.date_created,
          activity_at: activity.date_created
        }
      })

      // Filtere nach userId falls angegeben
      let filtered = parsedActivities
      if (userId) {
        filtered = parsedActivities.filter((a: any) => a.user_id === parseInt(userId))
      }

      return NextResponse.json({
        activityType,
        total: filtered.length,
        activities: filtered,
        source: 'database',
        debug: {
          dbType: typeConfig.dbType,
          dbActivitiesCount: dbActivities.length,
          filteredCount: filtered.length
        }
      })
    } else {
      // Fallback: Direkt von Close API (wenn useCache=false)
      // Für jetzt: Return empty, da wir Close API nicht direkt aufrufen können
      return NextResponse.json({
        activityType,
        total: 0,
        activities: [],
        source: 'api',
        message: 'Direct API calls not implemented yet'
      })
    }
  } catch (error: any) {
    console.error('Fehler bei /api/dashboard/custom-activities/by-type:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

