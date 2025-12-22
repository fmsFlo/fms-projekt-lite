import { NextResponse } from 'next/server'
import { dbGet, dbAll } from '@/lib/dashboard-db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Check if calls table exists
    const tables = await dbAll(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name LIKE '%call%'
    `, [])
    
    console.log('[Debug] Tables with "call":', tables)
    
    // Get columns from calls table (try different names)
    let columns
    try {
      columns = await dbAll(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'calls'
        ORDER BY ordinal_position
      `, [])
      console.log('[Debug] Found columns in "calls" table:', columns)
    } catch (e: any) {
      console.error('[Debug] calls table query failed:', e.message)
    }
    
    // Try Call (capitalized)
    if (!columns || columns.length === 0) {
      try {
        columns = await dbAll(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_schema = 'public'
          AND table_name = 'Call'
          ORDER BY ordinal_position
        `, [])
        console.log('[Debug] Found columns in "Call" table:', columns)
      } catch (e: any) {
        console.error('[Debug] Call table query failed:', e.message)
      }
    }
    
    // Try to get a sample row to see actual column names
    let sampleRow = null
    try {
      const sample = await dbAll('SELECT * FROM calls LIMIT 1', [])
      if (sample && sample.length > 0) {
        sampleRow = Object.keys(sample[0])
        console.log('[Debug] Sample row column names:', sampleRow)
      }
    } catch (e: any) {
      console.error('[Debug] Sample query failed:', e.message)
    }
    
    return NextResponse.json({
      tables,
      columns: columns || [],
      sampleColumnNames: sampleRow || [],
      note: 'Check these column names and update the dashboard queries accordingly. PostgreSQL converts unquoted identifiers to lowercase!'
    })
    
  } catch (error: any) {
    console.error('[Debug] Error:', error)
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}

