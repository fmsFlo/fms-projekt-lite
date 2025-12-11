import axios from 'axios'
import { prisma } from './prisma'

class CalendlyService {
  private apiToken: string | null
  private baseUrl: string
  private client: any

  constructor(apiToken?: string) {
    this.apiToken = apiToken || process.env.CALENDLY_API_TOKEN || null
    this.baseUrl = 'https://api.calendly.com'
    
    if (!this.apiToken) {
      console.warn('⚠️  CALENDLY_API_TOKEN nicht gesetzt! Calendly-Sync wird übersprungen.')
    }
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      }
    })
  }

  isConfigured() {
    return !!this.apiToken
  }

  // Hole aktuellen User
  async getCurrentUser() {
    const response = await this.client.get('/users/me')
    return response.data.resource
  }

  // Hole Organization URI
  async getOrganizationUri() {
    const user = await this.getCurrentUser()
    return user.current_organization
  }

  // Hole alle Organization Members
  async getOrganizationMembers() {
    const orgUri = await this.getOrganizationUri()
    const members: any[] = []
    let url: string | null = '/organization_memberships'
    let params: any = {
      organization: orgUri,
      count: 100
    }

    while (url) {
      const response = await this.client.get(url, { params })
      members.push(...response.data.collection)
      
      url = response.data.pagination?.next_page || null
      params = null // Nach erster Page sind params im next_page URL
    }

    return members
  }

  // Hole Events für einen User
  async getScheduledEvents(userUri: string, startDate: Date, endDate: Date) {
    const orgUri = await this.getOrganizationUri()
    const events: any[] = []
    let url: string | null = '/scheduled_events'
    
    let params: any = {
      organization: orgUri,
      user: userUri,
      min_start_time: startDate.toISOString(),
      max_start_time: endDate.toISOString(),
      count: 100
    }

    while (url) {
      const response = await this.client.get(url, { params })
      events.push(...response.data.collection)
      
      url = response.data.pagination?.next_page || null
      params = null
    }

    return events
  }

  // Hole Invitees für ein Event
  async getEventInvitees(eventUri: string) {
    const eventId = eventUri.split('/').pop()
    const invitees: any[] = []
    let url: string | null = `/scheduled_events/${eventId}/invitees`
    let params: any = { count: 100 }

    while (url) {
      const response = await this.client.get(url, { params })
      invitees.push(...response.data.collection)
      
      url = response.data.pagination?.next_page || null
      params = null
    }

    return invitees
  }

  // Hole alle Events mit Details (für Sync)
  async getAllEventsWithDetails(daysBack = 90, daysForward = 90) {
    if (!this.isConfigured()) {
      console.log('Calendly API nicht konfiguriert - überspringe.')
      return []
    }

    console.log('📅 Starte Calendly Event Sync...')
    console.log(`  → Lade Events: ${daysBack} Tage zurück, ${daysForward} Tage voraus`)
    
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + daysForward) // Zukünftige Events inkludieren
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysBack)

    // 1. Hole alle Members
    console.log('  → Hole Organization Members...')
    const members = await this.getOrganizationMembers()
    console.log(`  → ${members.length} Members gefunden`)

    // 2. Hole Events pro Member
    const allEvents: any[] = []
    
    for (const member of members) {
      const userUri = member.user.uri
      const userName = member.user.name
      const userEmail = member.user.email

      console.log(`  → Hole Events für ${userName}...`)
      
      try {
        const events = await this.getScheduledEvents(userUri, startDate, endDate)
        
        // Füge User-Info zu jedem Event hinzu
        for (const event of events) {
          event.host_name = userName
          event.host_email = userEmail
          event.host_uri = userUri
        }

        allEvents.push(...events)
        console.log(`     ✓ ${events.length} Events`)
      } catch (error: any) {
        console.error(`     ✗ Fehler bei ${userName}:`, error.message)
      }
    }

    console.log(`  → Gesamt: ${allEvents.length} Events gefunden`)

    // 3. Hole Invitees für alle Events (in Batches mit Rate Limiting)
    console.log('  → Hole Invitees...')
    let processedCount = 0
    
    // Helper: Delay zwischen Requests um Rate Limiting zu vermeiden
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
    
    for (const event of allEvents) {
      try {
        const invitees = await this.getEventInvitees(event.uri)
        event.invitees = invitees || []
        
        processedCount++
        if (processedCount % 20 === 0) {
          console.log(`     Progress: ${processedCount}/${allEvents.length}`)
        }
        
        // Delay nach jedem Request um Rate Limiting zu vermeiden (100ms)
        await delay(100)
      } catch (error: any) {
        // Bei 429 (Rate Limit): längeres Delay
        if (error.response && error.response.status === 429) {
          console.error(`     ✗ Rate Limit bei Event ${event.uri.split('/').pop()} - warte 2 Sekunden...`)
          await delay(2000)
          // Retry einmal
          try {
            const invitees = await this.getEventInvitees(event.uri)
            event.invitees = invitees || []
            processedCount++
            if (processedCount % 20 === 0) {
              console.log(`     Progress: ${processedCount}/${allEvents.length}`)
            }
          } catch (retryError: any) {
            console.error(`     ✗ Fehler bei Retry:`, retryError.message)
            event.invitees = []
          }
        } else {
          console.error(`     ✗ Fehler bei Event ${event.uri.split('/').pop()}:`, error.message)
          event.invitees = []
        }
        
        // Kurzes Delay auch bei Fehlern
        await delay(50)
      }
    }

    console.log(`  ✓ Calendly Sync abgeschlossen: ${allEvents.length} Events mit Invitees`)
    return allEvents
  }

  // Mapping von Calendly Event Names zu unseren Appointment Types
  mapEventTypeToAppointmentType(eventName: string) {
    const lower = eventName.toLowerCase()
    
    if (lower.includes('erstgespräch') || lower.includes('erstberatung') || lower.includes('initial')) {
      return 'erstgespraech'
    }
    if (lower.includes('konzept') || lower.includes('concept')) {
      return 'konzept'
    }
    if (lower.includes('umsetzung') || lower.includes('implementation')) {
      return 'umsetzung'
    }
    if (lower.includes('service') || lower.includes('beratung')) {
      return 'service'
    }
    
    return 'sonstiges'
  }
}

export class CalendlySyncService {
  private calendly: CalendlyService

  constructor(apiToken?: string) {
    this.calendly = new CalendlyService(apiToken)
  }

  // Sync Calendly Events
  async syncCalendlyEvents(daysBack = 90, daysForward = 90) {
    if (!this.calendly.isConfigured()) {
      console.log('⏭️  Calendly API nicht konfiguriert - überspringe Calendly Sync')
      return 0
    }

    try {
      console.log('\n📅 Synchronisiere Calendly Events...')
      console.log(`  → Zeitraum: ${daysBack} Tage zurück, ${daysForward} Tage voraus`)
      
      // Hole Events von Calendly (inkl. zukünftige Events)
      const events = await this.calendly.getAllEventsWithDetails(daysBack, daysForward)
      
      if (events.length === 0) {
        console.log('  → Keine Events gefunden')
        return 0
      }

      let synced = 0
      let errors = 0

      // Helper: Delay zwischen DB-Operations
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
      
      for (const event of events) {
        try {
          await this.saveCalendlyEvent(event)
          synced++
          
          // Progress-Logging
          if (synced % 100 === 0) {
            console.log(`  → ${synced} Events gespeichert...`)
          }
        } catch (error: any) {
          errors++
          console.error(`  ✗ Fehler bei Event ${event.uri?.split('/').pop()}:`, error.message)
        }
        
        // Kleines Delay zwischen DB-Operations (10ms)
        if (synced % 50 === 0) {
          await delay(10)
        }
      }

      // Entferne Events, die in Calendly nicht mehr existieren (gelöscht wurden)
      console.log('  → Prüfe auf gelöschte Events...')
      const syncedEventUris = new Set(events.map((e: any) => e.uri))
      const deletedCount = await this.removeDeletedEvents(syncedEventUris, daysBack, daysForward)
      
      console.log(`  ✓ ${synced} Calendly Events synchronisiert, ${deletedCount} gelöschte Events entfernt, ${errors} Fehler`)
      return synced
    } catch (error: any) {
      console.error('❌ Fehler beim Calendly Sync:', error)
      throw error
    }
  }

  // Speichere einzelnes Calendly Event
  async saveCalendlyEvent(event: any) {
    // Finde Lead basierend auf Invitee Email
    const invitee = event.invitees?.[0]
    let leadId: string | null = null
    
    if (invitee?.email) {
      const lead = await prisma.lead.findFirst({
        where: { email: { equals: invitee.email, mode: 'insensitive' } },
        select: { id: true }
      })
      leadId = lead?.id || null
    }

    // Parse Zeiten
    const startTime = new Date(event.start_time)
    const endTime = new Date(event.end_time)

    // Extrahiere Event-Name
    const eventName = event.name || 
                     event.event_type?.name || 
                     event.event_type_name || 
                     'Unbekannt'

    // Mapped Appointment Type
    const mappedType = this.calendly.mapEventTypeToAppointmentType(eventName)

    // Status - verwende direkt event.status von Calendly (active/canceled)
    const status = event.status || 'active'
    
    // Für DB: verwende den Status direkt
    const dbStatus = status === 'canceled' ? 'canceled' : 'active'

    // Generiere eindeutige ID
    const eventId = `cal_${event.uri.split('/').pop()}`

    // Check ob Event existiert
    const existing = await prisma.calendlyEvent.findUnique({
      where: { calendlyEventUri: event.uri }
    })

    if (existing) {
      // Update
      await prisma.calendlyEvent.update({
        where: { calendlyEventUri: event.uri },
        data: {
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
      })
    } else {
      // Insert
      await prisma.calendlyEvent.create({
        data: {
          id: eventId,
          calendlyEventUri: event.uri,
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
      })
    }
  }

  // Entferne Events, die in Calendly nicht mehr existieren
  async removeDeletedEvents(syncedEventUris: Set<string>, daysBack: number, daysForward: number) {
    try {
      // Berechne Datumsbereich
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + daysForward)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysBack)
      
      // Hole alle Events aus DB im Zeitraum
      const dbEvents = await prisma.calendlyEvent.findMany({
        where: {
          startTime: { gte: startDate, lte: endDate }
        },
        select: { id: true, calendlyEventUri: true, startTime: true, eventTypeName: true }
      })
      
      let deletedCount = 0
      
      // Prüfe jedes DB-Event: Wenn URI nicht in syncedEventUris, dann wurde es gelöscht
      for (const dbEvent of dbEvents) {
        if (!syncedEventUris.has(dbEvent.calendlyEventUri)) {
          // Event existiert nicht mehr in Calendly → entfernen
          await prisma.calendlyEvent.delete({
            where: { id: dbEvent.id }
          })
          deletedCount++
          console.log(`     ✗ Gelöscht: ${dbEvent.eventTypeName} am ${new Date(dbEvent.startTime).toLocaleDateString('de-DE')}`)
        }
      }
      
      if (deletedCount > 0) {
        console.log(`  → ${deletedCount} gelöschte Events aus DB entfernt`)
      }
      
      return deletedCount
    } catch (error: any) {
      console.error('  ✗ Fehler beim Entfernen gelöschter Events:', error.message)
      return 0
    }
  }
}

