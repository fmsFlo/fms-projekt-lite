import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { dbAll } from '@/lib/dashboard-db'

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
        COALESCE(disposition, 'Unknown') as outcome,
        COUNT(*) as count
      FROM calls
      WHERE 1=1
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
    
    if (userId) {
      query += ' AND user_id = ?'
      params.push(userId)
    }
    
    query += ' GROUP BY disposition ORDER BY count DESC'
    
    const results = await dbAll(query, params)
    return NextResponse.json(results)
  } catch (error: any) {
    console.error('Fehler bei /api/dashboard/stats/outcomes:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

