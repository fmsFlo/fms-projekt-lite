import { prisma } from './prisma'
import { CalendlyService } from './calendly-sync'

// Optimierte Version mit Batch-Processing und Timeout-Handling
export class OptimizedCalendlySyncService {
  private calendly: CalendlyService
  private maxDuration: number // Max Dauer in Millisekunden
  private batchSize: number // Events pro Batch

  constructor(apiToken?: string, maxDurationMs = 25000, batchSize = 50) {
    this.calendly = new CalendlyService(apiToken)
    this.maxDuration = maxDurationMs
    this.batchSize = batchSize
  }

  // Optimierter Sync mit Batch-Processing und Timeout-Handling
  async syncCalendlyEvents(daysBack = 90, daysForward = 90, onProgress?: (progress: any) => void) {
    if (!this.calendly.isConfigured()) {
      console.log('⏭️  Calendly API nicht konfiguriert - überspringe Calendly Sync')
      return { synced: 0, partial: false, message: 'Nicht konfiguriert' }
    }

    const startTime = Date.now()
    let synced = 0
    let errors = 0
    let partial = false

    try {
      console.log('\n📅 Synchronisiere Calendly Events (optimiert)...')
      console.log(`  → Zeitraum: ${daysBack} Tage zurück, ${daysForward} Tage voraus`)
      console.log(`  → Batch-Size: ${this.batchSize}, Max-Duration: ${this.maxDuration}ms`)
      
      // Hole Events von Calendly (inkl. zukünftige Events)
      const events = await this.calendly.getAllEventsWithDetails(daysBack, daysForward)
      
      if (events.length === 0) {
        console.log('  → Keine Events gefunden')
        return { synced: 0, partial: false, message: 'Keine Events gefunden' }
      }

      console.log(`  → ${events.length} Events gefunden, verarbeite in Batches...`)

      // Verarbeite Events in Batches
      const batches = this.chunkArray(events, this.batchSize)
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]
        
        // Prüfe Timeout
        const elapsed = Date.now() - startTime
        if (elapsed > this.maxDuration) {
          console.log(`  ⚠️  Timeout erreicht nach ${elapsed}ms, stoppe bei Batch ${i + 1}/${batches.length}`)
          partial = true
          break
        }

        // Verarbeite Batch
        const batchResult = await this.processBatch(batch, i + 1, batches.length)
        synced += batchResult.synced
        errors += batchResult.errors

        // Progress-Callback
        if (onProgress) {
          onProgress({
            type: 'progress',
            current: synced,
            total: events.length,
            batch: i + 1,
            totalBatches: batches.length,
            elapsed: Date.now() - startTime
          })
        }

        // Kurze Pause zwischen Batches
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      // Entferne gelöschte Events nur wenn vollständiger Sync
      if (!partial) {
        console.log('  → Prüfe auf gelöschte Events...')
        const syncedEventUris = new Set(events.map((e: any) => e.uri))
        const deletedCount = await this.removeDeletedEvents(syncedEventUris, daysBack, daysForward)
        console.log(`  → ${deletedCount} gelöschte Events entfernt`)
      }

      const message = partial 
        ? `⚠️  Teilweise synchronisiert: ${synced}/${events.length} Events (Timeout nach ${Math.round((Date.now() - startTime) / 1000)}s)`
        : `✅ ${synced} Calendly Events synchronisiert`

      console.log(`  ${message}, ${errors} Fehler`)
      
      return {
        synced,
        partial,
        total: events.length,
        errors,
        message,
        elapsed: Date.now() - startTime
      }
    } catch (error: any) {
      console.error('❌ Fehler beim Calendly Sync:', error)
      throw error
    }
  }

  // Verarbeite einen Batch von Events mit Transaction
  private async processBatch(events: any[], batchNumber: number, totalBatches: number) {
    let synced = 0
    let errors = 0

    try {
      // Verwende Transaction für Batch-Insert
      await prisma.$transaction(async (tx) => {
        const operations = []

        for (const event of events) {
          try {
            const eventData = await this.prepareEventData(event)
            
            operations.push(
              tx.calendlyEvent.upsert({
                where: { calendlyEventUri: event.uri },
                update: eventData,
                create: {
                  id: `cal_${event.uri.split('/').pop()}`,
                  calendlyEventUri: event.uri,
                  ...eventData
                }
              })
            )
          } catch (error: any) {
            console.error(`  ✗ Fehler bei Event ${event.uri?.split('/').pop()}:`, error.message)
            errors++
          }
        }

        // Führe alle Operations parallel aus
        await Promise.all(operations)
        synced = operations.length
      }, {
        timeout: 20000, // 20 Sekunden Timeout für Transaction
        isolationLevel: 'ReadCommitted'
      })

      if (synced > 0) {
        console.log(`  → Batch ${batchNumber}/${totalBatches}: ${synced} Events gespeichert`)
      }
    } catch (error: any) {
      console.error(`  ✗ Fehler bei Batch ${batchNumber}:`, error.message)
      // Fallback: Einzelne Inserts
      for (const event of events) {
        try {
          await this.saveCalendlyEvent(event)
          synced++
        } catch (e: any) {
          errors++
        }
      }
    }

    return { synced, errors }
  }

  // Bereite Event-Daten vor
  private async prepareEventData(event: any) {
    const invitee = event.invitees?.[0]
    let leadId: string | null = null
    
    if (invitee?.email) {
      const lead = await prisma.lead.findFirst({
        where: { email: { equals: invitee.email, mode: 'insensitive' } },
        select: { id: true }
      })
      leadId = lead?.id || null
    }

    const startTime = new Date(event.start_time)
    const endTime = new Date(event.end_time)
    const eventName = event.name || 
                     event.event_type?.name || 
                     event.event_type_name || 
                     'Unbekannt'
    const mappedType = this.calendly.mapEventTypeToAppointmentType(eventName)
    const status = event.status || 'active'
    const dbStatus = status === 'canceled' ? 'canceled' : 'active'

    return {
      eventTypeName: eventName,
      mappedType,
      startTime,
      endTime,
      status: dbStatus,
      hostName: event.host_name,
      hostEmail: event.host_email,
      inviteeName: invitee?.name || null,
      inviteeEmail: invitee?.email || null,
      leadId,
      syncedAt: new Date()
    }
  }

  // Fallback: Einzelnes Event speichern
  private async saveCalendlyEvent(event: any) {
    const eventData = await this.prepareEventData(event)
    const eventId = `cal_${event.uri.split('/').pop()}`

    await prisma.calendlyEvent.upsert({
      where: { calendlyEventUri: event.uri },
      update: eventData,
      create: {
        id: eventId,
        calendlyEventUri: event.uri,
        ...eventData
      }
    })
  }

  // Entferne gelöschte Events
  private async removeDeletedEvents(syncedEventUris: Set<string>, daysBack: number, daysForward: number) {
    try {
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + daysForward)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysBack)
      
      const dbEvents = await prisma.calendlyEvent.findMany({
        where: {
          startTime: { gte: startDate, lte: endDate }
        },
        select: { id: true, calendlyEventUri: true }
      })
      
      const toDelete = dbEvents.filter(e => !syncedEventUris.has(e.calendlyEventUri))
      
      if (toDelete.length > 0) {
        await prisma.calendlyEvent.deleteMany({
          where: {
            id: { in: toDelete.map(e => e.id) }
          }
        })
      }
      
      return toDelete.length
    } catch (error: any) {
      console.error('  ✗ Fehler beim Entfernen gelöschter Events:', error.message)
      return 0
    }
  }

  // Teile Array in Chunks
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }
}

