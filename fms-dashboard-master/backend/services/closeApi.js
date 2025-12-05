const axios = require('axios');

// Custom Activity Type Definitionen
const ACTIVITY_TYPE_CONFIG = {
  'vorqualifizierung': {
    id: 'actitype_1H3wPemMNkfkmT0nJuEBUT',
    resultField: 'cf_xnH96817ih93fVQRG75NuqlCTJCNTkJ0OHCuup2iPLg',
    name: 'Vorqualifizierung'
  },
  'erstgespraech': {
    id: 'actitype_6VB2MiuFziQxyuzfMzHy7q',
    resultField: 'cf_QDWQYVNx3jMp1Pv0SIvzeoDigjMulHFh5qJQwWcesGZ',
    name: 'Erstgespräch'
  },
  'konzeptgespraech': {
    id: 'actitype_6ftbHtxSEz9wIwdLnovYP0',
    resultField: 'cf_XqpdiUMWiYCaw5uW9DRkSiXlOgBrdZtdEf2L8XmjNhT',
    name: 'Konzeptgespräch'
  },
  'umsetzungsgespraech': {
    id: 'actitype_6nwTHKNbqf3EbQIjORgPg5',
    resultField: 'cf_bd4BlLaCpH6uyfldREh1t9MAv7OCRcrZ5CxzJbpUIJf',
    name: 'Umsetzungsgespräch'
  },
  'servicegespraech': {
    id: 'actitype_7dOp29fi26OKZQeXd9bCYP',
    resultField: 'cf_PZvw6SxG2UlSSQNQeDmu63gdMTDP24JG6kfxWB8RXH4',
    name: 'Servicegespräch'
  }
};

class CloseApiService {
  constructor() {
    this.apiKey = process.env.CLOSE_API_KEY;
    this.baseURL = 'https://api.close.com/api/v1';
    
    if (!this.apiKey) {
      throw new Error('CLOSE_API_KEY ist nicht in der .env Datei definiert');
    }
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Cache für Outcomes (outcome_id -> name)
    this.outcomesCache = null;
  }

  // Lade alle Outcomes und cachiere sie
  async getOutcomes() {
    if (this.outcomesCache) {
      return this.outcomesCache;
    }

    try {
      let allOutcomes = [];
      let hasMore = true;
      let cursor = null;

      while (hasMore) {
        const params = { _limit: 100 };
        if (cursor) {
          params._skip = cursor;
        }

        const response = await this.client.get('/outcome/', { params });
        const outcomes = response.data.data || [];
        allOutcomes = allOutcomes.concat(outcomes);

        cursor = response.data.next_cursor;
        hasMore = !!cursor;
      }

      // Erstelle Map: outcome_id -> name
      this.outcomesCache = {};
      allOutcomes.forEach(outcome => {
        if (outcome.id && outcome.name) {
          this.outcomesCache[outcome.id] = outcome.name;
        }
      });

      return this.outcomesCache;
    } catch (error) {
      console.error('Fehler beim Abrufen der Outcomes:', error.message);
      return {};
    }
  }

  // Hole alle Benutzer
  async getUsers() {
    try {
      const response = await this.client.get('/user/');
      // Close API gibt { data: [...users...] } zurück
      const usersData = response.data.data || [response.data];
      const users = Array.isArray(usersData) ? usersData : [usersData];
      
      return users
        .filter(user => user && user.id) // Filtere User ohne ID
        .map(user => {
          // Erstelle Namen aus verschiedenen Quellen
          let name = '';
          if (user.display_name) {
            name = user.display_name;
          } else if (user.first_name || user.last_name) {
            name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
          } else if (user.email) {
            name = user.email.split('@')[0]; // Fallback: E-Mail Prefix
          }
          
          return {
            close_user_id: user.id,
            name: name || null,
            email: user.email || null
          };
        });
    } catch (error) {
      console.error('Fehler beim Abrufen der Benutzer:', error.message);
      throw error;
    }
  }

  // Hole alle Leads
  async getLeads() {
    try {
      let allLeads = [];
      let hasMore = true;
      let cursor = null;

      while (hasMore) {
        const params = { _limit: 100 };
        if (cursor) {
          params._skip = cursor;
        }

        const response = await this.client.get('/lead/', { params });
        const leads = response.data.data || [];
        allLeads = allLeads.concat(leads);

        cursor = response.data.next_cursor;
        hasMore = !!cursor;
      }

      return allLeads.map(lead => {
        // Extrahiere Custom Fields für Erstkontakt
        const firstContactFieldId = 'cf_ih8RALRXxBvOZ5cqYnn8uabiMojL37lB7Aa10PN9xMK';
        const firstContactDate = lead[`custom.${firstContactFieldId}`] || null;
        
        return {
          close_lead_id: lead.id,
          name: lead.name || lead.display_name || null,
          email: lead.contacts?.[0]?.emails?.[0]?.email || null,
          phone: lead.contacts?.[0]?.phones?.[0]?.phone || null,
          status: lead.status_label || null,
          first_contact_date: firstContactDate,
          assigned_user_id: lead.created_by || lead.user_id || null,
          date_created: lead.date_created || null
        };
      });
    } catch (error) {
      console.error('Fehler beim Abrufen der Leads:', error.message);
      throw error;
    }
  }

  // Hole alle Call Activities
  async getCalls(startDate = null, endDate = null) {
    try {
      // Lade Outcomes einmal und cachiere sie
      const outcomes = await this.getOutcomes();
      
      let allCalls = [];
      let hasMore = true;
      let cursor = null;

      const params = {
        _limit: 100,
        type: 'call'
      };

      if (startDate) {
        params.date_created__gte = startDate;
      }
      if (endDate) {
        params.date_created__lte = endDate;
      }

      while (hasMore) {
        if (cursor) {
          params._skip = cursor;
        }

        const response = await this.client.get('/activity/call/', { params });
        const calls = response.data.data || [];
        allCalls = allCalls.concat(calls);

        cursor = response.data.next_cursor;
        hasMore = !!cursor;
      }

      return allCalls.map(call => {
        // Bestimme Direction
        let direction = call.direction || 'outbound';
        if (call.direction === 'incoming' || call.direction === 'inbound') {
          direction = 'inbound';
        }
        
        // Hole call_status (automatisch von Close)
        const status = call.status || null;
        
        // Hole Outcome-Name aus outcome_id (manuell vom User)
        let disposition = null;
        if (call.outcome_id && outcomes[call.outcome_id]) {
          disposition = outcomes[call.outcome_id];
        }
        // Falls kein outcome_id gesetzt, bleibt disposition null
        
        return {
          close_call_id: call.id,
          user_close_id: call.created_by || call.user_id || call.user?.id || null,
          lead_close_id: call.lead_id || call.lead?.id || null,
          direction: direction || null,
          status: status,
          disposition: disposition,
          duration: call.duration || 0,
          call_date: call.date_created || call.created || call.activity_at || new Date().toISOString(),
          note: call.note || call.note_html || null
        };
      });
    } catch (error) {
      console.error('Fehler beim Abrufen der Calls:', error.message);
      throw error;
    }
  }


  // Hole Calls für einen bestimmten Zeitraum
  async getCallsByDateRange(startDate, endDate) {
    return await this.getCalls(startDate, endDate);
  }

  // Hole Custom Activities (z.B. Vorqualifizierung)
  async getCustomActivities(activityTypeId, daysBack = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      let allActivities = [];
      let hasMore = true;
      let cursor = null;

      // Close API erfordert lead_id wenn _type verwendet wird
      // Also holen wir alle Activities und filtern dann
      const params = {
        _limit: 100
      };

      if (startDate) {
        params.date_created__gte = startDate.toISOString();
      }
      if (endDate) {
        params.date_created__lte = endDate.toISOString();
      }

      while (hasMore) {
        if (cursor) {
          params._skip = cursor;
        }

        const response = await this.client.get('/activity/', { params });
        const activities = response.data.data || [];
        
        // Filtere nach CustomActivity und custom_activity_type_id
        const filteredActivities = activities.filter(activity => 
          activity._type === 'CustomActivity' && 
          activity.custom_activity_type_id === activityTypeId
        );
        
        allActivities = allActivities.concat(filteredActivities);

        cursor = response.data.next_cursor;
        hasMore = !!cursor;
      }

      return allActivities.map(activity => {
        // Extrahiere Custom Fields aus custom.cf_XXX Feldern
        const customFields = {};
        Object.keys(activity).forEach(key => {
          if (key.startsWith('custom.')) {
            const fieldId = key.replace('custom.', '');
            customFields[fieldId] = activity[key];
          }
        });
        
        // Mappe Custom Field IDs zu den richtigen Feldern
        // Field ID Mappings für Vorqualifizierung
        const FIELD_IDS = {
          ergebnis: 'cf_xnH96817ih93fVQRG75NuqlCTJCNTkJ0OHCuup2iPLg',
          erstgespraech_gebucht: 'cf_J4EvdMCZfoPTlSrPzzNg5WfVBmkfPPjc7sVqq5cBjOy'
          // Budget, Hauptbedarf, Dringlichkeit: Field IDs noch zu ermitteln
        };
        
        // Extrahiere die Werte basierend auf den Field IDs
        const ergebnis = customFields[FIELD_IDS.ergebnis] || null;
        const erstgespraech_gebucht = customFields[FIELD_IDS.erstgespraech_gebucht] || null;
        
        // Budget: Suche nach numerischem Wert in den Custom Fields
        let budget_monat = null;
        for (const [fieldId, value] of Object.entries(customFields)) {
          if (fieldId !== FIELD_IDS.ergebnis && fieldId !== FIELD_IDS.erstgespraech_gebucht) {
            if (typeof value === 'number') {
              budget_monat = value;
              break;
            } else if (typeof value === 'string' && !isNaN(parseInt(value)) && parseInt(value) > 0) {
              budget_monat = parseInt(value);
              break;
            }
          }
        }
        
        // Hauptbedarf & Dringlichkeit: Noch zu ermitteln, vorerst null
        const hauptbedarf = null;
        const dringlichkeit = null;
        
        return {
          close_activity_id: activity.id,
          activity_type: activity.custom_activity_type_id || activityTypeId,
          lead_close_id: activity.lead_id || activity.lead?.id || null,
          user_close_id: activity.created_by || activity.user_id || activity.user?.id || null,
          ergebnis: ergebnis,
          erstgespraech_gebucht: erstgespraech_gebucht,
          budget_monat: budget_monat,
          hauptbedarf: hauptbedarf,
          dringlichkeit: dringlichkeit,
          custom_fields_json: JSON.stringify(customFields), // Speichere alle Custom Fields als JSON für später
          created_at: activity.date_created || activity.created || activity.activity_at || new Date().toISOString()
        };
      });
    } catch (error) {
      console.error('Fehler beim Abrufen der Custom Activities:', error.message);
      throw error;
    }
  }

  // Hole Opportunities
  async getOpportunities() {
    try {
      let allOpportunities = [];
      let hasMore = true;
      let cursor = null;

      while (hasMore) {
        const params = { _limit: 100 };
        if (cursor) {
          params._skip = cursor;
        }

        const response = await this.client.get('/opportunity/', { params });
        const opportunities = response.data.data || [];
        allOpportunities = allOpportunities.concat(opportunities);

        cursor = response.data.next_cursor;
        hasMore = !!cursor;
      }

      return allOpportunities.map(opp => ({
        close_opportunity_id: opp.id,
        lead_close_id: opp.lead_id || opp.lead?.id || null,
        name: opp.title || opp.name || null,
        value: opp.value || opp.expected_value || null,
        status: opp.status || null,
        stage: opp.status_label || null,
        stage_id: opp.status_id || null,
        date_created: opp.date_created || null,
        date_won: opp.date_won || null
      }));
    } catch (error) {
      console.error('Fehler beim Abrufen der Opportunities:', error.message);
      throw error;
    }
  }

  // Hole Leads mit Status "Meeting Set (Erstgespräch)" oder mit Erstgespräch Custom Field
  async getLeadsWithErstgespraech() {
    try {
      let allLeads = [];
      let hasMore = true;
      let cursor = null;

      // Custom Field IDs für Erstgespräch
      const erstgespraechAmFieldId = 'cf_2arIU8t0lSdYvqH0AhbRibqtsdNkqgdnUjtLRfFbMvY';
      const erstgespraechErgebnisFieldId = 'cf_R6soD8Lk4WLvdfmeFS1UEkiFJyDrZkTkxYAvO6Vy5tV';

      // Hole ALLE Leads (nicht nur mit Status-Filter, da Close API Filter manchmal nicht funktioniert)
      while (hasMore) {
        const params = { _limit: 100 };
        if (cursor) {
          params._skip = cursor;
        }

        const response = await this.client.get('/lead/', { params });
        const leads = response.data.data || [];
        allLeads = allLeads.concat(leads);

        cursor = response.data.next_cursor;
        hasMore = !!cursor;
      }

      // Filtere Leads: Entweder Status "Meeting Set (Erstgespräch)" ODER Custom Field "Erstgespräch am" ist gesetzt
      return allLeads
        .filter(lead => {
          const status = lead.status_label || '';
          const erstgespraechAm = lead[`custom.${erstgespraechAmFieldId}`] || null;
          
          // Entweder Status passt ODER Erstgespräch-Datum ist gesetzt
          return status.includes('Meeting Set') || status.includes('Erstgespräch') || erstgespraechAm !== null;
        })
        .map(lead => {
          const erstgespraechAm = lead[`custom.${erstgespraechAmFieldId}`] || null;
          const erstgespraechErgebnis = lead[`custom.${erstgespraechErgebnisFieldId}`] || null;

          return {
            close_lead_id: lead.id,
            name: lead.name || lead.display_name || null,
            status: lead.status_label || null,
            erstgespraech_am: erstgespraechAm,
            erstgespraech_ergebnis: erstgespraechErgebnis,
            assigned_user_id: lead.assigned_to || lead.created_by || lead.user_id || null,
            date_created: lead.date_created || null
          };
        });
    } catch (error) {
      console.error('Fehler beim Abrufen der Leads mit Erstgespräch:', error.message);
      throw error;
    }
  }

  // Hole Custom Activity "Erstgespräch" für einen Lead
  async getErstgespraechActivity(leadId) {
    try {
      const params = {
        _limit: 100,
        lead_id: leadId,
        _type: 'CustomActivity'
      };

      const response = await this.client.get('/activity/', { params });
      const activities = response.data.data || [];

      // Filtere nach Erstgespräch Activity Type
      // TODO: Activity Type ID für Erstgespräch ermitteln
      const erstgespraechActivity = activities.find(activity => 
        activity._type === 'CustomActivity' && 
        activity.custom_activity_type_id // Hier die richtige ID einfügen
      );

      if (!erstgespraechActivity) {
        return null;
      }

      // Extrahiere Custom Fields
      const customFields = {};
      Object.keys(erstgespraechActivity).forEach(key => {
        if (key.startsWith('custom.')) {
          const fieldId = key.replace('custom.', '');
          customFields[fieldId] = erstgespraechActivity[key];
        }
      });

      return {
        close_activity_id: erstgespraechActivity.id,
        lead_close_id: leadId,
        user_close_id: erstgespraechActivity.created_by || erstgespraechActivity.user_id || null,
        result: customFields.result || null,
        result_details: JSON.stringify(customFields),
        created_at: erstgespraechActivity.date_created || erstgespraechActivity.created || null
      };
    } catch (error) {
      console.error('Fehler beim Abrufen der Erstgespräch Activity:', error.message);
      return null;
    }
  }

  // Hole Custom Activities eines bestimmten Typs
  async getCustomActivities(activityTypeId, daysBack = 90) {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - daysBack);
    
    try {
      let allActivities = [];
      let hasMore = true;
      let cursor = null;

      while (hasMore) {
        const params = {
          _type: activityTypeId,
          date_created__gte: dateFrom.toISOString(),
          _limit: 100
        };
        
        if (cursor) {
          params._skip = cursor;
        }

        const response = await this.client.get('/activity/', { params });
        const activities = response.data.data || [];
        allActivities = allActivities.concat(activities);

        cursor = response.data.next_cursor;
        hasMore = !!cursor;
      }
      
      return allActivities;
    } catch (error) {
      console.error(`Error fetching custom activities (${activityTypeId}):`, error.message);
      return [];
    }
  }

  // Hole Custom Activities mit flexiblen Filtern
  async getCustomActivitiesWithFilters(filters = {}) {
    try {
      let allActivities = [];
      let hasMore = true;
      let skip = 0;
      const limit = 100;

      // Close API erwartet bestimmte Parameter-Formate
      // Entferne _type aus filters, da wir das manuell filtern
      const { _type, custom_activity_type_id, date_created__gte, date_created__lte, ...otherFilters } = filters;

      while (hasMore) {
        const params = {
          _limit: limit
        };

        if (skip > 0) {
          params._skip = skip;
        }

        // Füge Datum-Filter hinzu (wenn vorhanden) - Close API Format
        if (date_created__gte) {
          params.date_created__gte = date_created__gte;
        }
        if (date_created__lte) {
          params.date_created__lte = date_created__lte;
        }

        // Füge andere Filter hinzu
        Object.assign(params, otherFilters);

        try {
          const response = await this.client.get('/activity/', { params });
          const activities = response.data.data || [];
        
          // Filtere nur Custom Activities und nach custom_activity_type_id
          const customActivities = activities.filter(activity => {
            if (activity._type !== 'CustomActivity') return false;
            if (custom_activity_type_id && activity.custom_activity_type_id !== custom_activity_type_id) {
              return false;
            }
            return true;
          });
        
          // Füge Activities direkt hinzu (Lead-Info wird später in API-Route geholt)
          // Das ist schneller als für jede Activity einzeln die Close API zu fragen
          allActivities.push(...customActivities);
        
          hasMore = response.data.has_more || false;
          skip += limit;
        } catch (apiError) {
          console.error('[CloseApi] API Fehler:', apiError.message);
          if (apiError.response) {
            console.error('[CloseApi] Status:', apiError.response.status);
            console.error('[CloseApi] Data:', JSON.stringify(apiError.response.data).substring(0, 200));
          }
          // Bei Fehler: versuche ohne Filter
          if (skip === 0 && Object.keys(filters).length > 0) {
            console.log('[CloseApi] Versuche ohne spezifische Filter...');
            // Retry ohne custom_activity_type_id Filter
            const retryParams = { _limit: limit };
            if (date_created__gte) retryParams.date_created__gte = date_created__gte;
            if (date_created__lte) retryParams.date_created__lte = date_created__lte;
            
            try {
              const retryResponse = await this.client.get('/activity/', { params: retryParams });
              const retryActivities = retryResponse.data.data || [];
              const filtered = retryActivities.filter(a => 
                a._type === 'CustomActivity' && 
                (!custom_activity_type_id || a.custom_activity_type_id === custom_activity_type_id)
              );
              allActivities.push(...filtered);
            } catch (retryError) {
              console.error('[CloseApi] Retry fehlgeschlagen:', retryError.message);
            }
          }
          break; // Beende Loop bei Fehler
        }
        
        // Sicherheitscheck: Max 10000 Activities
        if (allActivities.length >= 10000) {
          console.warn('Maximale Anzahl von Activities erreicht (10000)');
          break;
        }
      }

      console.log(`[CloseApi] ${allActivities.length} Custom Activities geladen`);
      return allActivities;
    } catch (error) {
      console.error('Fehler beim Abrufen der Custom Activities mit Filtern:', error.message);
      if (error.response) {
        console.error('Response Status:', error.response.status);
        console.error('Response Data:', error.response.data);
      }
      return [];
    }
  }

  // Hole ALLE Custom Activities eines Types
  // WICHTIG: Close API erfordert lead_id wenn _type verwendet wird
  // Daher verwenden wir getCustomActivitiesWithFilters, die alle Activities holt und dann filtert
  async getCustomActivitiesByType(activityTypeId, startDate = null, endDate = null) {
    try {
      // Verwende die bestehende getCustomActivitiesWithFilters Methode
      const filters = {
        custom_activity_type_id: activityTypeId
      };
      
      if (startDate) {
        filters.date_created__gte = startDate;
      }
      if (endDate) {
        filters.date_created__lte = endDate;
      }
      
      console.log(`  → Using getCustomActivitiesWithFilters with filters:`, JSON.stringify(filters, null, 2));
      
      const activities = await this.getCustomActivitiesWithFilters(filters);
      
      console.log(`  → Found ${activities.length} activities for type ${activityTypeId}`);
      
      return activities;
    } catch (error) {
      console.error(`Error in getCustomActivitiesByType:`, error.message);
      return [];
    }
  }
  
  // Hole Lead-Details (für E-Mail)
  async getLeadDetails(leadId) {
    try {
      const response = await this.client.get(`/lead/${leadId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching lead ${leadId}:`, error.message);
      return null;
    }
  }
  
  // Hole User-Details (für E-Mail)
  async getUserDetails(userId) {
    try {
      const response = await this.client.get(`/user/${userId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error.message);
      return null;
    }
  }
}

// Exportiere Config für andere Services
CloseApiService.ACTIVITY_TYPE_CONFIG = ACTIVITY_TYPE_CONFIG;

module.exports = CloseApiService;

