import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CalendlySyncService } from '@/lib/calendly-sync'

export const dynamic = 'force-dynamic'

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
    const { type, daysBack = 365, daysForward = 90 } = body

    // Wenn type 'calendly' ist, rufe Calendly Sync auf
    if (type === 'calendly') {
      // Hole Calendly API Token aus den Einstellungen
      const settings = await prisma.companySettings.findFirst()
      const calendlyApiToken = settings?.calendlyApiToken || process.env.CALENDLY_API_TOKEN || ''

      if (!calendlyApiToken) {
        return NextResponse.json({ 
          error: 'Calendly API Token ist nicht konfiguriert',
          note: 'Bitte konfigurieren Sie den Calendly API Token in den Einstellungen oder als CALENDLY_API_TOKEN Umgebungsvariable'
        }, { status: 500 })
      }

      console.log(`[Sync] Starte Calendly Sync für ${daysBack} Tage zurück, ${daysForward} Tage voraus...`)

      const syncService = new CalendlySyncService(calendlyApiToken)
      
      // Führe Sync aus
      let syncedCount
      try {
        syncedCount = await syncService.syncCalendlyEvents(daysBack, daysForward)
      } catch (syncError: any) {
        console.error('[Sync] Fehler beim Sync:', syncError)
        return NextResponse.json({ 
          error: syncError.message || 'Fehler beim Synchronisieren',
          note: 'Bitte prüfen Sie die Logs für Details'
        }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: `✅ ${syncedCount} Calendly Events synchronisiert!`,
        syncedCount
      })
    }

    // Fallback für andere Sync-Typen
    return NextResponse.json({ 
      success: true, 
      message: 'Synchronisation gestartet',
      note: `Sync-Typ "${type}" wird noch nicht unterstützt.`
    })
  } catch (error: any) {
    console.error('Fehler bei /api/dashboard/sync:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}



