import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from "@/lib/dashboard-db";

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
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    let query = `
      SELECT c.*, u.name as user_name, l.name as lead_name
      FROM calls c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN leads l ON c.lead_id = l.id
      WHERE 1=1
    `
    
    const params: any[] = []
    
    if (startDate) {
      query += ' AND c.call_date >= ?'
      params.push(startDate)
    }
    
    if (endDate) {
      query += ' AND c.call_date <= ?'
      params.push(endDate)
    }
    
    if (userId) {
      query += ' AND c.user_id = ?'
      params.push(userId)
    }
    
    query += ' ORDER BY c.call_date DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)
    
    const calls = await dbAll(query, params)
    return NextResponse.json(calls)
  } catch (error: any) {
    console.error('Fehler bei /api/dashboard/calls:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}



