const express = require('express');
const router = express.Router();
const { dbGet, dbAll } = require('../database/db');

// GET /api/calendly/stats - Calendly Event Statistiken
router.get('/stats', async (req, res) => {
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
router.get('/events', async (req, res) => {
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
        u.name as host_name
      FROM calendly_events ce
      LEFT JOIN users u ON ce.user_id = u.id
      ${whereClause}
      ORDER BY ce.start_time DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);
    
    const events = await dbAll(query, params);
    
    res.json(events);
  } catch (error) {
    console.error('Fehler bei /api/calendly/events:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/calendly/comparison - Vergleich Calendly Events vs Close Activities
router.get('/comparison', async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (startDate) {
      whereClause += ' AND DATE(a.original_date) >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      whereClause += ' AND DATE(a.original_date) <= ?';
      params.push(endDate);
    }
    
    if (userId) {
      whereClause += ' AND a.user_id = ?';
      params.push(userId);
    }
    
    // Appointments aus Close (geplante Termine)
    const appointmentsQuery = `
      SELECT 
        a.appointment_type,
        COUNT(*) as planned,
        SUM(CASE WHEN a.status = 'stattgefunden' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN a.status = 'no_show' THEN 1 ELSE 0 END) as noShow,
        SUM(CASE WHEN a.status LIKE 'abgesagt%' THEN 1 ELSE 0 END) as canceled
      FROM appointments a
      ${whereClause}
      GROUP BY a.appointment_type
    `;
    
    const appointments = await dbAll(appointmentsQuery, params);
    
    // Calendly Events (tatsächlich gebuchte Termine)
    let calendlyWhereClause = 'WHERE 1=1';
    const calendlyParams = [];
    
    if (startDate) {
      calendlyWhereClause += ' AND DATE(start_time) >= ?';
      calendlyParams.push(startDate);
    }
    
    if (endDate) {
      calendlyWhereClause += ' AND DATE(start_time) <= ?';
      calendlyParams.push(endDate);
    }
    
    if (userId) {
      calendlyWhereClause += ' AND user_id = ?';
      calendlyParams.push(userId);
    }
    
    const calendlyQuery = `
      SELECT 
        mapped_type as appointment_type,
        COUNT(*) as booked,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'canceled' THEN 1 ELSE 0 END) as canceled
      FROM calendly_events
      ${calendlyWhereClause}
      GROUP BY mapped_type
    `;
    
    const calendlyEvents = await dbAll(calendlyQuery, calendlyParams);
    
    // Kombiniere beide Datensätze
    const appointmentTypes = ['erstgespraech', 'konzept', 'umsetzung', 'service', 'sonstiges'];
    const comparison = appointmentTypes.map(type => {
      const closeData = appointments.find(a => a.appointment_type === type) || {
        planned: 0,
        completed: 0,
        noShow: 0,
        canceled: 0
      };
      
      const calendlyData = calendlyEvents.find(c => c.appointment_type === type) || {
        booked: 0,
        active: 0,
        canceled: 0
      };
      
      return {
        appointmentType: type,
        close: {
          planned: closeData.planned,
          completed: closeData.completed,
          noShow: closeData.noShow,
          canceled: closeData.canceled
        },
        calendly: {
          booked: calendlyData.booked,
          active: calendlyData.active,
          canceled: calendlyData.canceled
        },
        // Vergleich: Wie viele Close Appointments haben ein Calendly Event?
        matchRate: closeData.planned > 0 
          ? Math.round((calendlyData.booked / closeData.planned) * 100) 
          : 0
      };
    });
    
    res.json(comparison);
  } catch (error) {
    console.error('Fehler bei /api/calendly/comparison:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
