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
    
    let query = `
      SELECT COUNT(*) as count
      FROM calls
      WHERE user_id IN (SELECT id FROM users WHERE close_user_id = 'UNKNOWN_USER')
    `
    
    const params: any[] = []
    
    if (startDate) {
      query += ' AND call_date >= ?'
      params.push(startDate)
    }
    
    if (endDate) {
      query += ' AND call_date <= ?'
      params.push(endDate)
    }
    
    const result = await dbGet(query, params)
    return NextResponse.json({ unassignedCalls: result?.count || 0 })
  } catch (error: any) {
    console.error('Fehler bei /api/dashboard/stats/unassigned:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}



