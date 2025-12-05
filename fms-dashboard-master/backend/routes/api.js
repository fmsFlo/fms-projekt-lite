const express = require('express');
const router = express.Router();
const { dbGet, dbAll, dbRun } = require('../database/db');
const SyncService = require('../services/syncService');
const CloseApiService = require('../services/closeApi');

// GET /api/stats/calls - Anrufversuche tracken
router.get('/stats/calls', async (req, res) => {
  try {
    const { startDate, endDate, userId, period = 'day' } = req.query;
    
    let groupBy = "DATE(call_date)";
    
    if (period === 'week') {
      groupBy = "strftime('%Y-W%W', call_date)";
    } else if (period === 'month') {
      groupBy = "strftime('%Y-%m', call_date)";
    }
    
    let query = `
      SELECT 
        ${groupBy} as period,
        COUNT(*) as total_calls,
        SUM(CASE 
          WHEN status = 'completed' AND duration > 0 
          THEN 1 
          ELSE 0 
        END) as reached,
        SUM(CASE 
          WHEN status IN ('no_answer', 'busy', 'failed', 'canceled')
          OR (status = 'completed' AND duration = 0)
          THEN 1 
          ELSE 0 
        END) as not_reached
      FROM calls
      WHERE direction = 'outbound'
    `;
    
    const params = [];
    
    if (startDate) {
      query += ' AND call_date >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND call_date <= ?';
      params.push(endDate);
    }
    
    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }
    
    query += ` GROUP BY ${groupBy} ORDER BY period DESC LIMIT 100`;
    
    const results = await dbAll(query, params);
    res.json(results);
  } catch (error) {
    console.error('Fehler bei /api/stats/calls:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stats/outcomes - Call Outcomes
router.get('/stats/outcomes', async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    
    let query = `
      SELECT 
        COALESCE(disposition, 'Unknown') as outcome,
        COUNT(*) as count
      FROM calls
      WHERE 1=1
    `;
    
    const params = [];
    
    if (startDate) {
      query += ' AND call_date >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND call_date <= ?';
      params.push(endDate);
    }
    
    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }
    
    query += ' GROUP BY disposition ORDER BY count DESC';
    
    const results = await dbAll(query, params);
    res.json(results);
  } catch (error) {
    console.error('Fehler bei /api/stats/outcomes:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stats/best-time - Beste Erreichbarkeit nach Uhrzeit
router.get('/stats/best-time', async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    
    let query = `
      SELECT 
        strftime('%H', call_date) as hour,
        COUNT(*) as total_calls,
        SUM(CASE 
          WHEN status = 'completed' AND duration > 0 
          THEN 1 
          ELSE 0 
        END) as reached,
        CAST(SUM(CASE 
          WHEN status = 'completed' AND duration > 0 
          THEN 1 
          ELSE 0 
        END) AS FLOAT) / COUNT(*) * 100 as success_rate
      FROM calls
      WHERE direction = 'outbound'
    `;
    
    const params = [];
    
    if (startDate) {
      query += ' AND call_date >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND call_date <= ?';
      params.push(endDate);
    }
    
    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }
    
    query += ' GROUP BY hour HAVING total_calls >= 3 ORDER BY success_rate DESC, hour ASC';
    
    const results = await dbAll(query, params);
    res.json(results);
  } catch (error) {
    console.error('Fehler bei /api/stats/best-time:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stats/duration - Gesprächszeit
router.get('/stats/duration', async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    
    let query = `
      SELECT 
        SUM(duration) as total_duration,
        AVG(duration) as avg_duration,
        COUNT(*) as total_calls,
        SUM(CASE WHEN disposition LIKE 'Termin vereinbart%' THEN duration ELSE 0 END) as appointment_duration,
        SUM(CASE WHEN disposition LIKE 'Termin vereinbart%' THEN 1 ELSE 0 END) as appointment_count
      FROM calls
      WHERE status = 'completed' AND duration > 0
    `;
    
    const params = [];
    
    if (startDate) {
      query += ' AND call_date >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND call_date <= ?';
      params.push(endDate);
    }
    
    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }
    
    const result = await dbGet(query, params);
    
    const response = {
      total_duration: result?.total_duration || 0,
      avg_duration: Math.round(result?.avg_duration || 0),
      total_calls: result?.total_calls || 0,
      appointment_duration: result?.appointment_duration || 0,
      appointment_count: result?.appointment_count || 0,
      avg_per_appointment: result?.appointment_count > 0 
        ? Math.round(result.appointment_duration / result.appointment_count) 
        : 0
    };
    
    res.json(response);
  } catch (error) {
    console.error('Fehler bei /api/stats/duration:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users - Alle Benutzer
router.get('/users', async (req, res) => {
  try {
    // Hole Close Users
    const closeUsers = await dbAll('SELECT * FROM users WHERE close_user_id != ? AND close_user_id NOT LIKE ? ORDER BY name', ['UNKNOWN_USER', 'CALENDLY_%']);
    
    const allUsers = closeUsers;
    
    // Dedupliziere: Wenn mehrere User den gleichen Namen haben, zeige E-Mail zur Unterscheidung
    const usersMap = new Map();
    allUsers.forEach(user => {
      const key = user.name || 'Unbekannt';
      if (!usersMap.has(key)) {
        usersMap.set(key, []);
      }
      usersMap.get(key).push(user);
    });
    
    // Wenn mehrere User den gleichen Namen haben, füge E-Mail zum Namen hinzu
    const deduplicatedUsers = [];
    usersMap.forEach((userList, name) => {
      if (userList.length === 1) {
        deduplicatedUsers.push(userList[0]);
      } else {
        // Mehrere User mit gleichem Namen - füge E-Mail hinzu
        userList.forEach(user => {
          deduplicatedUsers.push({
            ...user,
            name: user.email ? `${user.name} (${user.email.split('@')[0]})` : user.name
          });
        });
      }
    });
    
    res.json(deduplicatedUsers);
  } catch (error) {
    console.error('Fehler bei /api/users:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/leads - Alle Leads
router.get('/leads', async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const leads = await dbAll(
      'SELECT * FROM leads ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [parseInt(limit), parseInt(offset)]
    );
    res.json(leads);
  } catch (error) {
    console.error('Fehler bei /api/leads:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/calls - Alle Calls mit Filtern
router.get('/calls', async (req, res) => {
  try {
    const { startDate, endDate, userId, limit = 100, offset = 0 } = req.query;
    
    let query = `
      SELECT c.*, u.name as user_name, l.name as lead_name
      FROM calls c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN leads l ON c.lead_id = l.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (startDate) {
      query += ' AND c.call_date >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND c.call_date <= ?';
      params.push(endDate);
    }
    
    if (userId) {
      query += ' AND c.user_id = ?';
      params.push(userId);
    }
    
    query += ' ORDER BY c.call_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const calls = await dbAll(query, params);
    res.json(calls);
  } catch (error) {
    console.error('Fehler bei /api/calls:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stats/unassigned - Calls ohne zugeordneten User
router.get('/stats/unassigned', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT COUNT(*) as count
      FROM calls
      WHERE user_id IN (SELECT id FROM users WHERE close_user_id = 'UNKNOWN_USER')
    `;
    
    const params = [];
    
    if (startDate) {
      query += ' AND call_date >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND call_date <= ?';
      params.push(endDate);
    }
    
    const result = await dbGet(query, params);
    res.json({ unassignedCalls: result?.count || 0 });
  } catch (error) {
    console.error('Fehler bei /api/stats/unassigned:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stats/funnel - Conversion Funnel Statistiken
router.get('/stats/funnel', async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    
    let dateFilter = '';
    const params = [];
    
    if (startDate) {
      dateFilter += ' AND created_at >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      dateFilter += ' AND created_at <= ?';
      params.push(endDate);
    }
    
    // 1. Leads erstellt
    const leadsQuery = `SELECT COUNT(DISTINCT id) as count FROM leads WHERE 1=1 ${dateFilter}`;
    const leadsResult = await dbGet(leadsQuery, params);
    const leadsCreated = leadsResult?.count || 0;
    
    // 2. Kontaktiert (mindestens 1 Call) - UNIQUE lead_ids
    let contactedParams = [...params];
    let contactedFilter = dateFilter.replace('created_at', 'c.call_date');
    if (userId) {
      contactedFilter += ' AND c.user_id = ?';
      contactedParams.push(userId);
    }
    const contactedQuery = `
      SELECT COUNT(DISTINCT c.lead_id) as count
      FROM calls c
      WHERE c.lead_id IS NOT NULL 
        AND c.direction = 'outbound'
        ${contactedFilter}
    `;
    const contactedResult = await dbGet(contactedQuery, contactedParams);
    const contacted = contactedResult?.count || 0;
    
    // 3. Erreicht - UNIQUE lead_ids mit konsistenter Logik
    // Erreicht = (duration > 0) OR (disposition IS NOT NULL AND disposition NOT IN ('Nicht erreicht', 'Mailbox', 'Falsche Nummer'))
    let reachedParams = [...contactedParams];
    const reachedQuery = `
      SELECT COUNT(DISTINCT c.lead_id) as count
      FROM calls c
      WHERE c.lead_id IS NOT NULL 
        AND c.direction = 'outbound'
        AND (
          (c.status = 'completed' AND c.duration > 0)
          OR (
            c.disposition IS NOT NULL 
            AND c.disposition NOT IN ('Nicht erreicht', 'Mailbox', 'Falsche Nummer')
          )
        )
        ${contactedFilter}
    `;
    const reachedResult = await dbGet(reachedQuery, reachedParams);
    const reached = reachedResult?.count || 0;
    
    // 4. Termin vereinbart (mindestens 1 Call mit disposition = 'Termin vereinbart...') - UNIQUE lead_ids
    let meetingParams = [...contactedParams];
    const meetingQuery = `
      SELECT COUNT(DISTINCT c.lead_id) as count
      FROM calls c
      WHERE c.lead_id IS NOT NULL 
        AND c.direction = 'outbound'
        AND c.disposition LIKE 'Termin vereinbart%' 
        ${contactedFilter}
    `;
    const meetingResult = await dbGet(meetingQuery, meetingParams);
    const meetingSet = meetingResult?.count || 0;
    
    // 5. Durchschnittliche Versuche bis erreicht
    // Für jeden Lead: Anzahl Calls bis zum ersten "erreichten" Call
    // Erreicht = (duration > 0) OR (disposition IS NOT NULL AND disposition NOT IN ('Nicht erreicht', 'Mailbox', 'Falsche Nummer'))
    const avgAttemptsQuery = `
      WITH first_reached AS (
        SELECT 
          c.lead_id,
          MIN(c.call_date) as first_reached_date
        FROM calls c
        WHERE c.lead_id IS NOT NULL 
          AND c.direction = 'outbound'
          AND (
            (c.status = 'completed' AND c.duration > 0)
            OR (
              c.disposition IS NOT NULL 
              AND c.disposition NOT IN ('Nicht erreicht', 'Mailbox', 'Falsche Nummer')
            )
          )
          ${contactedFilter}
        GROUP BY c.lead_id
      ),
      lead_attempts AS (
        SELECT 
          c.lead_id,
          COUNT(*) as attempts_to_reach
        FROM calls c
        INNER JOIN first_reached fr ON c.lead_id = fr.lead_id
        WHERE c.direction = 'outbound'
          AND c.call_date <= fr.first_reached_date 
          ${contactedFilter}
        GROUP BY c.lead_id
      )
      SELECT AVG(attempts_to_reach) as avg_attempts
      FROM lead_attempts
    `;
    const avgAttemptsResult = await dbGet(avgAttemptsQuery, contactedParams);
    const avgAttemptsToReach = avgAttemptsResult?.avg_attempts 
      ? Math.round(avgAttemptsResult.avg_attempts * 10) / 10 
      : 0;
    
    // 6. Terminquote (meetingSet / reached * 100)
    // Wenn meetingSet > reached, dann basiere auf contacted
    const meetingRate = reached > 0 
      ? Math.round((Math.min(meetingSet, reached) / reached) * 100) 
      : (contacted > 0 ? Math.round((meetingSet / contacted) * 100) : 0);
    
    res.json({
      leadsCreated,
      contacted,
      reached,
      meetingSet,
      avgAttemptsToReach,
      meetingRate
    });
  } catch (error) {
    console.error('Fehler bei /api/stats/funnel:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stats/qualification - Qualifizierungs-Statistiken
router.get('/stats/qualification', async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    
    let dateFilter = '';
    const params = [];
    
    if (startDate) {
      dateFilter += ' AND call_date >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      dateFilter += ' AND call_date <= ?';
      params.push(endDate);
    }
    
    let userFilter = '';
    if (userId) {
      userFilter = ' AND c.user_id = ?';
      params.push(userId);
    }
    
    // 1. Total Reached (Calls mit duration > 0 oder disposition gesetzt)
    const totalReachedQuery = `
      SELECT COUNT(DISTINCT c.lead_id) as count
      FROM calls c
      WHERE c.lead_id IS NOT NULL
        AND (c.status = 'completed' AND c.duration > 0 OR c.disposition IS NOT NULL)
        ${dateFilter}
        ${userFilter}
    `;
    const totalReachedResult = await dbGet(totalReachedQuery, params);
    const totalReached = totalReachedResult?.count || 0;
    
    // 2. Activities Filled (Anzahl ausgefüllte Vorqualifizierungen)
    let activitiesParams = [];
    let activitiesFilter = '';
    if (startDate) {
      activitiesFilter += ' AND ca.created_at >= ?';
      activitiesParams.push(startDate);
    }
    if (endDate) {
      activitiesFilter += ' AND ca.created_at <= ?';
      activitiesParams.push(endDate);
    }
    if (userId) {
      activitiesFilter += ' AND ca.user_id = ?';
      activitiesParams.push(userId);
    }
    const activitiesFilledQuery = `
      SELECT COUNT(DISTINCT ca.lead_id) as count
      FROM custom_activities ca
      WHERE ca.activity_type = 'actitype_1H3wPemMNkfkmT0nJuEBUT'
        AND ca.lead_id IS NOT NULL
        AND ca.custom_fields_json IS NOT NULL
        ${activitiesFilter}
    `;
    const activitiesFilledResult = await dbGet(activitiesFilledQuery, activitiesParams);
    const activitiesFilled = activitiesFilledResult?.count || 0;
    
    // 3. Compliance Rate
    const complianceRate = totalReached > 0 
      ? Math.round((activitiesFilled / totalReached) * 100) 
      : 0;
    
    // 4. Qualified Leads (Wo Ergebnis positiv)
    const qualifiedQuery = `
      SELECT COUNT(DISTINCT ca.lead_id) as count
      FROM custom_activities ca
      WHERE ca.activity_type = 'actitype_1H3wPemMNkfkmT0nJuEBUT'
        AND ca.lead_id IS NOT NULL
        AND ca.result_value IS NOT NULL
        AND (ca.result_value LIKE '%qualifiziert%' OR ca.result_value LIKE '%positiv%' OR ca.result_value LIKE '%Ja%')
        ${activitiesFilter}
    `;
    const qualifiedResult = await dbGet(qualifiedQuery, activitiesParams);
    const qualifiedLeads = qualifiedResult?.count || 0;
    
    // 5. Meetings Booked (Wo Erstgespräch gebucht = Ja)
    const meetingsQuery = `
      SELECT COUNT(DISTINCT ca.lead_id) as count
      FROM custom_activities ca
      WHERE ca.activity_type = 'actitype_1H3wPemMNkfkmT0nJuEBUT'
        AND ca.lead_id IS NOT NULL
        AND (ca.erstgespraech_gebucht LIKE '%Ja%' OR ca.erstgespraech_gebucht LIKE '%ja%' OR ca.erstgespraech_gebucht = 'Yes')
        ${activitiesFilter}
    `;
    const meetingsResult = await dbGet(meetingsQuery, activitiesParams);
    const meetingsBooked = meetingsResult?.count || 0;
    
    // 6. Conversion Rate
    const conversionRate = qualifiedLeads > 0 
      ? Math.round((meetingsBooked / qualifiedLeads) * 100) 
      : 0;
    
    // 7. Average Budget
    const avgBudgetQuery = `
      SELECT AVG(ca.budget_monat) as avg_budget
      FROM custom_activities ca
      WHERE ca.activity_type = 'actitype_1H3wPemMNkfkmT0nJuEBUT'
        AND ca.budget_monat IS NOT NULL
        AND ca.budget_monat > 0
        ${activitiesFilter}
    `;
    const avgBudgetResult = await dbGet(avgBudgetQuery, activitiesParams);
    const avgBudget = avgBudgetResult?.avg_budget 
      ? Math.round(avgBudgetResult.avg_budget) 
      : 0;
    
    // 8. Top Nicht-Qualifizierungs-Gründe
    const topReasonsQuery = `
      SELECT ca.result_value as reason, COUNT(*) as count
      FROM custom_activities ca
      WHERE ca.activity_type = 'actitype_1H3wPemMNkfkmT0nJuEBUT'
        AND ca.result_value IS NOT NULL
        AND (ca.result_value NOT LIKE '%qualifiziert%' AND ca.result_value NOT LIKE '%positiv%' AND ca.result_value NOT LIKE '%Ja%')
        ${activitiesFilter}
      GROUP BY ca.result_value
      ORDER BY count DESC
      LIMIT 5
    `;
    const topReasonsResult = await dbAll(topReasonsQuery, activitiesParams);
    const topReasons = topReasonsResult.map(item => ({
      reason: item.reason,
      count: item.count
    }));
    
    res.json({
      totalReached,
      activitiesFilled,
      complianceRate,
      qualifiedLeads,
      meetingsBooked,
      conversionRate,
      avgBudget,
      topReasons
    });
  } catch (error) {
    console.error('Fehler bei /api/stats/qualification:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stats/user-activities - Erreichte Calls vs. Custom Activities pro User
router.get('/stats/user-activities', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = '';
    const params = [];
    
    if (startDate) {
      dateFilter += ' AND c.call_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      dateFilter += ' AND c.call_date <= ?';
      params.push(endDate);
    }
    
    const query = `
      SELECT 
        u.id,
        u.name,
        COUNT(DISTINCT CASE 
          WHEN (c.status = 'completed' AND c.duration > 0)
            OR (c.disposition IS NOT NULL 
                AND c.disposition NOT IN ('Nicht erreicht', 'Mailbox', 'Falsche Nummer'))
          THEN c.lead_id 
        END) as reached_calls,
        COUNT(DISTINCT ca.lead_id) as activities_filled
      FROM users u
      LEFT JOIN calls c ON u.id = c.user_id 
        AND c.direction = 'outbound'
        AND c.lead_id IS NOT NULL
        ${dateFilter}
      LEFT JOIN custom_activities ca ON u.id = ca.user_id 
        AND ca.activity_type = 'actitype_1H3wPemMNkfkmT0nJuEBUT'
        AND ca.lead_id IS NOT NULL
        AND ca.custom_fields_json IS NOT NULL
        ${dateFilter.replace('c.call_date', 'ca.created_at')}
      WHERE u.close_user_id != 'UNKNOWN_USER'
      GROUP BY u.id, u.name
      HAVING reached_calls > 0 OR activities_filled > 0
      ORDER BY u.name
    `;
    
    const results = await dbAll(query, [...params, ...params]);
    res.json(results);
  } catch (error) {
    console.error('Fehler bei /api/stats/user-activities:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stats/response-time - Lead Response Time Statistiken
router.get('/stats/response-time', async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;

    let dateFilter = '';
    const params = [];

    if (startDate) {
      dateFilter += ' AND l.created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      dateFilter += ' AND l.created_at <= ?';
      params.push(endDate);
    }

    let userFilter = '';
    if (userId) {
      userFilter = ' AND l.assigned_user_id = ?';
      params.push(userId);
    }

    // Query für Response Time pro User
    const byUserQuery = `
      SELECT 
        l.assigned_user_id as userId,
        u.name as userName,
        COUNT(*) as totalLeads,
        COUNT(l.first_contact_date) as contacted,
        COUNT(*) - COUNT(l.first_contact_date) as notContactedYet,
        AVG(
          CASE 
            WHEN l.first_contact_date IS NOT NULL AND l.created_at IS NOT NULL
            THEN ROUND((JULIANDAY(l.first_contact_date) - JULIANDAY(l.created_at)) * 24, 1)
            ELSE NULL
          END
        ) as avgResponseHours,
        SUM(
          CASE 
            WHEN l.first_contact_date IS NOT NULL AND l.created_at IS NOT NULL
            AND (JULIANDAY(l.first_contact_date) - JULIANDAY(l.created_at)) * 24 < 24 
            THEN 1 ELSE 0 
          END
        ) as under24h,
        SUM(
          CASE 
            WHEN l.first_contact_date IS NOT NULL AND l.created_at IS NOT NULL
            AND (JULIANDAY(l.first_contact_date) - JULIANDAY(l.created_at)) * 24 >= 24
            AND (JULIANDAY(l.first_contact_date) - JULIANDAY(l.created_at)) * 24 < 48
            THEN 1 ELSE 0 
          END
        ) as between24_48h,
        SUM(
          CASE 
            WHEN l.first_contact_date IS NOT NULL AND l.created_at IS NOT NULL
            AND (JULIANDAY(l.first_contact_date) - JULIANDAY(l.created_at)) * 24 >= 48
            THEN 1 ELSE 0 
          END
        ) as over48h
      FROM leads l
      LEFT JOIN users u ON l.assigned_user_id = u.id
      WHERE l.created_at IS NOT NULL
        ${dateFilter}
        ${userFilter}
      GROUP BY l.assigned_user_id, u.name
      HAVING COUNT(*) > 0
      ORDER BY avgResponseHours ASC
    `;

    const byUserResults = await dbAll(byUserQuery, params);

    // Berechne Breakdown-Prozente für jeden User
    const byUser = byUserResults.map(row => {
      const contacted = row.contacted || 0;
      const under24h = row.under24h || 0;
      const between24_48h = row.between24_48h || 0;
      const over48h = row.over48h || 0;

      return {
        userId: row.userId,
        userName: row.userName || 'Nicht zugeordnet',
        totalLeads: row.totalLeads || 0,
        contacted: contacted,
        notContactedYet: row.notContactedYet || 0,
        avgResponseHours: row.avgResponseHours ? Math.round(row.avgResponseHours * 10) / 10 : null,
        breakdown: {
          under24h: {
            count: under24h,
            percentage: contacted > 0 ? Math.round((under24h / contacted) * 100) : 0
          },
          between24_48h: {
            count: between24_48h,
            percentage: contacted > 0 ? Math.round((between24_48h / contacted) * 100) : 0
          },
          over48h: {
            count: over48h,
            percentage: contacted > 0 ? Math.round((over48h / contacted) * 100) : 0
          }
        }
      };
    });

    // Overall Statistiken (aggregiert über alle User)
    const overallQuery = `
      SELECT 
        COUNT(*) as totalLeads,
        COUNT(l.first_contact_date) as contacted,
        AVG(
          CASE 
            WHEN l.first_contact_date IS NOT NULL AND l.created_at IS NOT NULL
            THEN ROUND((JULIANDAY(l.first_contact_date) - JULIANDAY(l.created_at)) * 24, 1)
            ELSE NULL
          END
        ) as avgResponseHours,
        SUM(
          CASE 
            WHEN l.first_contact_date IS NOT NULL AND l.created_at IS NOT NULL
            AND (JULIANDAY(l.first_contact_date) - JULIANDAY(l.created_at)) * 24 < 24 
            THEN 1 ELSE 0 
          END
        ) as under24h,
        SUM(
          CASE 
            WHEN l.first_contact_date IS NOT NULL AND l.created_at IS NOT NULL
            AND (JULIANDAY(l.first_contact_date) - JULIANDAY(l.created_at)) * 24 >= 24
            AND (JULIANDAY(l.first_contact_date) - JULIANDAY(l.created_at)) * 24 < 48
            THEN 1 ELSE 0 
          END
        ) as between24_48h,
        SUM(
          CASE 
            WHEN l.first_contact_date IS NOT NULL AND l.created_at IS NOT NULL
            AND (JULIANDAY(l.first_contact_date) - JULIANDAY(l.created_at)) * 24 >= 48
            THEN 1 ELSE 0 
          END
        ) as over48h
      FROM leads l
      WHERE l.created_at IS NOT NULL
        ${dateFilter}
        ${userFilter}
    `;

    const overallResult = await dbGet(overallQuery, params);

    const overall = {
      totalLeads: overallResult?.totalLeads || 0,
      avgResponseHours: overallResult?.avgResponseHours ? Math.round(overallResult.avgResponseHours * 10) / 10 : null,
      under24h: overallResult?.under24h || 0,
      between24_48h: overallResult?.between24_48h || 0,
      over48h: overallResult?.over48h || 0
    };

    res.json({
      byUser,
      overall
    });
  } catch (error) {
    console.error('Fehler bei /api/stats/response-time:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/test-custom-activity - Debug Endpoint für Custom Activities
router.get('/test-custom-activity', async (req, res) => {
  try {
    const closeApi = new CloseApiService();
    
    // Hole alle Activities (ohne _type Filter, da Close API lead_id benötigt)
    // Dann filtern wir nach CustomActivity und activity_type_id
    const response = await closeApi.client.get('/activity/', {
      params: {
        _limit: 100
      }
    });
    
    const allActivities = response.data.data || [];
    
    // Filtere nach CustomActivity und dann nach activity_type_id
    const customActivities = allActivities.filter(activity => 
      activity._type === 'CustomActivity'
    );
    
    const targetActivityTypeId = 'actitype_1H3wPemMNkfkmT0nJuEBUT';
    const activities = customActivities.filter(activity => 
      activity.custom_activity_type_id === targetActivityTypeId
    );
    
    if (activities.length === 0) {
      // Zeige alle Custom Activities für Debugging
      const customActivityTypes = customActivities.map(a => ({
        id: a.id,
        activity_type_id: a.activity_type_id,
        lead_id: a.lead_id,
        customKeys: a.custom ? Object.keys(a.custom) : []
      })).slice(0, 5);
      
      // Zeige eine vollständige Custom Activity als Beispiel
      const sampleActivity = customActivities[0] || null;
      
      // Extrahiere Custom Fields aus der Sample Activity
      let sampleCustomFields = {};
      let sampleCustomFieldDetails = [];
      if (sampleActivity) {
        Object.keys(sampleActivity).forEach(key => {
          if (key.startsWith('custom.')) {
            const fieldId = key.replace('custom.', '');
            sampleCustomFields[fieldId] = sampleActivity[key];
            sampleCustomFieldDetails.push({
              fieldId: fieldId,
              fullKey: key,
              value: sampleActivity[key],
              type: typeof sampleActivity[key]
            });
          }
        });
      }
      
      return res.json({ 
        message: 'Keine Custom Activities vom Typ "Vorqualifizierung" gefunden',
        hint: 'Prüfe ob der Activity Type ID korrekt ist: actitype_1H3wPemMNkfkmT0nJuEBUT',
        totalActivities: allActivities.length,
        totalCustomActivities: customActivities.length,
        activityTypes: [...new Set(allActivities.map(a => a._type))],
        uniqueActivityTypeIds: [...new Set(customActivities.map(a => a.custom_activity_type_id || a.activity_type_id).filter(Boolean))],
        sampleCustomActivities: customActivityTypes,
        sampleFullActivity: sampleActivity ? {
          ...sampleActivity,
          allFields: Object.keys(sampleActivity),
          custom_activity_type_id: sampleActivity.custom_activity_type_id,
          customFields: sampleCustomFields,
          customFieldDetails: sampleCustomFieldDetails
        } : null
      });
    }
    
    const activity = activities[0];
    
    // Extrahiere Custom Fields (sind als custom.cf_XXX im Activity-Objekt)
    const customFields = {};
    const customFieldDetails = [];
    Object.keys(activity).forEach(key => {
      if (key.startsWith('custom.')) {
        const fieldId = key.replace('custom.', '');
        customFields[fieldId] = activity[key];
        customFieldDetails.push({
          fieldId: fieldId,
          fullKey: key,
          value: activity[key],
          type: typeof activity[key]
        });
      }
    });
    
    // Zeige die Activity mit allen Feldern
    res.json({
      message: 'Custom Activity gefunden',
      totalFound: activities.length,
      activity: activity,
      custom_activity_type_id: activity.custom_activity_type_id,
      customFields: customFields,
      allFields: Object.keys(activity),
      customFieldKeys: Object.keys(customFields),
      customFieldDetails: customFieldDetails
    });
  } catch (error) {
    console.error('Fehler bei /api/test-custom-activity:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.response?.data || null
    });
  }
});

// POST /api/sync - Manuelle Synchronisation
router.post('/sync', async (req, res) => {
  try {
    const syncService = new SyncService();
    const result = await syncService.syncAll();
    res.json({ success: true, message: 'Synchronisation abgeschlossen', result });
  } catch (error) {
    console.error('Fehler bei /api/sync:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/calendly/sync - Nur Calendly synchronisieren
router.post('/calendly/sync', async (req, res) => {
  try {
    const { daysBack = 365 } = req.body; // Standard: letzte 365 Tage (1 Jahr)
    const CalendlySyncService = require('../services/calendlySyncService');
    const calendlySync = new CalendlySyncService();
    
    // Sync mit zukünftigen Events (180 Tage voraus für Forecast - mehr Zeitraum)
    const syncedCount = await calendlySync.syncCalendlyEvents(parseInt(daysBack), 180);
    
    res.json({ 
      success: true, 
      message: `Calendly-Synchronisation abgeschlossen: ${syncedCount} Events synchronisiert`,
      syncedCount 
    });
  } catch (error) {
    console.error('Fehler bei /api/calendly/sync:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/calendly/stats - Calendly Event Statistiken
router.get('/calendly/stats', async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (startDate) {
      whereClause += ' AND start_time >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      whereClause += ' AND start_time <= ?';
      params.push(endDate);
    }
    
    if (userId) {
      whereClause += ' AND user_id = ?';
      params.push(userId);
    }
    
    // Gesamt-Statistiken
    const totalStatsQuery = `
      SELECT 
        COUNT(*) as totalEvents,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeEvents,
        SUM(CASE WHEN status = 'canceled' THEN 1 ELSE 0 END) as canceledEvents,
        COUNT(DISTINCT invitee_email) as uniqueClients
      FROM calendly_events
      ${whereClause}
    `;
    
    const totalStats = await dbGet(totalStatsQuery, params);
    
    // Event Types
    const eventTypesQuery = `
      SELECT 
        event_type_name as event_name,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'canceled' THEN 1 ELSE 0 END) as canceled
      FROM calendly_events
      ${whereClause}
      GROUP BY event_type_name
      ORDER BY count DESC
    `;
    
    const eventTypes = await dbAll(eventTypesQuery, params);
    
    // Events pro Tag
    const eventsByDayQuery = `
      SELECT 
        DATE(start_time) as date,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'canceled' THEN 1 ELSE 0 END) as canceled
      FROM calendly_events
      ${whereClause}
      GROUP BY DATE(start_time)
      ORDER BY date DESC
      LIMIT 90
    `;
    
    const eventsByDay = await dbAll(eventsByDayQuery, params);
    
    // Best Time (Stunde)
    const bestTimeQuery = `
      SELECT 
        CAST(strftime('%H', start_time) AS INTEGER) as hour,
        COUNT(*) as totalEvents,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active
      FROM calendly_events
      ${whereClause}
      GROUP BY hour
      HAVING totalEvents >= 2
      ORDER BY totalEvents DESC
    `;
    
    const bestTime = await dbAll(bestTimeQuery, params);
    
    // Wochentag-Analyse
    const weekdayQuery = `
      SELECT 
        CASE CAST(strftime('%w', start_time) AS INTEGER)
          WHEN 0 THEN 'Sunday'
          WHEN 1 THEN 'Monday'
          WHEN 2 THEN 'Tuesday'
          WHEN 3 THEN 'Wednesday'
          WHEN 4 THEN 'Thursday'
          WHEN 5 THEN 'Friday'
          WHEN 6 THEN 'Saturday'
        END as weekday,
        COUNT(*) as count
      FROM calendly_events
      ${whereClause}
      GROUP BY strftime('%w', start_time)
      ORDER BY CAST(strftime('%w', start_time) AS INTEGER)
    `;
    
    const weekdayStats = await dbAll(weekdayQuery, params);
    
    res.json({
      totalEvents: totalStats?.totalEvents || 0,
      activeEvents: totalStats?.activeEvents || 0,
      canceledEvents: totalStats?.canceledEvents || 0,
      uniqueClients: totalStats?.uniqueClients || 0,
      cancelRate: totalStats?.totalEvents > 0 
        ? Math.round((totalStats.canceledEvents / totalStats.totalEvents) * 100 * 10) / 10 
        : 0,
      eventTypes,
      eventsByDay,
      bestTime,
      weekdayStats
    });
  } catch (error) {
    console.error('Fehler bei /api/calendly/stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/calendly/events - Liste aller Calendly Events
router.get('/calendly/events', async (req, res) => {
  try {
    const { startDate, endDate, userId, limit = 100, offset = 0 } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (startDate) {
      whereClause += ' AND start_time >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      whereClause += ' AND start_time <= ?';
      params.push(endDate);
    }
    
    if (userId) {
      whereClause += ' AND user_id = ?';
      params.push(userId);
    }
    
    const query = `
      SELECT 
        ce.*,
        u.name as host_name,
        l.close_lead_id as lead_close_id,
        l.email as lead_email
      FROM calendly_events ce
      LEFT JOIN users u ON ce.user_id = u.id
      LEFT JOIN leads l ON ce.lead_id = l.id
      ${whereClause}
      ORDER BY ce.start_time DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(parseInt(limit), parseInt(offset));
    
    const events = await dbAll(query, params);
    
    res.json(events);
  } catch (error) {
    console.error('Fehler bei /api/calendly/events:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/calendly/host-stats - Statistiken pro Host/Berater
router.get('/calendly/host-stats', async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (startDate) {
      whereClause += ' AND start_time >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      whereClause += ' AND start_time <= ?';
      params.push(endDate);
    }
    
    if (userId) {
      whereClause += ' AND user_id = ?';
      params.push(userId);
    }
    
    const query = `
      SELECT 
        COALESCE(u.name, ce.host_name, 'Unbekannt') as host_name,
        ce.user_id,
        COUNT(*) as totalEvents,
        SUM(CASE WHEN ce.status = 'active' THEN 1 ELSE 0 END) as activeEvents,
        SUM(CASE WHEN ce.status = 'canceled' THEN 1 ELSE 0 END) as canceledEvents,
        COUNT(DISTINCT ce.invitee_email) as uniqueClients,
        CAST(SUM(CASE WHEN ce.status = 'canceled' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100 as cancelRate
      FROM calendly_events ce
      LEFT JOIN users u ON ce.user_id = u.id
      ${whereClause}
      GROUP BY ce.user_id, ce.host_name, u.name
      HAVING COUNT(*) > 0
      ORDER BY totalEvents DESC
    `;
    
    const results = await dbAll(query, params);
    
    // Formatiere Ergebnisse
    const hostStats = results.map(row => ({
      hostName: row.host_name,
      userId: row.user_id,
      totalEvents: row.totalEvents || 0,
      activeEvents: row.activeEvents || 0,
      canceledEvents: row.canceledEvents || 0,
      uniqueClients: row.uniqueClients || 0,
      cancelRate: row.cancelRate ? Math.round(row.cancelRate * 10) / 10 : 0
    }));
    
    res.json(hostStats);
  } catch (error) {
    console.error('Fehler bei /api/calendly/host-stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// CUSTOM ACTIVITIES API ENDPOINTS
// ========================================

// Activity Type Konfiguration
const ACTIVITY_TYPES = {
  vorqualifizierung: {
    id: 'actitype_1H3wPemMNkfkmT0nJuEBUT',
    dbType: 'vorqualifizierung',
    resultField: 'cf_xnH96817ih93fVQRG75NuqlCTJCNTkJ0OHCuup2iPLg',
    possibleResults: [
      'Qualifiziert → Erstgespräch buchen',
      'Unqualifiziert',
      'Follow-up nötig',
      'Nicht erreicht',
      'Kein Interesse'
    ]
  },
  erstgespraech: {
    id: 'actitype_6VB2MiuFziQxyuzfMzHy7q',
    dbType: 'erstgespraech',
    resultField: 'cf_QDWQYVNx3jMp1Pv0SIvzeoDigjMulHFh5qJQwWcesGZ',
    possibleResults: [
      'Stattgefunden',
      'Ausgefallen (Kunde)',
      'Ausgefallen (Berater)',
      'Verschoben',
      'No-Show'
    ]
  },
  konzeptgespraech: {
    id: 'actitype_6ftbHtxSEz9wIwdLnovYP0',
    dbType: 'konzeptgespraech', // Muss mit typeKey übereinstimmen (wird so in DB gespeichert)
    resultField: 'cf_XqpdiUMWiYCaw5uW9DRkSiXlOgBrdZtdEf2L8XmjNhT',
    possibleResults: [
      'Stattgefunden',
      'Ausgefallen (Kunde)',
      'Ausgefallen (Berater)',
      'Verschoben',
      'No-Show'
    ]
  },
  umsetzungsgespraech: {
    id: 'actitype_6nwTHKNbqf3EbQIjORgPg5',
    dbType: 'umsetzungsgespraech', // Muss mit typeKey übereinstimmen (wird so in DB gespeichert)
    resultField: 'cf_bd4BlLaCpH6uyfldREh1t9MAv7OCRcrZ5CxzJbpUIJf',
    possibleResults: [
      'Abgeschlossen (Won) ✅',
      'Abgelehnt (Lost) ❌',
      'Bedenkzeit',
      'Verschoben',
      'No-Show',
      'Neuer Closing Termin notwendig'
    ]
  },
  servicegespraech: {
    id: 'actitype_7dOp29fi26OKZQeXd9bCYP',
    dbType: 'servicegespraech', // Muss mit typeKey übereinstimmen (wird so in DB gespeichert)
    resultField: 'cf_PZvw6SxG2UlSSQNQeDmu63gdMTDP24JG6kfxWB8RXH4',
    possibleResults: [
      'Stattgefunden',
      'Cross-Sell identifiziert',
      'Ausgefallen',
      'Verschoben'
    ]
  }
};

// GET /api/custom-activities/stats - Statistiken (neue robuste Methode)
router.get('/custom-activities/stats', async (req, res) => {
  try {
    const { startDate, endDate, userId, activityType } = req.query;
    
    let query = `
      SELECT 
        activity_type,
        result_value,
        COUNT(*) as count,
        COUNT(calendly_event_id) as matched,
        COUNT(*) - COUNT(calendly_event_id) as unmatched
      FROM custom_activities
      WHERE 1=1
    `;
    
    const params = [];
    
    if (startDate) {
      query += ' AND DATE(date_created) >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND DATE(date_created) <= ?';
      params.push(endDate);
    }
    
    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }
    
    if (activityType) {
      query += ' AND activity_type = ?';
      params.push(activityType);
    }
    
    query += ' GROUP BY activity_type, result_value';
    
    const results = await dbAll(query, params);
    
    // Aggregiere pro Type
    const byType = {};
    results.forEach(row => {
      if (!byType[row.activity_type]) {
        byType[row.activity_type] = {
          total: 0,
          matched: 0,
          unmatched: 0,
          results: {}
        };
      }
      
      byType[row.activity_type].total += row.count;
      byType[row.activity_type].matched += row.matched;
      byType[row.activity_type].unmatched += row.unmatched;
      byType[row.activity_type].results[row.result_value || 'Nicht ausgefüllt'] = row.count;
    });
    
    res.json(byType);
  } catch (error) {
    console.error('Error fetching custom activities stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/custom-activities/stats (Legacy - für Backward Compatibility)
router.get('/custom-activities/stats-legacy', async (req, res) => {
  try {
    const { startDate, endDate, userId, activityType } = req.query;
    const closeApi = new CloseApiService();

    let activities = [];

    // Hole Custom Activities für jeden Type
    for (const [typeName, typeConfig] of Object.entries(ACTIVITY_TYPES)) {
      if (activityType && activityType !== typeName) continue;

      const filters = {
        _type: 'CustomActivity',
        custom_activity_type_id: typeConfig.id
      };

      if (startDate) {
        filters.date_created__gte = startDate;
      }
      if (endDate) {
        filters.date_created__lte = endDate;
      }

      const typeActivities = await closeApi.getCustomActivitiesWithFilters(filters);

      // Parse Ergebnis-Feld
      const parsedActivities = typeActivities.map(activity => {
        const resultFieldKey = `custom.${typeConfig.resultField}`;
        const result = activity[resultFieldKey] || activity.custom?.[typeConfig.resultField] || 'Nicht ausgefüllt';

        return {
          ...activity,
          type: typeName,
          result: result,
          user_id: activity.created_by || activity.user_id || activity.user?.id || null,
          lead_id: activity.lead_id || activity.lead?.id || null,
          date_created: activity.date_created || activity.created || activity.activity_at
        };
      });

      activities.push(...parsedActivities);
    }

    // Filtere nach userId falls angegeben
    if (userId) {
      activities = activities.filter(a => a.user_id === userId);
    }

    // Aggregiere Statistiken
    const stats = {
      total: activities.length,
      byType: {},
      byResult: {},
      byAdvisor: {}
    };

    // Gruppiere nach Type
    activities.forEach(activity => {
      const type = activity.type;
      if (!stats.byType[type]) {
        stats.byType[type] = { total: 0, results: {} };
      }
      stats.byType[type].total++;

      const result = activity.result;
      if (!stats.byType[type].results[result]) {
        stats.byType[type].results[result] = 0;
      }
      stats.byType[type].results[result]++;

      // Gruppiere nach Result (global)
      if (!stats.byResult[result]) {
        stats.byResult[result] = 0;
      }
      stats.byResult[result]++;

      // Gruppiere nach Berater
      const advisorId = activity.user_id || 'unbekannt';
      if (!stats.byAdvisor[advisorId]) {
        stats.byAdvisor[advisorId] = { total: 0, byType: {} };
      }
      stats.byAdvisor[advisorId].total++;
      
      if (!stats.byAdvisor[advisorId].byType[type]) {
        stats.byAdvisor[advisorId].byType[type] = 0;
      }
      stats.byAdvisor[advisorId].byType[type]++;
    });

    res.json(stats);
  } catch (error) {
    console.error('Fehler bei /api/custom-activities/stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/custom-activities/by-type
router.get('/custom-activities/by-type', async (req, res) => {
  try {
    const { activityType, startDate, endDate, userId, useCache = 'true' } = req.query;

    console.log('[API] /custom-activities/by-type request:', { activityType, startDate, endDate, userId, useCache });
    console.log('[API] Available activity types:', Object.keys(ACTIVITY_TYPES));

    if (!activityType || !ACTIVITY_TYPES[activityType]) {
      return res.status(400).json({ 
        error: 'Ungültiger activityType. Mögliche Werte: ' + Object.keys(ACTIVITY_TYPES).join(', ')
      });
    }

    const typeConfig = ACTIVITY_TYPES[activityType];
    console.log('[API] Type config:', { activityType, dbType: typeConfig.dbType, id: typeConfig.id });
    
    // Prüfe ob wir aus DB lesen sollen (useCache !== 'false')
    if (useCache !== 'false') {
        // Lese aus lokaler DB
        let whereClause = 'WHERE activity_type = ?';
        const params = [typeConfig.dbType];

        if (startDate) {
          whereClause += ' AND date_created >= ?';
          params.push(startDate);
        }
        if (endDate) {
          whereClause += ' AND date_created <= ?';
          params.push(endDate);
        }

        // Performance: Für letzte 30/90 Tage schnell, alles darüber langsamer
        const daysDiff = startDate ? Math.floor((new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24)) : 0;
        const limitClause = daysDiff <= 90 ? '' : 'LIMIT 10000'; // Max 10000 für ältere Daten
        
        console.log('[API] Query params:', params);
        console.log('[API] WHERE clause:', whereClause);
        
        const dbActivities = await dbAll(`
        SELECT 
          ca.*,
          l.close_lead_id,
          COALESCE(ca.lead_email, l.email) as lead_email,
          u.name as user_name,
          ca.result_value
        FROM custom_activities ca
        LEFT JOIN leads l ON ca.lead_id = l.close_lead_id OR CAST(ca.lead_id AS INTEGER) = l.id
        LEFT JOIN users u ON ca.user_id = u.close_user_id
        ${whereClause}
        ORDER BY ca.date_created DESC
        ${limitClause}
        `, params);

        console.log('[API] Found activities in DB:', dbActivities.length);
        if (dbActivities.length > 0) {
          console.log('[API] Sample activity:', {
            activity_type: dbActivities[0].activity_type,
            lead_email: dbActivities[0].lead_email,
            result_value: dbActivities[0].result_value,
            date_created: dbActivities[0].date_created
          });
        }

        // Parse für Frontend
        const parsedActivities = dbActivities.map(activity => {
        // Prüfe result_value (ergebnis existiert nicht mehr in der neuen DB-Struktur)
        const result = activity.result_value || 'Nicht ausgefüllt';
        return {
          id: activity.close_activity_id,
          type: activityType,
          result: result,
          user_id: activity.user_id, // Close User ID
          user_email: activity.user_email,
          lead_id: activity.lead_close_id || activity.close_lead_id || activity.lead_id, // Close Lead ID
          lead_db_id: activity.lead_id, // DB Lead ID (für Matching)
          lead: {
            id: activity.lead_close_id || activity.close_lead_id || activity.lead_id,
            email: activity.lead_email
          },
          date_created: activity.date_created || activity.created_at,
          activity_date: activity.date_created, // Alias für Kompatibilität
          created: activity.date_created,
          activity_at: activity.date_created
        };
        });

        // Filtere nach userId falls angegeben
        let filtered = parsedActivities;
        if (userId) {
          filtered = parsedActivities.filter(a => a.user_id === parseInt(userId));
        }

        console.log('[API] Returning activities:', { 
          activityType, 
          total: filtered.length, 
          dbType: typeConfig.dbType,
          dbActivitiesCount: dbActivities.length,
          filteredCount: filtered.length
        });
        
        return res.json({
          activityType,
          total: filtered.length,
          activities: filtered,
          source: 'database',
          debug: {
            dbType: typeConfig.dbType,
            dbActivitiesCount: dbActivities.length,
            filteredCount: filtered.length
          }
        });
      } else {
      // Fallback: Lade direkt von Close API (wenn useCache=false)
      const closeApi = new CloseApiService();
      const filters = {
        _type: 'CustomActivity',
        custom_activity_type_id: typeConfig.id
      };

      if (startDate) {
        filters.date_created__gte = startDate;
      }
      if (endDate) {
        filters.date_created__lte = endDate;
      }

      const activities = await closeApi.getCustomActivitiesWithFilters(filters);

      // Parse Ergebnis-Feld
      const activitiesWithLeadIds = activities.map(activity => {
        const resultFieldKey = `custom.${typeConfig.resultField}`;
        const result = activity[resultFieldKey] || activity.custom?.[typeConfig.resultField] || 'Nicht ausgefüllt';
        const leadId = activity.lead_id || activity.lead?.id || null;
        return { activity, result, leadId };
      });

      // Hole alle Lead-E-Mails auf einmal (Batch-Query für Performance)
      const uniqueLeadIds = [...new Set(activitiesWithLeadIds.map(a => a.leadId).filter(Boolean))];
      let leadEmailMap = {};
      
      if (uniqueLeadIds.length > 0) {
        try {
          const placeholders = uniqueLeadIds.map(() => '?').join(',');
          const leads = await dbAll(
            `SELECT close_lead_id, email FROM leads WHERE close_lead_id IN (${placeholders})`,
            uniqueLeadIds
          );
          leadEmailMap = leads.reduce((map, lead) => {
            map[lead.close_lead_id] = lead.email;
            return map;
          }, {});
        } catch (dbError) {
          console.warn(`[API] Fehler beim Holen der Lead-E-Mails:`, dbError.message);
        }
      }

      // Parse Activities mit E-Mails
      const parsedActivities = activitiesWithLeadIds.map(({ activity, result, leadId }) => {
        let leadEmail = activity.lead?.email || activity.invitee_email || null;
        
        // Wenn E-Mail fehlt, hole sie aus der Map
        if (!leadEmail && leadId && leadEmailMap[leadId]) {
          leadEmail = leadEmailMap[leadId];
        }

        return {
          id: activity.id,
          type: activityType,
          result: result,
          user_id: activity.created_by || activity.user_id || activity.user?.id || null,
          lead_id: leadId, // Close Lead ID
          lead: {
            id: leadId,
            email: leadEmail
          },
          date_created: activity.date_created || activity.created || activity.activity_at,
          ...activity
        };
      });

      // Filtere nach userId falls angegeben
      let filtered = parsedActivities;
      if (userId) {
        filtered = parsedActivities.filter(a => a.user_id === userId);
      }

        res.json({
          activityType,
          total: filtered.length,
          activities: filtered
        });
      }
  } catch (error) {
    console.error('Fehler bei /api/custom-activities/by-type:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/custom-activities/advisor-completion
router.get('/custom-activities/advisor-completion', async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate und endDate sind erforderlich' });
    }

    // 1. Hole Calendly Termine (geplant)
    let calendlyWhereClause = 'WHERE DATE(ce.start_time) BETWEEN ? AND ? AND ce.status = ?';
    const calendlyParams = [startDate, endDate, 'active'];
    
    if (userId) {
      calendlyWhereClause += ' AND ce.user_id = ?';
      calendlyParams.push(userId);
    }
    
    const calendlyEvents = await dbAll(`
      SELECT 
        ce.user_id,
        u.name as host_name,
        ce.event_type_name as event_name,
        COUNT(*) as planned_appointments
      FROM calendly_events ce
      LEFT JOIN users u ON ce.user_id = u.id
      ${calendlyWhereClause}
      GROUP BY ce.user_id, u.name, ce.event_type_name
    `, calendlyParams);

    // 2. Hole Custom Activities aus DB
    // WICHTIG: Zähle ALLE Activities, die einem Calendly Event zugeordnet sind (über calendly_event_id)
    // ODER die im Zeitraum erstellt wurden UND einem User zugeordnet sind
    let activitiesWhereClause = `WHERE (
      ca.calendly_event_id IS NOT NULL 
      OR (ca.date_created >= ? AND ca.date_created <= ?)
    )`;
    const activitiesParams = [startDate, endDate];
    
    if (userId) {
      // Hole Close User ID für diesen User
      const user = await dbGet('SELECT close_user_id FROM users WHERE id = ?', [userId]);
      if (user?.close_user_id) {
        // Verwende Close User ID für Filterung
        activitiesWhereClause += ' AND ca.user_id = ?';
        activitiesParams.push(user.close_user_id);
      } else {
        // Wenn kein Close User ID gefunden, keine Activities zurückgeben
        activitiesWhereClause += ' AND 1=0';
      }
    }
    
    // Hole auch Calendly Events im Zeitraum, um die zugeordneten Activities zu finden
    let calendlyEventsForActivities = [];
    if (!userId) {
      // Hole alle Calendly Events im Zeitraum
      calendlyEventsForActivities = await dbAll(`
        SELECT id, user_id, start_time
        FROM calendly_events
        WHERE DATE(start_time) BETWEEN ? AND ? AND status = 'active'
      `, [startDate, endDate]);
    } else {
      calendlyEventsForActivities = await dbAll(`
        SELECT id, user_id, start_time
        FROM calendly_events
        WHERE DATE(start_time) BETWEEN ? AND ? AND status = 'active' AND user_id = ?
      `, [startDate, endDate, userId]);
    }
    
    const calendlyEventIds = calendlyEventsForActivities.map(e => e.id);
    
    // Erweitere Query: Hole Activities die entweder:
    // 1. Einem Calendly Event im Zeitraum zugeordnet sind (calendly_event_id)
    // 2. ODER im Zeitraum erstellt wurden
    const dbActivities = await dbAll(`
      SELECT DISTINCT
        ca.user_id as close_user_id,
        ca.activity_type,
        ca.result_value as ergebnis,
        ca.date_created,
        ca.lead_id,
        ca.close_activity_id,
        ca.calendly_event_id
      FROM custom_activities ca
      WHERE (
        ca.calendly_event_id IN (${calendlyEventIds.length > 0 ? calendlyEventIds.map(() => '?').join(',') : "'NO_EVENTS'"})
        OR (ca.date_created >= ? AND ca.date_created <= ?)
      )
      ${userId ? 'AND ca.user_id = (SELECT close_user_id FROM users WHERE id = ?)' : ''}
    `, [
      ...(calendlyEventIds.length > 0 ? calendlyEventIds : []),
      startDate,
      endDate,
      ...(userId ? [userId] : [])
    ]);
    
    console.log(`[API] advisor-completion: ${dbActivities.length} Custom Activities aus DB geladen (${calendlyEventIds.length} Calendly Events im Zeitraum) für userId=${userId || 'all'}`);
    
    // Mappe DB Activities zu erwartetem Format
    const allActivities = dbActivities.map(a => {
      // Finde Activity Type Name
      const typeEntry = Object.entries(ACTIVITY_TYPES).find(([_, config]) => 
        config.id === a.activity_type
      );
      const typeName = typeEntry ? typeEntry[0] : 'unknown';
      
      return {
        type: typeName,
        user_id: a.close_user_id, // Close User ID (nicht DB User ID!)
        result: a.ergebnis,
        lead_id: a.lead_id,
        activity_id: a.close_activity_id
      };
    });
    
    // Fallback: Wenn keine DB Activities gefunden und userId gesetzt, versuche Close API
    // (nur für Debugging - normalerweise sollten alle Activities in DB sein)
    if (allActivities.length === 0 && userId) {
      console.warn('[API] Keine Activities in DB gefunden, versuche Close API...');
      const closeApi = new CloseApiService();
      
      for (const [typeName, typeConfig] of Object.entries(ACTIVITY_TYPES)) {
        const filters = {
          _type: 'CustomActivity',
          custom_activity_type_id: typeConfig.id,
          date_created__gte: startDate,
          date_created__lte: endDate
        };
        
        // Hole Close User ID für Filter
        const user = await dbGet('SELECT close_user_id FROM users WHERE id = ?', [userId]);
        if (user?.close_user_id) {
          filters.created_by = user.close_user_id;
        }

        const activities = await closeApi.getCustomActivitiesWithFilters(filters);

        activities.forEach(a => {
          const resultFieldKey = `custom.${typeConfig.resultField}`;
          const result = a[resultFieldKey] || a.custom?.[typeConfig.resultField] || null;

          allActivities.push({
            type: typeName,
            user_id: a.created_by || a.user_id || a.user?.id || null,
            result: result
          });
        });
      }
    }

    // 3. Hole User-Mapping (Close User ID -> DB User ID)
    const users = await dbAll(`
      SELECT id, close_user_id, name
      FROM users
      WHERE close_user_id IS NOT NULL
    `);

    const userMapping = {};
    users.forEach(user => {
      userMapping[user.close_user_id] = user.id;
    });

    // 4. Erstelle Mapping: Calendly Event ID -> User ID
    const eventToUserMap = {};
    calendlyEventsForActivities.forEach(e => {
      if (e.id) {
        eventToUserMap[e.id] = e.user_id;
      }
    });
    
    // 5. Merge: Termine vs. Activities
    // Gruppiere zuerst nach User
    const userStats = {};
    
    // Zähle geplante Termine pro User
    calendlyEvents.forEach(event => {
      const eventUserId = event.user_id;
      if (!userStats[eventUserId]) {
        const eventUser = users.find(u => u.id === eventUserId);
        userStats[eventUserId] = {
          advisor: event.host_name || 'Unbekannt',
          user_id: eventUserId,
          close_user_id: eventUser?.close_user_id,
          planned: 0,
          completed: 0
        };
      }
      userStats[eventUserId].planned += event.planned_appointments || 0;
    });
    
    // Zähle dokumentierte Activities pro User
    dbActivities.forEach(activity => {
      let matchedUserId = null;
      
      // Wenn Activity einem Event zugeordnet ist, nutze das Event's User ID
      if (activity.calendly_event_id && eventToUserMap[activity.calendly_event_id]) {
        matchedUserId = eventToUserMap[activity.calendly_event_id];
      } else {
        // Sonst: Finde User über Close User ID
        const matchedUser = users.find(u => u.close_user_id === activity.close_user_id);
        matchedUserId = matchedUser?.id;
      }
      
      if (matchedUserId && userStats[matchedUserId]) {
        userStats[matchedUserId].completed++;
      } else if (matchedUserId) {
        // User hat Events aber noch keine Stats - erstelle Eintrag
        const matchedUser = users.find(u => u.id === matchedUserId);
        userStats[matchedUserId] = {
          advisor: matchedUser?.name || 'Unbekannt',
          user_id: matchedUserId,
          close_user_id: matchedUser?.close_user_id,
          planned: 0,
          completed: 1
        };
      }
    });
    
    // Konvertiere zu Array
    const advisorCompletion = Object.values(userStats).map(stats => {
      const completionRate = stats.planned > 0 
        ? Math.round((stats.completed / stats.planned) * 100 * 10) / 10 
        : (stats.completed > 0 ? 100 : 0); // Wenn nur dokumentierte vorhanden, dann 100%
      
      console.log(`[API] advisor-completion: ${stats.advisor} (DB ID: ${stats.user_id}, Close ID: ${stats.close_user_id}) hat ${stats.completed} dokumentierte von ${stats.planned} geplanten (${completionRate}%)`);

      return {
        advisor: stats.advisor,
        user_id: stats.user_id,
        planned: stats.planned,
        completed: stats.completed,
        completionRate: completionRate,
        missing: Math.max(0, stats.planned - stats.completed),
        activities: [] // Wird nicht mehr benötigt
      };
    });

    // Gruppiere nach Advisor (falls mehrere Event-Types pro Advisor)
    const grouped = {};
    advisorCompletion.forEach(item => {
      const key = item.user_id || item.advisor;
      if (!grouped[key]) {
        grouped[key] = {
          advisor: item.advisor,
          user_id: item.user_id,
          planned: 0,
          completed: 0,
          missing: 0,
          activities: []
        };
      }
      grouped[key].planned += item.planned;
      grouped[key].completed += item.completed;
      grouped[key].missing += item.missing;
      grouped[key].activities.push(...item.activities);
    });

    const result = Object.values(grouped).map(item => ({
      ...item,
      completionRate: item.planned > 0 
        ? Math.round((item.completed / item.planned) * 100 * 10) / 10 
        : 0
    }));

    res.json(result);
  } catch (error) {
    console.error('Fehler bei /api/custom-activities/advisor-completion:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sync/custom-activities - Sync Custom Activities mit Server-Sent Events (SSE) für Fortschritt
router.post('/sync/custom-activities', async (req, res) => {
  try {
    const { daysBack = 90, useSSE = false } = req.body;
    
    // Wenn SSE gewünscht, verwende Server-Sent Events
    if (useSSE) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
      
      const CustomActivitiesSyncService = require('../services/customActivitiesSyncService');
      const syncService = new CustomActivitiesSyncService();
      
      console.log(`[API] Starte Custom Activities Sync mit SSE (${daysBack} Tage zurück)...`);
      
      // Progress Callback
      const progressCallback = (progress) => {
        res.write(`data: ${JSON.stringify(progress)}\n\n`);
      };
      
      try {
        const result = await syncService.syncAllCustomActivities(daysBack, progressCallback);
        
        // Finale Nachricht
        res.write(`data: ${JSON.stringify({
          type: 'complete',
          success: true,
          synced: result.synced,
          matched: result.matched,
          found: result.found,
          processed: result.processed,
          message: `${result.synced} custom activities synced, ${result.matched} matched to events`
        })}\n\n`);
        
        res.end();
      } catch (error) {
        res.write(`data: ${JSON.stringify({
          type: 'error',
          error: error.message
        })}\n\n`);
        res.end();
      }
    } else {
      // Normale JSON-Antwort (für Kompatibilität)
      const CustomActivitiesSyncService = require('../services/customActivitiesSyncService');
      const syncService = new CustomActivitiesSyncService();
      
      console.log(`[API] Starte Custom Activities Sync (${daysBack} Tage zurück)...`);
      
      const result = await syncService.syncAllCustomActivities(daysBack);
      
      res.json({ 
        success: true, 
        synced: result.synced,
        matched: result.matched,
        found: result.found,
        processed: result.processed,
        message: `${result.synced} custom activities synced, ${result.matched} matched to events`
      });
    }
  } catch (error) {
    console.error('Error syncing custom activities:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message, stack: error.stack });
    }
  }
});

// POST /api/custom-activities/sync - Alias für /sync/custom-activities (für Frontend-Kompatibilität)
router.post('/custom-activities/sync-new', async (req, res) => {
  try {
    const { daysBack = 90 } = req.body;
    
    const CustomActivitiesSyncService = require('../services/customActivitiesSyncService');
    const syncService = new CustomActivitiesSyncService();
    
    console.log(`[API] Starte Custom Activities Sync (${daysBack} Tage zurück)...`);
    
    const result = await syncService.syncAllCustomActivities(daysBack);
    
    res.json({ 
      success: true, 
      synced: result.synced,
      matched: result.matched,
      message: `${result.synced} custom activities synced, ${result.matched} matched to events`
    });
  } catch (error) {
    console.error('Error syncing custom activities:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// POST /api/custom-activities/sync - Synchronisiere ALLE Custom Activities (neue robuste Methode)
// Unterstützt sowohl normale JSON-Antwort als auch SSE für Fortschritt
router.post('/custom-activities/sync', async (req, res) => {
  try {
    const { daysBack = 90, useSSE = false } = req.body;
    
    // Wenn SSE gewünscht, verwende Server-Sent Events
    if (useSSE) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      
      const CustomActivitiesSyncService = require('../services/customActivitiesSyncService');
      const syncService = new CustomActivitiesSyncService();
      
      console.log(`[API] Starte Custom Activities Sync mit SSE (${daysBack} Tage zurück)...`);
      
      const progressCallback = (progress) => {
        res.write(`data: ${JSON.stringify(progress)}\n\n`);
      };
      
      try {
        const result = await syncService.syncAllCustomActivities(daysBack, progressCallback);
        
        res.write(`data: ${JSON.stringify({
          type: 'complete',
          success: true,
          synced: result.synced,
          matched: result.matched,
          found: result.found,
          processed: result.processed,
          message: `${result.synced} custom activities synced, ${result.matched} matched to events`
        })}\n\n`);
        
        res.end();
      } catch (error) {
        res.write(`data: ${JSON.stringify({
          type: 'error',
          error: error.message
        })}\n\n`);
        res.end();
      }
    } else {
      // Normale JSON-Antwort
      const CustomActivitiesSyncService = require('../services/customActivitiesSyncService');
      const syncService = new CustomActivitiesSyncService();
      
      console.log(`[API] Starte Custom Activities Sync (${daysBack} Tage zurück)...`);
      
      const result = await syncService.syncAllCustomActivities(daysBack);
      
      res.json({ 
        success: true, 
        synced: result.synced,
        matched: result.matched,
        found: result.found,
        processed: result.processed,
        message: `${result.synced} custom activities synced, ${result.matched} matched to events`
      });
    }
  } catch (error) {
    console.error('Fehler bei /api/custom-activities/sync:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined });
    }
  }
});

// GET /api/custom-activities/overview - Übersicht: Was wurde aus vergangenen Terminen?
router.get('/custom-activities/overview', async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (startDate) {
      whereClause += ' AND ca.activity_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND ca.activity_date <= ?';
      params.push(endDate);
    }
    if (userId) {
      whereClause += ' AND ca.user_id = ?';
      params.push(userId);
    }
    
    // Hole alle Custom Activities mit Lead- und User-Info
    const activities = await dbAll(`
      SELECT 
        ca.*,
        l.close_lead_id,
        COALESCE(ca.lead_email, l.email) as lead_email,
        l.name as lead_name,
        u.name as user_name,
        u.email as user_email_from_db
      FROM custom_activities ca
      LEFT JOIN leads l ON ca.lead_id = l.id
      LEFT JOIN users u ON ca.user_id = u.close_user_id
      ${whereClause}
      ORDER BY ca.activity_date DESC
      LIMIT 1000
    `, params);
    
    // Gruppiere nach Ergebnis
    const byResult = {};
    const byType = {};
    const unmatched = [];
    
    activities.forEach(activity => {
      const result = activity.result_value || activity.ergebnis || 'Nicht ausgefüllt';
      const type = activity.activity_type || 'unbekannt';
      
      if (!byResult[result]) {
        byResult[result] = [];
      }
      byResult[result].push(activity);
      
      if (!byType[type]) {
        byType[type] = [];
      }
      byType[type].push(activity);
      
      // Prüfe ob Activity einem Calendly Event zugeordnet werden kann
      if (!activity.lead_close_id && !activity.lead_email) {
        unmatched.push(activity);
      }
    });
    
    res.json({
      total: activities.length,
      byResult: Object.keys(byResult).map(result => ({
        result,
        count: byResult[result].length,
        activities: byResult[result].slice(0, 10) // Erste 10 als Beispiel
      })),
      byType: Object.keys(byType).map(type => ({
        type,
        count: byType[type].length
      })),
      unmatched: unmatched.length,
      activities: activities.slice(0, 100) // Erste 100 für Übersicht
    });
  } catch (error) {
    console.error('Fehler bei /api/custom-activities/overview:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/custom-activities/matched - Matched Events mit Results
router.get('/custom-activities/matched', async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    
    let query = `
      SELECT 
        ce.id as event_id,
        ce.event_type_name as event_name,
        ce.event_type_name,
        ce.start_time,
        ce.host_name,
        ce.invitee_name,
        ce.invitee_email,
        ce.status as calendly_status,
        ca.activity_type,
        ca.result_value as actual_result,
        ca.date_created as activity_date,
        ca.match_confidence,
        ca.lead_email,
        ca.user_name
      FROM calendly_events ce
      INNER JOIN custom_activities ca ON ca.calendly_event_id = ce.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (startDate) {
      query += ' AND DATE(ce.start_time) >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND DATE(ce.start_time) <= ?';
      params.push(endDate);
    }
    
    if (userId) {
      query += ' AND ce.user_id = ?';
      params.push(userId);
    }
    
    query += ' ORDER BY ce.start_time DESC LIMIT 1000';
    
    const matches = await dbAll(query, params);
    res.json(matches);
  } catch (error) {
    console.error('Error fetching matched activities:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/forecast-backcast - Forecast und Backcast Daten
router.get('/forecast-backcast', async (req, res) => {
  try {
    const { startDate, endDate, forecastEndDate, userId } = req.query;
    
    // Forecast: Zukünftige Calendly Events (ab heute bis forecastEndDate oder endDate)
    const forecastEnd = forecastEndDate || endDate || null;
    let forecastWhereClause = 'WHERE ce.start_time >= datetime(\'now\') AND ce.status = \'active\'';
    const forecastParams = [];
    
    if (forecastEnd) {
      forecastWhereClause += ' AND ce.start_time <= ?';
      forecastParams.push(forecastEnd);
    }
    if (userId) {
      forecastWhereClause += ' AND ce.user_id = ?';
      forecastParams.push(parseInt(userId));
    }
    
    const forecastQuery = `
      SELECT 
        ce.*,
        u.name as host_name,
        l.close_lead_id,
        l.id as lead_db_id,
        o.value as opportunity_value,
        ce.event_type_name as event_name
      FROM calendly_events ce
      LEFT JOIN users u ON ce.user_id = u.id
      LEFT JOIN leads l ON ce.lead_id = l.id
      LEFT JOIN opportunities o ON o.lead_id = l.id AND o.status = 'open'
      ${forecastWhereClause}
      ORDER BY ce.start_time ASC
    `;
    
    const forecastEvents = await dbAll(forecastQuery, forecastParams);
    console.log(`[API] Forecast: ${forecastEvents.length} Events gefunden`);
    
    // Backcast: Vergangene Calendly Events mit Custom Activities
    let backcastWhereClause = 'WHERE ce.start_time < datetime(\'now\')';
    const backcastParams = [];
    
    if (startDate) {
      backcastWhereClause += ' AND ce.start_time >= ?';
      backcastParams.push(startDate);
    }
    if (endDate) {
      backcastWhereClause += ' AND ce.start_time <= ?';
      backcastParams.push(endDate);
    }
    if (userId) {
      backcastWhereClause += ' AND ce.user_id = ?';
      backcastParams.push(parseInt(userId));
    }
    
    const backcastQuery = `
      SELECT 
        ce.*,
        u.name as host_name,
        l.close_lead_id,
        l.id as lead_db_id,
        ca.result_value as ergebnis,
        ca.activity_type,
        ca.date_created as activity_date
      FROM calendly_events ce
      LEFT JOIN users u ON ce.user_id = u.id
      LEFT JOIN leads l ON ce.lead_id = l.id
      LEFT JOIN custom_activities ca ON (
        (ca.lead_id = l.close_lead_id OR ca.lead_id = CAST(l.id AS TEXT))
        AND ca.date_created >= datetime(ce.start_time, '-3 days')
        AND ca.date_created <= datetime(ce.start_time, '+3 days')
      )
      ${backcastWhereClause}
      ORDER BY ce.start_time DESC
    `;
    
    const backcastEvents = await dbAll(backcastQuery, backcastParams);
    console.log(`[API] Backcast: ${backcastEvents.length} Events gefunden`);
    
    res.json({
      forecast: forecastEvents,
      backcast: backcastEvents
    });
  } catch (error) {
    console.error('Fehler bei /api/forecast-backcast:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


