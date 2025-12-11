const express = require('express');
const router = express.Router();
const { dbGet, dbAll } = require('../database/db');

// GET /api/calls/stats - Kombinierte Call-Statistiken
router.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    
    // Basis-Filter für alle Queries
    let whereClause = "WHERE direction = 'outbound'";
    const params = [];
    
    if (startDate) {
      whereClause += ' AND call_date >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      whereClause += ' AND call_date <= ?';
      params.push(endDate);
    }
    
    if (userId) {
      whereClause += ' AND user_id = ?';
      params.push(userId);
    }
    
    // 1. Gesamt-Statistiken: totalCalls, reached, notReached
    // NEUE LOGIK:
    // Erreicht = status = 'completed' AND duration > 0
    // Nicht erreicht = status IN ('no_answer', 'busy', 'failed', 'canceled') 
    //                  OR (status = 'completed' AND duration = 0)
    const totalStatsQuery = `
      SELECT 
        COUNT(*) as totalCalls,
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
        END) as notReached
      FROM calls
      ${whereClause}
    `;
    
    const totalStats = await dbGet(totalStatsQuery, params);
    const totalCalls = totalStats?.totalCalls || 0;
    const reached = totalStats?.reached || 0;
    const notReached = totalStats?.notReached || 0;
    
    // Berechne reachRate
    const reachRate = totalCalls > 0 
      ? Math.round((reached / totalCalls) * 100 * 10) / 10 
      : 0;
    
    // 2. Outcomes: Array mit allen Outcomes und deren Anzahl
    const outcomesQuery = `
      SELECT 
        COALESCE(disposition, 'Unknown') as outcome,
        COUNT(*) as count
      FROM calls
      ${whereClause}
      GROUP BY disposition
      ORDER BY count DESC
    `;
    
    const outcomesRaw = await dbAll(outcomesQuery, params);
    const outcomes = outcomesRaw.map(item => ({
      outcome: item.outcome,
      count: item.count
    }));
    
    // 3. callsByHour: Beste Erreichbarkeit nach Stunde (0-23)
    const callsByHourQuery = `
      SELECT 
        CAST(strftime('%H', call_date) AS INTEGER) as hour,
        COUNT(*) as totalCalls,
        SUM(CASE 
          WHEN status = 'completed' AND duration > 0 
          THEN 1 
          ELSE 0 
        END) as reached,
        CAST(SUM(CASE 
          WHEN status = 'completed' AND duration > 0 
          THEN 1 
          ELSE 0 
        END) AS FLOAT) / COUNT(*) * 100 as successRate
      FROM calls
      ${whereClause}
      GROUP BY hour
      HAVING totalCalls >= 3
      ORDER BY successRate DESC, hour ASC
    `;
    
    const callsByHourRaw = await dbAll(callsByHourQuery, params);
    
    // Formatiere callsByHour und sortiere nach bestem successRate
    const callsByHour = callsByHourRaw.map(h => ({
      hour: h.hour,
      totalCalls: h.totalCalls,
      reached: h.reached,
      successRate: Math.round(h.successRate * 10) / 10
    })).sort((a, b) => {
      // Sortiere nach successRate (absteigend) für beste Erreichbarkeit
      if (b.successRate !== a.successRate) {
        return b.successRate - a.successRate;
      }
      // Bei gleicher successRate nach Stunde (aufsteigend)
      return a.hour - b.hour;
    });
    
    // Kombinierte Antwort
    const response = {
      totalCalls,
      reached,
      notReached,
      reachRate,
      outcomes,
      callsByHour
    };
    
    res.json(response);
  } catch (error) {
    console.error('Fehler bei /api/calls/stats:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

