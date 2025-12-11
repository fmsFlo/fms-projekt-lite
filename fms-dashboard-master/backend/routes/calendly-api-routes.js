// ========================================
// CALENDLY ENDPOINTS
// ========================================
// Diese Code-Snippets am Ende von backend/routes/api.js einfügen
// (VOR der Zeile: module.exports = router;)

// GET /api/calendly/stats - Calendly Statistiken
router.get('/calendly/stats', async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    
    let query = `
      SELECT 
        COUNT(*) as totalEvents,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeEvents,
        SUM(CASE WHEN status = 'canceled' THEN 1 ELSE 0 END) as canceledEvents,
        ROUND(
          CAST(SUM(CASE WHEN status = 'canceled' THEN 1 ELSE 0 END) AS FLOAT) / 
          NULLIF(COUNT(*), 0) * 100, 
          1
        ) as cancelRate,
        COUNT(DISTINCT invitee_email) as uniqueCustomers,
        AVG(duration_minutes) as avgDuration
      FROM calendly_events
      WHERE 1=1
    `;
    
    const params = [];
    
    if (startDate) {
      query += ' AND DATE(start_time) >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND DATE(start_time) <= ?';
      params.push(endDate);
    }
    
    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }
    
    const stats = await dbGet(query, params);
    
    // Events by Day
    let dayQuery = `
      SELECT 
        DATE(start_time) as date,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'canceled' THEN 1 ELSE 0 END) as canceled
      FROM calendly_events
      WHERE 1=1
    `;
    
    if (startDate) {
      dayQuery += ' AND DATE(start_time) >= ?';
    }
    if (endDate) {
      dayQuery += ' AND DATE(start_time) <= ?';
    }
    if (userId) {
      dayQuery += ' AND user_id = ?';
    }
    
    dayQuery += ' GROUP BY DATE(start_time) ORDER BY date';
    
    const eventsByDay = await dbAll(dayQuery, params);
    
    // Event Types
    let typeQuery = `
      SELECT 
        event_name,
        COUNT(*) as count
      FROM calendly_events
      WHERE 1=1
    `;
    
    if (startDate) {
      typeQuery += ' AND DATE(start_time) >= ?';
    }
    if (endDate) {
      typeQuery += ' AND DATE(start_time) <= ?';
    }
    if (userId) {
      typeQuery += ' AND user_id = ?';
    }
    
    typeQuery += ' GROUP BY event_name ORDER BY count DESC';
    
    const eventTypes = await dbAll(typeQuery, params);
    
    // Weekday Stats
    let weekdayQuery = `
      SELECT 
        CASE CAST(strftime('%w', start_time) AS INTEGER)
          WHEN 0 THEN 'Sonntag'
          WHEN 1 THEN 'Montag'
          WHEN 2 THEN 'Dienstag'
          WHEN 3 THEN 'Mittwoch'
          WHEN 4 THEN 'Donnerstag'
          WHEN 5 THEN 'Freitag'
          WHEN 6 THEN 'Samstag'
        END as weekday,
        CAST(strftime('%w', start_time) AS INTEGER) as weekday_order,
        COUNT(*) as count
      FROM calendly_events
      WHERE 1=1
    `;
    
    if (startDate) {
      weekdayQuery += ' AND DATE(start_time) >= ?';
    }
    if (endDate) {
      weekdayQuery += ' AND DATE(start_time) <= ?';
    }
    if (userId) {
      weekdayQuery += ' AND user_id = ?';
    }
    
    weekdayQuery += ' GROUP BY weekday, weekday_order ORDER BY weekday_order';
    
    const weekdayStats = await dbAll(weekdayQuery, params);
    
    res.json({
      ...stats,
      eventsByDay,
      eventTypes,
      weekdayStats
    });
  } catch (error) {
    console.error('Fehler bei /api/calendly/stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/calendly/events - Alle Calendly Events
router.get('/calendly/events', async (req, res) => {
  try {
    const { startDate, endDate, userId, limit = 500 } = req.query;
    
    let query = `
      SELECT 
        ce.*,
        ce.event_name as event_type_name
      FROM calendly_events ce
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
    
    query += ' ORDER BY ce.start_time DESC LIMIT ?';
    params.push(parseInt(limit));
    
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
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        host_name,
        COUNT(*) as totalEvents,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'canceled' THEN 1 ELSE 0 END) as canceled,
        ROUND(
          CAST(SUM(CASE WHEN status = 'canceled' THEN 1 ELSE 0 END) AS FLOAT) / 
          NULLIF(COUNT(*), 0) * 100, 
          1
        ) as cancelRate
      FROM calendly_events
      WHERE 1=1
    `;
    
    const params = [];
    
    if (startDate) {
      query += ' AND DATE(start_time) >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND DATE(start_time) <= ?';
      params.push(endDate);
    }
    
    query += ' GROUP BY host_name ORDER BY totalEvents DESC';
    
    const hostStats = await dbAll(query, params);
    res.json(hostStats);
  } catch (error) {
    console.error('Fehler bei /api/calendly/host-stats:', error);
    res.status(500).json({ error: error.message });
  }
});
