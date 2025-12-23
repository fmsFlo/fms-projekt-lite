import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CalendlySyncService } from '@/lib/calendly-sync'
import { OptimizedCalendlySyncService } from '@/lib/calendly-sync-optimized'
import { CallsSyncService } from '@/lib/calls-sync'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Erhöhe Timeout für lange Sync-Operationen
// Vercel: maxDuration in Sekunden (max 300 = 5 Minuten für Hobby, 900 = 15 Minuten für Pro)
// Netlify: Wird über netlify.toml konfiguriert
// WICHTIG: Für Edge Functions max 25 Sekunden, daher verwenden wir optimierte Version
export const maxDuration = 25 // 25 Sekunden für Edge Functions (kann auf 300 erhöht werden für Serverless)

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

      // Verwende optimierte Version mit Batch-Processing und Timeout-Handling
      // Max 25 Sekunden für Edge Functions, Batch-Size 50 Events
      const maxDurationMs = 25000 // 25 Sekunden
      const batchSize = 50 // Events pro Batch
      
      const syncService = new OptimizedCalendlySyncService(calendlyApiToken, maxDurationMs, batchSize)
      
      // Führe Sync aus mit Progress-Tracking
      let syncResult
      try {
        syncResult = await syncService.syncCalendlyEvents(daysBack, daysForward, (progress) => {
          console.log(`[Sync] Progress: ${progress.current}/${progress.total} (Batch ${progress.batch}/${progress.totalBatches})`)
        })
      } catch (syncError: any) {
        console.error('[Sync] Fehler beim Calendly Sync:', syncError)
        return NextResponse.json({ 
          error: syncError.message || 'Fehler beim Synchronisieren',
          note: 'Bitte prüfen Sie die Logs für Details'
        }, { status: 500 })
      }

      // Wenn Partial Sync, gib Warnung zurück
      if (syncResult.partial) {
        return NextResponse.json({ 
          success: true,
          partial: true,
          message: syncResult.message,
          syncedCount: syncResult.synced,
          total: syncResult.total,
          note: 'Sync wurde wegen Timeout abgebrochen. Bitte mit kleinerem Zeitraum wiederholen oder in mehreren Schritten synchronisieren.'
        }, { status: 206 }) // 206 Partial Content
      }

      return NextResponse.json({ 
        success: true, 
        message: syncResult.message,
        syncedCount: syncResult.synced,
        total: syncResult.total
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



