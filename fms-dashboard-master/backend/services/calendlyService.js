const axios = require('axios');

class CalendlyService {
  constructor() {
    this.apiToken = process.env.CALENDLY_API_TOKEN;
    this.baseUrl = 'https://api.calendly.com';
    
    if (!this.apiToken) {
      console.warn('⚠️  CALENDLY_API_TOKEN nicht gesetzt! Calendly-Sync wird übersprungen.');
    }
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  isConfigured() {
    return !!this.apiToken;
  }

  // Hole aktuellen User
  async getCurrentUser() {
    const response = await this.client.get('/users/me');
    return response.data.resource;
  }

  // Hole Organization URI
  async getOrganizationUri() {
    const user = await this.getCurrentUser();
    return user.current_organization;
  }

  // Hole alle Organization Members
  async getOrganizationMembers() {
    const orgUri = await this.getOrganizationUri();
    const members = [];
    let url = '/organization_memberships';
    let params = {
      organization: orgUri,
      count: 100
    };

    while (url) {
      const response = await this.client.get(url, { params });
      members.push(...response.data.collection);
      
      url = response.data.pagination.next_page;
      params = null; // Nach erster Page sind params im next_page URL
    }

    return members;
  }

  // Hole Events für einen User
  async getScheduledEvents(userUri, startDate, endDate) {
    const orgUri = await this.getOrganizationUri();
    const events = [];
    let url = '/scheduled_events';
    
    let params = {
      organization: orgUri,
      user: userUri,
      min_start_time: startDate.toISOString(),
      max_start_time: endDate.toISOString(),
      count: 100
    };

    while (url) {
      const response = await this.client.get(url, { params });
      events.push(...response.data.collection);
      
      url = response.data.pagination.next_page;
      params = null;
    }

    return events;
  }

  // Hole Invitees für ein Event
  async getEventInvitees(eventUri) {
    const eventId = eventUri.split('/').pop();
    const invitees = [];
    let url = `/scheduled_events/${eventId}/invitees`;
    let params = { count: 100 };

    while (url) {
      const response = await this.client.get(url, { params });
      invitees.push(...response.data.collection);
      
      url = response.data.pagination.next_page;
      params = null;
    }

    return invitees;
  }

  // Hole alle Events mit Details (für Sync)
  async getAllEventsWithDetails(daysBack = 90, daysForward = 90) {
    if (!this.isConfigured()) {
      console.log('Calendly API nicht konfiguriert - überspringe.');
      return [];
    }

    console.log('📅 Starte Calendly Event Sync...');
    console.log(`  → Lade Events: ${daysBack} Tage zurück, ${daysForward} Tage voraus`);
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysForward); // Zukünftige Events inkludieren
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // 1. Hole alle Members
    console.log('  → Hole Organization Members...');
    const members = await this.getOrganizationMembers();
    console.log(`  → ${members.length} Members gefunden`);

    // 2. Hole Events pro Member
    const allEvents = [];
    
    for (const member of members) {
      const userUri = member.user.uri;
      const userName = member.user.name;
      const userEmail = member.user.email;

      console.log(`  → Hole Events für ${userName}...`);
      
      try {
        const events = await this.getScheduledEvents(userUri, startDate, endDate);
        
        // Füge User-Info zu jedem Event hinzu
        for (const event of events) {
          event.host_name = userName;
          event.host_email = userEmail;
          event.host_uri = userUri;
        }

        allEvents.push(...events);
        console.log(`     ✓ ${events.length} Events`);
      } catch (error) {
        console.error(`     ✗ Fehler bei ${userName}:`, error.message);
      }
    }

    console.log(`  → Gesamt: ${allEvents.length} Events gefunden`);

    // 3. Hole Invitees für alle Events (in Batches mit Rate Limiting)
    console.log('  → Hole Invitees...');
    let processedCount = 0;
    
    // Helper: Delay zwischen Requests um Rate Limiting zu vermeiden
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    for (const event of allEvents) {
      try {
        const invitees = await this.getEventInvitees(event.uri);
        event.invitees = invitees || [];
        
        processedCount++;
        if (processedCount % 20 === 0) {
          console.log(`     Progress: ${processedCount}/${allEvents.length}`);
        }
        
        // Delay nach jedem Request um Rate Limiting zu vermeiden (100ms)
        await delay(100);
      } catch (error) {
        // Bei 429 (Rate Limit): längeres Delay
        if (error.response && error.response.status === 429) {
          console.error(`     ✗ Rate Limit bei Event ${event.uri.split('/').pop()} - warte 2 Sekunden...`);
          await delay(2000);
          // Retry einmal
          try {
            const invitees = await this.getEventInvitees(event.uri);
            event.invitees = invitees || [];
            processedCount++;
            if (processedCount % 20 === 0) {
              console.log(`     Progress: ${processedCount}/${allEvents.length}`);
            }
          } catch (retryError) {
            console.error(`     ✗ Fehler bei Retry:`, retryError.message);
            event.invitees = [];
          }
        } else {
          console.error(`     ✗ Fehler bei Event ${event.uri.split('/').pop()}:`, error.message);
          event.invitees = [];
        }
        
        // Kurzes Delay auch bei Fehlern
        await delay(50);
      }
    }

    console.log(`  ✓ Calendly Sync abgeschlossen: ${allEvents.length} Events mit Invitees`);
    return allEvents;
  }

  // Mapping von Calendly Event Names zu unseren Appointment Types
  mapEventTypeToAppointmentType(eventName) {
    const lower = eventName.toLowerCase();
    
    if (lower.includes('erstgespräch') || lower.includes('erstberatung') || lower.includes('initial')) {
      return 'erstgespraech';
    }
    if (lower.includes('konzept') || lower.includes('concept')) {
      return 'konzept';
    }
    if (lower.includes('umsetzung') || lower.includes('implementation')) {
      return 'umsetzung';
    }
    if (lower.includes('service') || lower.includes('beratung')) {
      return 'service';
    }
    
    return 'sonstiges';
  }

  // Bestimme Status basierend auf Calendly Event
  determineEventStatus(event) {
    const now = new Date();
    const startTime = new Date(event.start_time);
    
    // Canceled in Calendly
    if (event.status === 'canceled') {
      return 'abgesagt_kunde';
    }
    
    // Active und in der Vergangenheit
    if (event.status === 'active' && startTime < now) {
      // Prüfe ob Invitee appeared
      const invitee = event.invitees?.[0];
      if (invitee) {
        // Cancel-Status vom Invitee prüfen
        if (invitee.status === 'canceled') {
          return 'abgesagt_kunde';
        }
        // No-Show wenn vergangen aber kein Result in Close
        return 'no_show'; // Wird später mit Close Activity abgeglichen
      }
      return 'no_show';
    }
    
    // Active und in der Zukunft
    if (event.status === 'active' && startTime >= now) {
      return 'geplant';
    }
    
    return 'geplant';
  }
}

module.exports = CalendlyService;
