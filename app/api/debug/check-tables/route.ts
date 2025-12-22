import { NextResponse } from 'next/server'
import { dbGet, dbAll } from '@/lib/dashboard-db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Check if calls table exists
    const tableCheck = await dbGet(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'calls'
    `, [])
    
    console.log('[Debug] Table check:', tableCheck)
    
    if (!tableCheck) {
      return NextResponse.json({ 
        exists: false,
        message: 'calls table does not exist' 
      })
    }
    
    // Get columns
    const columns = await dbAll(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'calls'
      ORDER BY ordinal_position
    `, [])
    
    // Get count
    const count = await dbGet('SELECT COUNT(*) as count FROM calls', [])
    
    // Get sample data (first 3 rows)
    const sample = await dbAll('SELECT * FROM calls LIMIT 3', [])
    
    return NextResponse.json({
      exists: true,
      columns,
      rowCount: count?.count || 0,
      sample: sample || []
    })
  } catch (error: any) {
    console.error('[Debug] Error checking tables:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
      exists: false
    }, { status: 500 })
  }
}

