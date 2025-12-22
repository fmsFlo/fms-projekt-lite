import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CalendlySyncService } from '@/lib/calendly-sync'
import { CallsSyncService } from '@/lib/calls-sync'

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

    let body: any = {}
    try {
      const text = await req.text()
      if (text) {
        body = JSON.parse(text)
      }
    } catch (e) {
      // Body ist leer oder kein JSON - verwende Defaults
      console.log('[Sync] Kein Body oder kein JSON, verwende Defaults')
    }
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
      
      // Führe Sync aus (ohne Timeout - darf länger dauern)
      let syncedCount
      try {
        syncedCount = await syncService.syncCalendlyEvents(daysBack, daysForward)
      } catch (syncError: any) {
        console.error('[Sync] Fehler beim Calendly Sync:', syncError)
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

    // Wenn type 'calls' ist, rufe Calls Sync auf
    if (type === 'calls') {
      // Hole Close API Token aus den Einstellungen
      const settings = await prisma.companySettings.findFirst()
      const closeApiKey = settings?.closeApiKey || process.env.CLOSE_API_KEY || ''

      if (!closeApiKey) {
        return NextResponse.json({ 
          error: 'Close API Key ist nicht konfiguriert',
          note: 'Bitte konfigurieren Sie den Close API Key in den Einstellungen oder als CLOSE_API_KEY Umgebungsvariable'
        }, { status: 500 })
      }

      console.log(`[Sync] Starte Calls Sync für ${daysBack} Tage zurück...`)

      const syncService = new CallsSyncService(closeApiKey)
      
      // Führe Sync aus (ohne Timeout - darf länger dauern)
      let syncResult
      try {
        console.log(`[Sync] Starte Calls Sync (kann länger dauern)...`)
        syncResult = await syncService.syncCalls(daysBack)
        console.log(`[Sync] Calls Sync abgeschlossen: ${syncResult.synced} neu, ${syncResult.skipped} aktualisiert`)
      } catch (syncError: any) {
        console.error('[Sync] Fehler beim Calls Sync:', syncError)
        console.error('[Sync] Error Stack:', syncError.stack)
        return NextResponse.json({ 
          error: syncError.message || 'Fehler beim Synchronisieren',
          note: 'Bitte prüfen Sie die Logs für Details'
        }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: `✅ ${syncResult.synced} neue Calls synchronisiert, ${syncResult.skipped} aktualisiert!`,
        synced: syncResult.synced,
        skipped: syncResult.skipped,
        total: syncResult.total
      })
    }

    // Fallback für andere Sync-Typen
    return NextResponse.json({ 
      success: true, 
      message: 'Synchronisation gestartet',
      note: `Sync-Typ "${type}" wird noch nicht unterstützt. Verfügbar: 'calendly', 'calls'`
    })
  } catch (error: any) {
    console.error('Fehler bei /api/dashboard/sync:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}



