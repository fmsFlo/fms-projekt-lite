import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // Prüfe Session
    const session = req.cookies.get('session')?.value
    if (!session || !session.includes(':')) {
      return NextResponse.json({ message: 'Nicht authentifiziert' }, { status: 401 })
    }
    
    const [role] = session.split(':')
    if (role !== 'admin') {
      return NextResponse.json({ message: 'Nur Administratoren können synchronisieren' }, { status: 403 })
    }

    const body = await req.json()
    const { daysBack = 365 } = body

    // TODO: Implementiere Calendly-Sync-Logik
    // Für jetzt: Mock-Response
    // In Zukunft: Rufe die Calendly-Sync-Services aus dem fms-dashboard-master Backend auf
    
    return NextResponse.json({ 
      success: true, 
      message: `Calendly-Synchronisation gestartet für ${daysBack} Tage`,
      syncedCount: 0,
      note: 'Die vollständige Sync-Funktionalität muss noch implementiert werden. Sie können die Sync-Skripte aus dem fms-dashboard-master Backend verwenden.'
    })
  } catch (error: any) {
    console.error('Fehler bei /api/dashboard/calendly/sync:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}



