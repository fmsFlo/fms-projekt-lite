import { dbAll } from '../lib/dashboard-db'

async function checkCalendlyEvents() {
  try {
    // Hole Florian Hörning
    const florian = await dbAll(`
      SELECT id, close_user_id, name
      FROM users
      WHERE name LIKE '%Florian%' OR name LIKE '%Hörning%'
    `)
    
    console.log('Florian User:', florian[0])
    
    if (!florian[0]) return
    
    const userId = florian[0].id
    
    // Prüfe alle Calendly Events (ohne Datumsfilter)
    const allEvents = await dbAll(`
      SELECT 
        ce.id,
        ce.start_time,
        ce.invitee_name,
        ce.event_type_name,
        ce.status,
        ce.user_id,
        u.name as host_name
      FROM calendly_events ce
      LEFT JOIN users u ON ce.user_id = u.id
      WHERE ce.user_id = ?
      ORDER BY ce.start_time DESC
      LIMIT 50
    `, [userId])
    
    console.log(`\nAlle Calendly Events für Florian: ${allEvents.length}`)
    if (allEvents.length > 0) {
      console.log('Ältestes Event:', allEvents[allEvents.length - 1].start_time)
      console.log('Neuestes Event:', allEvents[0].start_time)
      console.log('Sample Events:', allEvents.slice(0, 5).map((e: any) => ({
        date: e.start_time,
        invitee: e.invitee_name,
        type: e.event_type_name,
        status: e.status
      })))
    }
    
    // Prüfe Events in verschiedenen Zeiträumen
    const now = new Date()
    const ranges = [
      { days: 7, label: 'Letzte 7 Tage' },
      { days: 14, label: 'Letzte 14 Tage' },
      { days: 30, label: 'Letzte 30 Tage' },
      { days: 90, label: 'Letzte 90 Tage' }
    ]
    
    console.log('\nEvents nach Zeitraum:')
    for (const range of ranges) {
      const startDate = new Date(now)
      startDate.setDate(startDate.getDate() - range.days)
      
      const events = await dbAll(`
        SELECT COUNT(*) as count
        FROM calendly_events ce
        WHERE DATE(ce.start_time) BETWEEN ? AND ?
          AND ce.user_id = ?
          AND ce.status = 'active'
      `, [startDate.toISOString().split('T')[0], now.toISOString().split('T')[0], userId])
      
      console.log(`  ${range.label}: ${events[0]?.count || 0}`)
    }
    
    // Prüfe auch alle Events (auch canceled)
    const allActiveEvents = await dbAll(`
      SELECT COUNT(*) as count
      FROM calendly_events ce
      WHERE ce.user_id = ?
        AND ce.status = 'active'
    `, [userId])
    
    console.log(`\nAlle aktiven Events (ohne Datumsfilter): ${allActiveEvents[0]?.count || 0}`)
    
  } catch (error: any) {
    console.error('Fehler:', error.message)
  }
}

checkCalendlyEvents()




