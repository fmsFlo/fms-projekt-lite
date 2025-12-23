import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { CalendlySyncService } from '@/lib/calendly-sync'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Erhöhe Timeout für lange Sync-Operationen
export const maxDuration = 300 // 5 Minuten

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
    const { daysBack = 365, daysForward = 90 } = body

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
  } catch (error: any) {
    console.error('Fehler bei /api/dashboard/calendly/sync:', error)
    return NextResponse.json({ 
      error: error.message,
      note: error.message.includes('CALENDLY_API_TOKEN') 
        ? 'Bitte fügen Sie CALENDLY_API_TOKEN zu Ihrer .env.local Datei hinzu oder konfigurieren Sie es in den Einstellungen'
        : 'Fehler beim Synchronisieren. Bitte prüfen Sie die Logs.'
    }, { status: 500 })
  }
}



