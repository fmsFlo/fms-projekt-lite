const CalendlySyncService = require('./calendlySyncService');
const CloseApiService = require('./closeApi');
const { dbGet, dbAll, dbRun } = require('../database/db');

class SyncService {
  constructor() {
    this.closeApi = new CloseApiService();
  }

  // Synchronisiere alle Benutzer
  async syncUsers() {
    try {
      console.log('Starte Synchronisation der Benutzer...');
      const users = await this.closeApi.getUsers();
      
      for (const user of users) {
        // Prüfe ob User bereits existiert
        const existing = await dbGet(
          'SELECT id FROM users WHERE close_user_id = ?',
          [user.close_user_id]
        );
        
        if (existing) {
          // Update bestehenden User
          await dbRun(
            `UPDATE users 
             SET name = ?, email = ?
             WHERE close_user_id = ?`,
            [
              user.name || null,
              user.email || null,
              user.close_user_id
            ]
          );
        } else {
          // Erstelle neuen User
          await dbRun(
            `INSERT INTO users (close_user_id, name, email)
             VALUES (?, ?, ?)`,
            [
              user.close_user_id,
              user.name || null,
              user.email || null
            ]
          );
        }
      }
      
      console.log(`${users.length} Benutzer synchronisiert.`);
      return users.length;
    } catch (error) {
      console.error('Fehler beim Synchronisieren der Benutzer:', error);
      throw error;
    }
  }

  // Synchronisiere alle Leads
  async syncLeads() {
    try {
      console.log('Starte Synchronisation der Leads...');
      const leads = await this.closeApi.getLeads();
      
      for (const lead of leads) {
        // Hole interne User-ID falls assigned_user_id gesetzt
        let userId = null;
        if (lead.assigned_user_id) {
          const user = await dbGet(
            'SELECT id FROM users WHERE close_user_id = ?',
            [lead.assigned_user_id]
          );
          userId = user?.id || null;
        }
        
        // Prüfe ob Lead bereits existiert
        const existing = await dbGet(
          'SELECT id FROM leads WHERE close_lead_id = ?',
          [lead.close_lead_id]
        );
        
        if (existing) {
          // Update bestehenden Lead
          await dbRun(
            `UPDATE leads 
             SET name = ?, email = ?, phone = ?, status = ?, first_contact_date = ?, assigned_user_id = ?, created_at = COALESCE(created_at, ?)
             WHERE close_lead_id = ?`,
            [
              lead.name || null,
              lead.email || null,
              lead.phone || null,
              lead.status || null,
              lead.first_contact_date || null,
              userId,
              lead.date_created || null,
              lead.close_lead_id
            ]
          );
        } else {
          // Erstelle neuen Lead
          await dbRun(
            `INSERT INTO leads (close_lead_id, name, email, phone, status, first_contact_date, assigned_user_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              lead.close_lead_id,
              lead.name || null,
              lead.email || null,
              lead.phone || null,
              lead.status || null,
              lead.first_contact_date || null,
              userId,
              lead.date_created || new Date().toISOString()
            ]
          );
        }
      }
      
      console.log(`${leads.length} Leads synchronisiert.`);
      return leads.length;
    } catch (error) {
      console.error('Fehler beim Synchronisieren der Leads:', error);
      throw error;
    }
  }

  // Synchronisiere Calls (letzten 30 Tage)
  async syncCalls(daysBack = 30) {
    try {
      console.log(`Starte Synchronisation der Calls (letzte ${daysBack} Tage)...`);
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);
      
      const calls = await this.closeApi.getCallsByDateRange(
        startDate.toISOString(),
        endDate.toISOString()
      );
      
      let synced = 0;
      let skipped = 0;
      
      // Erstelle oder hole "Unbekannt" User als Fallback
      let unknownUserId = null;
      const unknownUser = await dbGet(
        'SELECT id FROM users WHERE close_user_id = ?',
        ['UNKNOWN_USER']
      );
      if (!unknownUser) {
        const result = await dbRun(
          'INSERT INTO users (close_user_id, name, email) VALUES (?, ?, ?)',
          ['UNKNOWN_USER', 'Nicht zugeordnet', null]
        );
        unknownUserId = result.lastID;
      } else {
        unknownUserId = unknownUser.id;
      }
      
      for (const call of calls) {
        // Hole interne IDs für User und Lead
        let userId = null;
        let leadId = null;
        
        if (call.user_close_id) {
          const user = await dbGet(
            'SELECT id FROM users WHERE close_user_id = ?',
            [call.user_close_id]
          );
          userId = user?.id || null;
        }
        
        // Fallback: Wenn kein user_close_id, nutze "Unbekannt" User
        if (!userId) {
          userId = unknownUserId;
        }
        
        if (call.lead_close_id) {
          const lead = await dbGet(
            'SELECT id FROM leads WHERE close_lead_id = ?',
            [call.lead_close_id]
          );
          leadId = lead?.id || null;
        }
        
        // Prüfe ob Call bereits existiert
        const existing = await dbGet(
          'SELECT id FROM calls WHERE close_call_id = ?',
          [call.close_call_id]
        );
        
        if (!existing) {
          // Neuer Call - einfügen
          await dbRun(
            `INSERT INTO calls (close_call_id, user_id, lead_id, call_date, duration, direction, status, disposition, note)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              call.close_call_id,
              userId,
              leadId,
              call.call_date,
              call.duration || 0,
              call.direction || null,
              call.status || null,
              call.disposition || null,
              call.note || null
            ]
          );
          synced++;
        } else {
          // Bestehender Call - aktualisiere beide Felder
          await dbRun(
            `UPDATE calls 
             SET user_id = ?, lead_id = ?, call_date = ?, duration = ?, direction = ?, status = ?, disposition = ?, note = ?
             WHERE close_call_id = ?`,
            [
              userId,
              leadId,
              call.call_date,
              call.duration || 0,
              call.direction || null,
              call.status || null,
              call.disposition || null,
              call.note || null,
              call.close_call_id
            ]
          );
          skipped++;
        }
      }
      
      console.log(`${synced} neue Calls synchronisiert, ${skipped} übersprungen.`);
      return { synced, skipped, total: calls.length };
    } catch (error) {
      console.error('Fehler beim Synchronisieren der Calls:', error);
      throw error;
    }
  }

  // Synchronisiere Custom Activities (Vorqualifizierung)
  async syncCustomActivities(daysBack = 30) {
    try {
      console.log(`Starte Synchronisation der Custom Activities (letzte ${daysBack} Tage)...`);
      
      const activityTypeId = 'actitype_1H3wPemMNkfkmT0nJuEBUT';
      const activities = await this.closeApi.getCustomActivities(activityTypeId, daysBack);
      
      let synced = 0;
      let skipped = 0;
      
      for (const activity of activities) {
        // Hole interne IDs für User und Lead
        let userId = null;
        let leadId = null;
        
        if (activity.user_close_id) {
          const user = await dbGet(
            'SELECT id FROM users WHERE close_user_id = ?',
            [activity.user_close_id]
          );
          userId = user?.id || null;
        }
        
        if (activity.lead_close_id) {
          const lead = await dbGet(
            'SELECT id FROM leads WHERE close_lead_id = ?',
            [activity.lead_close_id]
          );
          leadId = lead?.id || null;
        }
        
        // Prüfe ob Activity bereits existiert
        const existing = await dbGet(
          'SELECT id FROM custom_activities WHERE close_activity_id = ?',
          [activity.close_activity_id]
        );
        
        if (!existing) {
          // Neue Activity - einfügen
          await dbRun(
            `INSERT INTO custom_activities 
             (close_activity_id, activity_type, lead_id, user_id, ergebnis, erstgespraech_gebucht, budget_monat, hauptbedarf, dringlichkeit, custom_fields_json, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              activity.close_activity_id,
              activity.activity_type,
              leadId,
              userId,
              activity.ergebnis,
              activity.erstgespraech_gebucht,
              activity.budget_monat ? parseInt(activity.budget_monat) : null,
              activity.hauptbedarf,
              activity.dringlichkeit,
              activity.custom_fields_json || null,
              activity.created_at
            ]
          );
          synced++;
        } else {
          // Bestehende Activity - aktualisiere
          await dbRun(
            `UPDATE custom_activities 
             SET lead_id = ?, user_id = ?, ergebnis = ?, erstgespraech_gebucht = ?, budget_monat = ?, hauptbedarf = ?, dringlichkeit = ?, custom_fields_json = ?, created_at = ?
             WHERE close_activity_id = ?`,
            [
              leadId,
              userId,
              activity.ergebnis,
              activity.erstgespraech_gebucht,
              activity.budget_monat ? parseInt(activity.budget_monat) : null,
              activity.hauptbedarf,
              activity.dringlichkeit,
              activity.custom_fields_json || null,
              activity.created_at,
              activity.close_activity_id
            ]
          );
          skipped++;
        }
      }
      
      console.log(`${synced} neue Activities synchronisiert, ${skipped} aktualisiert.`);
      return { synced, skipped, total: activities.length };
    } catch (error) {
      console.error('Fehler beim Synchronisieren der Custom Activities:', error);
      throw error;
    }
  }

  // Synchronisiere ALLE Custom Activities (robuste Methode)
  async syncAllCustomActivities(daysBack = 90) {
    console.log(`\n🔄 Synchronisiere ALLE Custom Activities (letzte ${daysBack} Tage)...`);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    
    let totalSynced = 0;
    let totalSkipped = 0;
    
    try {
      // Hole ALLE Custom Activities (unabhängig vom Typ)
      const params = {
        _type: 'CustomActivity',
        date_created__gte: startDate.toISOString(),
        _limit: 100
      };
      
      let allActivities = [];
      let hasMore = true;
      let cursor = null;
      
      while (hasMore) {
        if (cursor) {
          params._skip = cursor;
        }
        
        const response = await this.closeApi.client.get('/activity/', { params });
        const activities = response.data.data || [];
        allActivities = allActivities.concat(activities);
        
        cursor = response.data.next_cursor;
        hasMore = !!cursor;
        
        console.log(`  📥 ${allActivities.length} Activities geladen...`);
      }
      
      console.log(`  ✅ Insgesamt ${allActivities.length} Custom Activities gefunden`);
      
      // Verarbeite jede Activity
      for (const activity of allActivities) {
        try {
          // Extrahiere Lead ID (Close Lead ID)
          const leadCloseId = activity.lead_id || activity.lead?.id;
          if (!leadCloseId) {
            totalSkipped++;
            continue;
          }
          
          // Finde Lead in DB
          const leadRecord = await dbGet(
            'SELECT id, email FROM leads WHERE close_lead_id = ?',
            [leadCloseId]
          );
          
          // Hole Lead E-Mail (aus DB oder Activity)
          let leadEmail = leadRecord?.email || 
                         activity.lead?.email || 
                         activity.lead?.emails?.[0]?.email || 
                         null;
          
          // Extrahiere Close User ID und E-Mail
          const closeUserId = activity.created_by || activity.user_id || activity.user?.id || null;
          const userEmail = activity.user?.email || null;
          
          // Hole User E-Mail aus DB falls vorhanden
          let userEmailFromDb = null;
          if (closeUserId) {
            const userRecord = await dbGet(
              'SELECT email FROM users WHERE close_user_id = ?',
              [closeUserId]
            );
            userEmailFromDb = userRecord?.email;
          }
          
          // Extrahiere Activity Type ID
          const activityTypeId = activity.custom_activity_type_id || activity.activity_type_id;
          
          // Finde Activity Type Name (falls bekannt)
          const ACTIVITY_TYPE_MAP = {
            'actitype_1H3wPemMNkfkmT0nJuEBUT': 'vorqualifizierung',
            'actitype_6VB2MiuFziQxyuzfMzHy7q': 'erstgespraech',
            'actitype_6ftbHtxSEz9wIwdLnovYP0': 'konzeptgespraech',
            'actitype_6nwTHKNbqf3EbQIjORgPg5': 'umsetzungsgespraech',
            'actitype_7dOp29fi26OKZQeXd9bCYP': 'servicegespraech'
          };
          
          const activityType = ACTIVITY_TYPE_MAP[activityTypeId] || null;
          
          // Extrahiere ALLE Custom Fields
          const customFields = {};
          Object.keys(activity).forEach(key => {
            if (key.startsWith('custom.')) {
              const fieldId = key.replace('custom.', '');
              customFields[fieldId] = activity[key];
            }
          });
          
          // Finde Ergebnis-Feld (dynamisch - suche nach bekannten Field IDs)
          const RESULT_FIELD_IDS = {
            'cf_xnH96817ih93fVQRG75NuqlCTJCNTkJ0OHCuup2iPLg': 'vorqualifizierung',
            'cf_QDWQYVNx3jMp1Pv0SIvzeoDigjMulHFh5qJQwWcesGZ': 'erstgespraech',
            'cf_XqpdiUMWiYCaw5uW9DRkSiXlOgBrdZtdEf2L8XmjNhT': 'konzeptgespraech',
            'cf_bd4BlLaCpH6uyfldREh1t9MAv7OCRcrZ5CxzJbpUIJf': 'umsetzungsgespraech',
            'cf_PZvw6SxG2UlSSQNQeDmu63gdMTDP24JG6kfxWB8RXH4': 'servicegespraech'
          };
          
          let ergebnis = null;
          for (const [fieldId, type] of Object.entries(RESULT_FIELD_IDS)) {
            if (customFields[fieldId]) {
              ergebnis = customFields[fieldId];
              break;
            }
          }
          
          const activityDate = activity.date_created || activity.created || activity.activity_at || new Date().toISOString();
          
          // UPSERT (INSERT OR REPLACE)
          await dbRun(`
            INSERT OR REPLACE INTO custom_activities 
            (id, close_activity_id, activity_type, activity_type_id,
             lead_id, lead_close_id, lead_email,
             opportunity_id, user_id, user_email,
             ergebnis, custom_fields, activity_date, date_created,
             updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `, [
            activity.id,
            activity.id,
            activityType,
            activityTypeId,
            leadRecord?.id || null,
            leadCloseId,
            leadEmail,
            activity.opportunity_id || null,
            closeUserId, // Close User ID (nicht DB User ID!)
            userEmailFromDb || userEmail,
            ergebnis,
            JSON.stringify(customFields),
            activityDate,
            activityDate
          ]);
          
          totalSynced++;
          
          if (totalSynced % 50 === 0) {
            console.log(`  ✅ ${totalSynced} Activities synchronisiert...`);
          }
        } catch (innerError) {
          console.error(`  ❌ Fehler bei Activity ${activity.id}:`, innerError.message);
          totalSkipped++;
        }
      }
      
      console.log(`\n✅ ${totalSynced} Custom Activities synchronisiert, ${totalSkipped} übersprungen`);
      return totalSynced;
    } catch (error) {
      console.error('❌ Fehler beim Synchronisieren aller Custom Activities:', error);
      throw error;
    }
  }

  // Synchronisiere Custom Activities für Termine (neue Methode)
  async syncAppointmentCustomActivities() {
    console.log('Syncing Appointment Custom Activities...');
    
    const ACTIVITY_TYPE_IDS = {
      erstgespraech: 'actitype_6VB2MiuFziQxyuzfMzHy7q',
      konzept: 'actitype_6ftbHtxSEz9wIwdLnovYP0',
      umsetzung: 'actitype_6nwTHKNbqf3EbQIjORgPg5',
      service: 'actitype_7dOp29fi26OKZQeXd9bCYP'
    };

    let totalSynced = 0;

    for (const [type, typeId] of Object.entries(ACTIVITY_TYPE_IDS)) {
      try {
        const activities = await this.closeApi.getCustomActivities(typeId, 90);
        console.log(`  ${type}: ${activities.length} activities found`);

        for (const activity of activities) {
          try {
            // Extrahiere Lead ID
            const leadId = activity.lead_id;
            if (!leadId) {
              continue;
            }

            // Finde Lead in DB
            const leadRecord = await dbGet(
              'SELECT id FROM leads WHERE close_lead_id = ?',
              [leadId]
            );
            if (!leadRecord) {
              continue; // Lead nicht in DB
            }

            // Extrahiere User ID
            let userId = null;
            if (activity.user_id || activity.created_by) {
              const userRecord = await dbGet(
                'SELECT id FROM users WHERE close_user_id = ?',
                [activity.user_id || activity.created_by]
              );
              userId = userRecord?.id || null;
            }

            // Extrahiere Close User ID (wichtig für späteres Matching!)
            const closeUserId = activity.user_id || activity.created_by || activity.user?.id;

            // Verwende richtige Field IDs basierend auf Typ
            const ACTIVITY_FIELD_IDS = {
              erstgespraech: 'cf_QDWQYVNx3jMp1Pv0SIvzeoDigjMulHFh5qJQwWcesGZ',
              konzept: 'cf_XqpdiUMWiYCaw5uW9DRkSiXlOgBrdZtdEf2L8XmjNhT',
              umsetzung: 'cf_bd4BlLaCpH6uyfldREh1t9MAv7OCRcrZ5CxzJbpUIJf',
              service: 'cf_PZvw6SxG2UlSSQNQeDmu63gdMTDP24JG6kfxWB8RXH4'
            };

            const custom = activity.custom || {};
            const resultFieldId = ACTIVITY_FIELD_IDS[type];
            const resultFieldKey = `custom.${resultFieldId}`;
            const ergebnis = activity[resultFieldKey] || 
                           custom[resultFieldId] || 
                           activity.custom?.[resultFieldId] || 
                           null;

            const activityDate = activity.date_created || activity.created || activity.activity_at || new Date().toISOString();
            
            // UPSERT (INSERT OR REPLACE)
            await dbRun(`
              INSERT OR REPLACE INTO custom_activities 
              (id, close_activity_id, activity_type, activity_type_id,
               lead_id, opportunity_id, user_id,
               ergebnis, activity_date, date_created,
               custom_fields, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `, [
              activity.id,
              activity.id,
              type,
              typeId,
              leadRecord.id,
              activity.opportunity_id || null,
              closeUserId, // WICHTIG: Speichere Close User ID (nicht DB User ID!)
              ergebnis,
              activityDate,
              activityDate,
              JSON.stringify(custom)
            ]);
            
            if (ergebnis) {
              console.log(`[Sync] ✅ Activity ${activity.id} (${type}): Lead=${leadId}, User=${closeUserId}, Ergebnis="${ergebnis}"`);
            }

            totalSynced++;
          } catch (innerError) {
            console.error(`Fehler beim Synchronisieren einer Activity (${type}):`, innerError.message);
          }
        }
      } catch (error) {
        console.error(`Error syncing ${type} activities:`, error.message);
      }
    }

    console.log(`✅ ${totalSynced} Appointment Custom Activities synchronized`);
    return totalSynced;
  }

  // Verknüpfe Custom Activities mit Appointments
  async linkActivitiesToAppointments() {
    console.log('Linking Custom Activities to Appointments...');
    
    // Finde Appointments ohne verknüpfte Activity
    const appointments = await dbAll(`
      SELECT * FROM appointments 
      WHERE status = 'stattgefunden'
      AND (result_activity_id IS NULL OR result_activity_id = '')
    `);

    let linked = 0;

    for (const apt of appointments) {
      try {
        // Suche passende Custom Activity
        // Nehme neueste Activity vom gleichen Lead + Typ, Datum innerhalb 48h
        const activity = await dbGet(`
          SELECT * FROM custom_activities
          WHERE lead_id = ?
            AND activity_type = ?
            AND ABS(JULIANDAY(activity_date) - JULIANDAY(?)) <= 2
          ORDER BY activity_date DESC
          LIMIT 1
        `, [apt.lead_id, apt.appointment_type, apt.current_date || apt.original_date]);

        if (activity) {
          await dbRun(`
            UPDATE appointments 
            SET result_activity_id = ?,
                compliance_filled = 1
            WHERE id = ?
          `, [activity.close_activity_id, apt.id]);
          
          linked++;
        }
      } catch (innerError) {
        console.error(`Fehler beim Verknüpfen eines Appointments:`, innerError.message);
      }
    }

    console.log(`✅ ${linked} appointments linked to custom activities`);
    return linked;
  }


  // LEAD MATCHING - Intelligent
  async findLeadByEmail(email) {
    if (!email) return null;

    const emailLower = email.toLowerCase().trim();

    // 1. Exakte Übereinstimmung
    let lead = await dbGet(
      'SELECT * FROM leads WHERE LOWER(TRIM(email)) = ?',
      [emailLower]
    );

    if (lead) {
      return { ...lead, matchType: 'email_exact' };
    }

    // 2. Normalisiert (ohne +tags, etc.)
    const emailNormalized = emailLower.split('+')[0].split('@')[0] + '@' + emailLower.split('@')[1];

    lead = await dbGet(
      'SELECT * FROM leads WHERE LOWER(TRIM(email)) LIKE ?',
      [`${emailNormalized}%`]
    );

    if (lead) {
      return { ...lead, matchType: 'email_normalized' };
    }

    return null;
  }


  // Vollständige Synchronisation
  async syncAll() {
    try {
      console.log('=== Starte vollständige Synchronisation ===');
      
      await this.syncUsers();
      await this.syncLeads();
      await this.syncCalls();
      await this.syncCustomActivities(); // Alte Methode für Vorqualifizierung
      
      // Synchronisiere Appointments
      try {
        const AppointmentSyncService = require('./appointmentSyncService');
        const appointmentSync = new AppointmentSyncService();
        await appointmentSync.syncErstgespraeche();
        await appointmentSync.syncKonzeptGespraeche();
        await appointmentSync.syncUmsetzungsGespraeche();
      } catch (appointmentError) {
        console.warn('Fehler bei Appointment-Synchronisation (optional):', appointmentError.message);
      }

      // NEU: Synchronisiere ALLE Custom Activities (robust)
      await this.syncAllCustomActivities(90); // Letzte 90 Tage schnell
      
      // Alte Methode für Backward Compatibility
      await this.syncAppointmentCustomActivities();
      await this.linkActivitiesToAppointments();
      
      // NEU: Calendly Sync
      try {
        const calendlySync = new CalendlySyncService();
        await calendlySync.syncCalendlyEvents(90, 90); // Letzte 90 Tage + nächste 90 Tage (für Forecast)
        await calendlySync.matchCalendlyEventsWithAppointments();
      } catch (calendlyError) {
        console.warn('Fehler bei Calendly-Synchronisation (optional):', calendlyError.message);
      }
      
      console.log('=== Synchronisation abgeschlossen ===');
      return { success: true };
    } catch (error) {
      console.error('Fehler bei vollständiger Synchronisation:', error);
      throw error;
    }
  }
}

module.exports = SyncService;


