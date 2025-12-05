const CalendlyService = require('./calendlyService');
const { dbGet, dbRun, dbAll } = require('../database/db');

class CalendlySyncService {
  constructor() {
    this.calendly = new CalendlyService();
  }

  // Sync Calendly Events
  async syncCalendlyEvents(daysBack = 90, daysForward = 90) {
    if (!this.calendly.isConfigured()) {
      console.log('⏭️  Calendly API nicht konfiguriert - überspringe Calendly Sync');
      return 0;
    }

    try {
      console.log('\n📅 Synchronisiere Calendly Events...');
      console.log(`  → Zeitraum: ${daysBack} Tage zurück, ${daysForward} Tage voraus`);
      
      // Hole Events von Calendly (inkl. zukünftige Events)
      const events = await this.calendly.getAllEventsWithDetails(daysBack, daysForward);
      
      if (events.length === 0) {
        console.log('  → Keine Events gefunden');
        return 0;
      }

      let synced = 0;
      let errors = 0;

      // Helper: Delay zwischen DB-Operations
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      
      for (const event of events) {
        try {
          await this.saveCalendlyEvent(event);
          synced++;
          
          // Progress-Logging
          if (synced % 100 === 0) {
            console.log(`  → ${synced} Events gespeichert...`);
          }
        } catch (error) {
          errors++;
          // Detailliertes Error-Logging
          if (error.message.includes('NOT NULL constraint')) {
            console.error(`  ✗ Constraint-Fehler bei Event ${event.uri?.split('/').pop()}:`, error.message);
            console.error(`     Event-Daten:`, {
              host_name: event.host_name,
              invitees_count: event.invitees?.length || 0,
              has_invitee: !!event.invitees?.[0]
            });
          } else {
            console.error(`  ✗ Fehler bei Event ${event.uri?.split('/').pop()}:`, error.message);
          }
        }
        
        // Kleines Delay zwischen DB-Operations (10ms)
        if (synced % 50 === 0) {
          await delay(10);
        }
      }

      // 4. Entferne Events, die in Calendly nicht mehr existieren (gelöscht wurden)
      console.log('  → Prüfe auf gelöschte Events...');
      const syncedEventUris = new Set(events.map(e => e.uri));
      const deletedCount = await this.removeDeletedEvents(syncedEventUris, daysBack, daysForward);
      
      console.log(`  ✓ ${synced} Calendly Events synchronisiert, ${deletedCount} gelöschte Events entfernt, ${errors} Fehler`);
      return synced;
    } catch (error) {
      console.error('❌ Fehler beim Calendly Sync:', error);
      throw error;
    }
  }

  // Speichere einzelnes Calendly Event
  async saveCalendlyEvent(event) {
    // Finde oder erstelle User
    let userId = await this.findOrCreateCalendlyUser(event.host_email, event.host_name);

    // Finde Lead basierend auf Invitee Email
    const invitee = event.invitees?.[0];
    let leadId = null;
    
    if (invitee?.email) {
      const lead = await dbGet(
        'SELECT id FROM leads WHERE email = ? OR LOWER(email) = LOWER(?)',
        [invitee.email, invitee.email]
      );
      leadId = lead?.id || null;
    }

    // Parse Zeiten
    const startTime = new Date(event.start_time);
    const endTime = new Date(event.end_time);
    const durationMinutes = Math.round((endTime - startTime) / 60000);

    // Extrahiere Event-Name (verschiedene mögliche Felder)
    const eventName = event.name || 
                     event.event_type?.name || 
                     event.event_type_name || 
                     'Unbekannt';

    // Mapped Appointment Type
    const mappedType = this.calendly.mapEventTypeToAppointmentType(eventName);

    // Status - verwende direkt event.status von Calendly (active/canceled)
    // Calendly gibt 'active' oder 'canceled' zurück
    const status = event.status || 'active';
    
    // Für DB: verwende den Status direkt, aber handle 'canceled' richtig
    const dbStatus = status === 'canceled' ? 'canceled' : 'active';

    // Generiere eindeutige ID
    const eventId = `cal_${event.uri.split('/').pop()}`;

    // Check ob Event existiert - verwende tatsächliche DB-Spaltennamen
    const existing = await dbGet(
      'SELECT id FROM calendly_events WHERE calendly_event_uri = ?',
      [event.uri]
    );

    if (existing) {
      // Update - verwende tatsächliche DB-Spaltennamen
      await dbRun(`
        UPDATE calendly_events 
        SET 
          event_type_name = ?,
          mapped_type = ?,
          start_time = ?,
          end_time = ?,
          status = ?,
          host_name = ?,
          host_email = ?,
          user_id = ?,
          invitee_name = ?,
          invitee_email = ?,
          lead_id = ?,
          synced_at = CURRENT_TIMESTAMP
        WHERE calendly_event_uri = ?
      `, [
        eventName,
        mappedType,
        event.start_time,
        event.end_time,
        dbStatus,
        event.host_name,
        event.host_email,
        userId,
        invitee?.name || null,
        invitee?.email || null,
        leadId,
        event.uri
      ]);
    } else {
      // Insert - verwende tatsächliche DB-Spaltennamen
      await dbRun(`
        INSERT INTO calendly_events (
          id, calendly_event_uri, event_type_name, mapped_type,
          start_time, end_time, status,
          host_name, host_email, user_id,
          invitee_name, invitee_email, lead_id, synced_at
        ) VALUES (
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, CURRENT_TIMESTAMP
        )
      `, [
        eventId,
        event.uri,
        eventName,
        mappedType,
        event.start_time,
        event.end_time,
        dbStatus,
        event.host_name,
        event.host_email,
        userId,
        invitee?.name || null,
        invitee?.email || null,
        leadId
      ]);
    }
  }

  // Finde oder erstelle Calendly User
  async findOrCreateCalendlyUser(email, name) {
    // Prüfe ob User existiert
    const existingUser = await dbGet(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser) {
      return existingUser.id;
    }

    // Erstelle neuen User mit Calendly Prefix
    const calendlyUserId = `CALENDLY_${email}`;
    
    await dbRun(`
      INSERT INTO users (close_user_id, name, email, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `, [calendlyUserId, name, email]);

    const newUser = await dbGet(
      'SELECT id FROM users WHERE close_user_id = ?',
      [calendlyUserId]
    );

    return newUser.id;
  }

  // Entferne Events, die in Calendly nicht mehr existieren
  async removeDeletedEvents(syncedEventUris, daysBack, daysForward) {
    try {
      
      // Berechne Datumsbereich
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + daysForward);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);
      
      // Hole alle Events aus DB im Zeitraum
      const dbEvents = await dbAll(`
        SELECT id, calendly_event_uri, start_time, event_type_name
        FROM calendly_events
        WHERE start_time >= ? AND start_time <= ?
      `, [startDate.toISOString(), endDate.toISOString()]);
      
      let deletedCount = 0;
      
      // Prüfe jedes DB-Event: Wenn URI nicht in syncedEventUris, dann wurde es gelöscht
      for (const dbEvent of dbEvents) {
        if (!syncedEventUris.has(dbEvent.calendly_event_uri)) {
          // Event existiert nicht mehr in Calendly → entfernen
          await dbRun(
            'DELETE FROM calendly_events WHERE calendly_event_uri = ?',
            [dbEvent.calendly_event_uri]
          );
          deletedCount++;
          console.log(`     ✗ Gelöscht: ${dbEvent.event_type_name} am ${new Date(dbEvent.start_time).toLocaleDateString('de-DE')}`);
        }
      }
      
      if (deletedCount > 0) {
        console.log(`  → ${deletedCount} gelöschte Events aus DB entfernt`);
      }
      
      return deletedCount;
    } catch (error) {
      console.error('  ✗ Fehler beim Entfernen gelöschter Events:', error.message);
      return 0;
    }
  }

  // Matching: Verbinde Calendly Events mit Close Appointments
  async matchCalendlyEventsWithAppointments() {
    try {
      console.log('\n🔗 Matche Calendly Events mit Close Appointments...');

      // Hole unmatched Calendly Events
      const unmatchedEvents = await dbAll(`
        SELECT * FROM calendly_events 
        WHERE lead_id IS NOT NULL
        AND id NOT IN (
          SELECT calendly_event_id FROM appointments WHERE calendly_event_id IS NOT NULL
        )
      `);

      let matched = 0;

      for (const event of unmatchedEvents) {
        // Suche passendes Appointment
        // Match Kriterien: Lead, Type, Datum (±1 Tag)
        const startDate = new Date(event.start_time);
        const beforeDate = new Date(startDate);
        beforeDate.setDate(beforeDate.getDate() - 1);
        const afterDate = new Date(startDate);
        afterDate.setDate(afterDate.getDate() + 1);

        const appointment = await dbGet(`
          SELECT id FROM appointments
          WHERE lead_id = ?
          AND appointment_type = ?
          AND DATE(current_date) >= DATE(?)
          AND DATE(current_date) <= DATE(?)
          AND calendly_event_id IS NULL
          LIMIT 1
        `, [
          event.lead_id,
          event.mapped_appointment_type,
          beforeDate.toISOString().split('T')[0],
          afterDate.toISOString().split('T')[0]
        ]);

        if (appointment) {
          // Verknüpfe
          await dbRun(`
            UPDATE appointments 
            SET calendly_event_id = ?
            WHERE id = ?
          `, [event.id, appointment.id]);

          matched++;
        }
      }

      console.log(`  ✓ ${matched} Calendly Events mit Appointments verknüpft`);
      return matched;
    } catch (error) {
      console.error('❌ Fehler beim Matching:', error);
      throw error;
    }
  }
}

module.exports = CalendlySyncService;
