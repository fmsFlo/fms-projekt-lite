import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { CustomActivitiesSyncService } from '@/lib/custom-activities-sync'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = req.cookies.get('session')?.value
    if (!session || !session.includes(':')) {
      return NextResponse.json({ message: 'Nicht authentifiziert' }, { status: 401 })
    }
    
    const [role] = session.split(':')
    if (role !== 'admin') {
      return NextResponse.json({ message: 'Nur Administratoren können synchronisieren' }, { status: 403 })
    }

    const body = await req.json()
    const { daysBack = 90, useSSE = false } = body

    // Hole Close API Key aus den Einstellungen
    const settings = await prisma.companySettings.findFirst()
    const closeApiKey = settings?.closeApiKey || process.env.CLOSE_API_KEY || ''

    if (!closeApiKey) {
      return NextResponse.json({ 
        error: 'Close API Key ist nicht konfiguriert',
        note: 'Bitte konfigurieren Sie den Close API Key in den Einstellungen'
      }, { status: 500 })
    }

    console.log(`[Sync] Starte Custom Activities Sync für ${daysBack} Tage...`)

    const syncService = new CustomActivitiesSyncService(closeApiKey)
    
    // Progress Callback für SSE (wenn gewünscht)
    const progressMessages: string[] = []
    const progressCallback = (progress: any) => {
      let message = ''
      switch (progress.type) {
        case 'type_start':
          message = `📋 Starte ${progress.typeName}...`
          break
        case 'progress':
          message = `⏳ ${progress.typeName}: ${progress.current}/${progress.total} verarbeitet (${progress.synced} neu, ${progress.skipped} übersprungen)`
          break
        case 'type_complete':
          message = `✅ ${progress.typeName}: ${progress.synced} Activities synchronisiert (${progress.found} gefunden)`
          break
        case 'matching_start':
          message = `🔗 Starte Matching mit Calendly Events...`
          break
        case 'complete':
          message = `✅ Sync abgeschlossen: ${progress.synced} Activities synchronisiert, ${progress.matched} zu Events gematched`
          break
        case 'type_error':
          message = `❌ Fehler bei ${progress.typeName}: ${progress.error}`
          break
      }
      if (message) {
        progressMessages.push(message)
        console.log(`[Sync] ${message}`)
      }
    }

    // Führe Sync aus
    let result
    try {
      result = await syncService.syncAllCustomActivities(daysBack, progressCallback)
    } catch (syncError: any) {
      console.error('[Sync] Fehler beim Sync:', syncError)
      return NextResponse.json({ 
        error: syncError.message || 'Fehler beim Synchronisieren',
        progress: progressMessages,
        note: 'Bitte prüfen Sie die Logs für Details'
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      synced: result.synced,
      matched: result.matched,
      found: result.found,
      processed: result.processed,
      message: `✅ ${result.synced} Custom Activities synchronisiert, ${result.matched} zu Events gematched!`,
      progress: progressMessages
    })
  } catch (error: any) {
    console.error('Fehler bei /api/dashboard/custom-activities/sync:', error)
    return NextResponse.json({ 
      error: error.message,
      note: error.message.includes('CLOSE_API_KEY') 
        ? 'Bitte fügen Sie CLOSE_API_KEY zu Ihrer .env.local Datei hinzu'
        : 'Fehler beim Synchronisieren. Bitte prüfen Sie die Logs.'
    }, { status: 500 })
  }
}

