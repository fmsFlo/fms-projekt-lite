const CloseApiService = require('./closeApi');
const { dbGet, dbAll, dbRun } = require('../database/db');

class AppointmentSyncService {
  constructor() {
    this.closeApi = new CloseApiService();
  }

  // Generiere eindeutige Appointment ID
  generateAppointmentId(leadId, appointmentType, originalDate) {
    return `apt_${leadId}_${appointmentType}_${originalDate.replace(/-/g, '')}`;
  }

  // Handle Appointment Update (Verschiebungs-Logik)
  async handleAppointmentUpdate(existingAppointment, newData) {
    // Wenn Datum geändert wurde
    if (existingAppointment.current_date !== newData.date) {
      // History Entry erstellen
      await dbRun(`
        INSERT INTO appointment_history 
        (appointment_id, action, old_date, new_date, changed_at)
        VALUES (?, 'verschoben', ?, ?, CURRENT_TIMESTAMP)
      `, [existingAppointment.id, existingAppointment.current_date, newData.date]);

      // Appointment updaten
      await dbRun(`
        UPDATE appointments 
        SET current_date = ?,
            status = ?,
            reschedule_count = reschedule_count + 1,
            last_modified = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [newData.date, newData.status || 'verschoben_kunde', existingAppointment.id]);

      // WICHTIG: original_date bleibt unverändert!
    } else if (existingAppointment.status !== newData.status) {
      // Nur Status geändert
      await dbRun(`
        UPDATE appointments 
        SET status = ?,
            last_modified = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [newData.status, existingAppointment.id]);
    }
  }

  // Synchronisiere Erstgespräche
  async syncErstgespraeche() {
    try {
      console.log('Starte Synchronisation der Erstgespräche...');
      const leads = await this.closeApi.getLeadsWithErstgespraech();
      console.log(`Gefunden: ${leads.length} Leads mit Erstgespräch`);
      let synced = 0;
      let errors = 0;

      for (const lead of leads) {
        try {
        if (!lead.erstgespraech_am) {
          continue; // Kein Datum gesetzt
        }

        // Hole interne Lead-ID
        const leadRecord = await dbGet(
          'SELECT id FROM leads WHERE close_lead_id = ?',
          [lead.close_lead_id]
        );
        if (!leadRecord) {
          continue; // Lead nicht in DB
        }

        // Hole interne User-ID
        let userId = null;
        if (lead.assigned_user_id) {
          const user = await dbGet(
            'SELECT id FROM users WHERE close_user_id = ?',
            [lead.assigned_user_id]
          );
          userId = user?.id || null;
        }

        // Parse Datum
        const appointmentDate = new Date(lead.erstgespraech_am);
        const dateStr = appointmentDate.toISOString().split('T')[0];

        // Generiere Appointment ID
        const appointmentId = this.generateAppointmentId(
          lead.close_lead_id,
          'erstgespraech',
          dateStr
        );

        // Prüfe ob Appointment bereits existiert
        const existing = await dbGet(
          'SELECT id, current_date, status FROM appointments WHERE id = ?',
          [appointmentId]
        );

        // Hole Erstgespräch Activity für Ergebnis (optional, Fehler nicht kritisch)
        let activity = null;
        try {
          activity = await this.closeApi.getErstgespraechActivity(lead.close_lead_id);
        } catch (activityError) {
          console.warn(`Fehler beim Abrufen der Activity für Lead ${lead.close_lead_id}:`, activityError.message);
          // Weiter machen ohne Activity
        }
        const result = activity?.result || lead.erstgespraech_ergebnis || null;
        const resultDetails = activity?.result_details || null;

        // Bestimme Status
        let status = 'geplant';
        if (result) {
          status = 'stattgefunden';
        } else if (appointmentDate < new Date()) {
          // Vergangenes Datum ohne Ergebnis = No-Show oder verschoben
          status = 'no_show';
        }

        if (existing) {
          // Update bestehendes Appointment
          await this.handleAppointmentUpdate(existing, {
            date: dateStr,
            status: status
          });

          // Update Ergebnis falls vorhanden
          if (result) {
            await dbRun(`
              UPDATE appointments 
              SET result = ?, result_details = ?
              WHERE id = ?
            `, [result, resultDetails, appointmentId]);
          }
        } else {
          // Neues Appointment erstellen
          await dbRun(`
            INSERT INTO appointments 
            (id, lead_id, user_id, appointment_type, original_date, original_booked_at, current_date, status, result, result_details, created_at)
            VALUES (?, ?, ?, 'erstgespraech', ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `, [
            appointmentId,
            leadRecord.id,
            userId,
            dateStr, // original_date
            dateStr, // current_date
            status,
            result,
            resultDetails
          ]);

          // History Entry für Buchung
          await dbRun(`
            INSERT INTO appointment_history 
            (appointment_id, action, new_date, changed_at)
            VALUES (?, 'gebucht', ?, CURRENT_TIMESTAMP)
          `, [appointmentId, dateStr]);
        }

        synced++;
        } catch (leadError) {
          errors++;
          console.error(`Fehler beim Synchronisieren von Lead ${lead.close_lead_id}:`, leadError.message);
          // Weiter mit nächstem Lead
        }
      }

      console.log(`${synced} Erstgespräche synchronisiert, ${errors} Fehler.`);
      return synced;
    } catch (error) {
      console.error('Fehler beim Synchronisieren der Erstgespräche:', error);
      throw error;
    }
  }

  // Synchronisiere Konzept-Gespräche (aus Opportunities)
  async syncKonzeptGespraeche() {
    try {
      console.log('Starte Synchronisation der Konzept-Gespräche...');
      const opportunities = await this.closeApi.getOpportunities();
      console.log(`Gefunden: ${opportunities.length} Opportunities`);
      
      // Filtere nach Konzept Stages
      const konzeptStages = [
        'stat_Q9KpLkUvuWy4YJWlZ9kbGhrmxLFJJcnbYcu6sytJhM6', // Konzept geplant
        'stat_w5MA00nWDVYRsJ9TRznGvFr4Nhu80qd0C9C91rdbgnm'  // Konzept absolviert
      ];

      const konzeptOpps = opportunities.filter(opp => 
        konzeptStages.includes(opp.stage_id)
      );
      console.log(`Gefunden: ${konzeptOpps.length} Konzept-Opportunities`);

      let synced = 0;
      let errors = 0;

      for (const opp of konzeptOpps) {
        try {
        // Hole interne Lead-ID
        const leadRecord = await dbGet(
          'SELECT id FROM leads WHERE close_lead_id = ?',
          [opp.lead_close_id]
        );
        if (!leadRecord) {
          continue;
        }

        // Speichere Opportunity
        const existingOpp = await dbGet(
          'SELECT id FROM opportunities WHERE close_opportunity_id = ?',
          [opp.close_opportunity_id]
        );

        if (existingOpp) {
          await dbRun(`
            UPDATE opportunities 
            SET name = ?, value = ?, status = ?, stage = ?, stage_id = ?, date_won = ?
            WHERE close_opportunity_id = ?
          `, [
            opp.name,
            opp.value,
            opp.status,
            opp.stage,
            opp.stage_id,
            opp.date_won,
            opp.close_opportunity_id
          ]);
        } else {
          await dbRun(`
            INSERT INTO opportunities 
            (close_opportunity_id, lead_id, name, value, status, stage, stage_id, date_created, date_won, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `, [
            opp.close_opportunity_id,
            leadRecord.id,
            opp.name,
            opp.value,
            opp.status,
            opp.stage,
            opp.stage_id,
            opp.date_created,
            opp.date_won
          ]);
        }

        // TODO: Extrahiere geplantes Datum aus Opportunity Custom Fields
        // Für jetzt: Nutze date_created als Platzhalter
        const appointmentDate = opp.date_created ? new Date(opp.date_created) : new Date();
        const dateStr = appointmentDate.toISOString().split('T')[0];

        const appointmentId = this.generateAppointmentId(
          opp.lead_close_id,
          'konzept',
          dateStr
        );

        const status = opp.stage_id === 'stat_w5MA00nWDVYRsJ9TRznGvFr4Nhu80qd0C9C91rdbgnm' 
          ? 'stattgefunden' 
          : 'geplant';

        const existing = await dbGet(
          'SELECT id, current_date, status FROM appointments WHERE id = ?',
          [appointmentId]
        );

        if (existing) {
          await this.handleAppointmentUpdate(existing, {
            date: dateStr,
            status: status
          });
        } else {
          await dbRun(`
            INSERT INTO appointments 
            (id, lead_id, appointment_type, original_date, original_booked_at, current_date, status, created_at)
            VALUES (?, ?, 'konzept', ?, CURRENT_TIMESTAMP, ?, ?, CURRENT_TIMESTAMP)
          `, [appointmentId, leadRecord.id, dateStr, dateStr, status]);
        }

        synced++;
        } catch (oppError) {
          errors++;
          console.error(`Fehler beim Synchronisieren von Opportunity ${opp.close_opportunity_id}:`, oppError.message);
          // Weiter mit nächster Opportunity
        }
      }

      console.log(`${synced} Konzept-Gespräche synchronisiert, ${errors} Fehler.`);
      return synced;
    } catch (error) {
      console.error('Fehler beim Synchronisieren der Konzept-Gespräche:', error);
      throw error;
    }
  }

  // Synchronisiere Umsetzungs-Gespräche (analog zu Konzept)
  async syncUmsetzungsGespraeche() {
    try {
      console.log('Starte Synchronisation der Umsetzungs-Gespräche...');
      const opportunities = await this.closeApi.getOpportunities();
      console.log(`Gefunden: ${opportunities.length} Opportunities`);
      
      const umsetzungStages = [
        'stat_ktKHblC5HAIZ3sqE6SJVSAJypo6u7c8wIPF6geZuI3F', // Umsetzung geplant
        'stat_8HbVPcxbrNePbftAB0XEA3algteiJIioATea2l843sv'  // Umsetzung Won
      ];

      const umsetzungOpps = opportunities.filter(opp => 
        umsetzungStages.includes(opp.stage_id)
      );
      console.log(`Gefunden: ${umsetzungOpps.length} Umsetzungs-Opportunities`);

      let synced = 0;
      let errors = 0;

      for (const opp of umsetzungOpps) {
        try {
        const leadRecord = await dbGet(
          'SELECT id FROM leads WHERE close_lead_id = ?',
          [opp.lead_close_id]
        );
        if (!leadRecord) {
          continue;
        }

        // Speichere Opportunity
        const existingOpp = await dbGet(
          'SELECT id FROM opportunities WHERE close_opportunity_id = ?',
          [opp.close_opportunity_id]
        );

        if (existingOpp) {
          await dbRun(`
            UPDATE opportunities 
            SET name = ?, value = ?, status = ?, stage = ?, stage_id = ?, date_won = ?
            WHERE close_opportunity_id = ?
          `, [
            opp.name,
            opp.value,
            opp.status,
            opp.stage,
            opp.stage_id,
            opp.date_won,
            opp.close_opportunity_id
          ]);
        } else {
          await dbRun(`
            INSERT INTO opportunities 
            (close_opportunity_id, lead_id, name, value, status, stage, stage_id, date_created, date_won, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `, [
            opp.close_opportunity_id,
            leadRecord.id,
            opp.name,
            opp.value,
            opp.status,
            opp.stage,
            opp.stage_id,
            opp.date_created,
            opp.date_won
          ]);
        }

        const appointmentDate = opp.date_created ? new Date(opp.date_created) : new Date();
        const dateStr = appointmentDate.toISOString().split('T')[0];

        const appointmentId = this.generateAppointmentId(
          opp.lead_close_id,
          'umsetzung',
          dateStr
        );

        const status = opp.stage_id === 'stat_8HbVPcxbrNePbftAB0XEA3algteiJIioATea2l843sv' 
          ? 'stattgefunden' 
          : 'geplant';

        const existing = await dbGet(
          'SELECT id, current_date, status FROM appointments WHERE id = ?',
          [appointmentId]
        );

        if (existing) {
          await this.handleAppointmentUpdate(existing, {
            date: dateStr,
            status: status
          });
        } else {
          await dbRun(`
            INSERT INTO appointments 
            (id, lead_id, appointment_type, original_date, original_booked_at, current_date, status, created_at)
            VALUES (?, ?, 'umsetzung', ?, CURRENT_TIMESTAMP, ?, ?, CURRENT_TIMESTAMP)
          `, [appointmentId, leadRecord.id, dateStr, dateStr, status]);
        }

        synced++;
        } catch (oppError) {
          errors++;
          console.error(`Fehler beim Synchronisieren von Opportunity ${opp.close_opportunity_id}:`, oppError.message);
          // Weiter mit nächster Opportunity
        }
      }

      console.log(`${synced} Umsetzungs-Gespräche synchronisiert, ${errors} Fehler.`);
      return synced;
    } catch (error) {
      console.error('Fehler beim Synchronisieren der Umsetzungs-Gespräche:', error);
      throw error;
    }
  }
}

module.exports = AppointmentSyncService;

