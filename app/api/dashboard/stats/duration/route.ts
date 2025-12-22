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
    
    let query = `
      SELECT 
        SUM(duration) as total_duration,
        AVG(duration) as avg_duration,
        COUNT(*) as total_calls,
        SUM(CASE WHEN disposition LIKE 'Termin vereinbart%' THEN duration ELSE 0 END) as appointment_duration,
        SUM(CASE WHEN disposition LIKE 'Termin vereinbart%' THEN 1 ELSE 0 END) as appointment_count
      FROM calls
      WHERE status = 'completed' AND duration > 0
    `
    
    const params: any[] = []
    
    if (startDate) {
      query += ' AND "callDate" >= ?::timestamp'
      params.push(startDate)
    }
    
    if (endDate) {
      query += ' AND "callDate" <= ?::timestamp'
      params.push(endDate)
    }
    
    if (userId) {
      query += ' AND "userId" = ?'
      params.push(userId)
    }
    
    const result = await dbGet(query, params)
    
    // Konvertiere BigInt zu Number für JSON Serialisierung
    const response = {
      total_duration: Number(result?.total_duration || 0),
      avg_duration: Math.round(Number(result?.avg_duration || 0)),
      total_calls: Number(result?.total_calls || 0),
      appointment_duration: Number(result?.appointment_duration || 0),
      appointment_count: Number(result?.appointment_count || 0),
      avg_per_appointment: result?.appointment_count > 0 
        ? Math.round(Number(result.appointment_duration) / Number(result.appointment_count)) 
        : 0
    }
    
    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Fehler bei /api/dashboard/stats/duration:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}



