import { dbAll } from '../lib/dashboard-db'

async function checkAllCalendlyEvents() {
  try {
    // Prüfe alle Calendly Events
    const allEvents = await dbAll(`
      SELECT 
        ce.id,
        ce.start_time,
        ce.invitee_name,
        ce.event_type_name,
        ce.status,
        ce.user_id,
        ce.host_name,
        u.name as user_name
      FROM calendly_events ce
      LEFT JOIN users u ON ce.user_id = u.id
      ORDER BY ce.start_time DESC
      LIMIT 50
    `)
    
    console.log(`Alle Calendly Events in DB: ${allEvents.length}`)
    
    if (allEvents.length > 0) {
      console.log('\nSample Events:')
      allEvents.slice(0, 10).forEach((e: any) => {
        console.log({
          date: e.start_time,
          invitee: e.invitee_name,
          host_name: e.host_name,
          user_id: e.user_id,
          user_name: e.user_name,
          type: e.event_type_name,
          status: e.status
        })
      })
      
      // Gruppiere nach user_id
      const byUser: Record<string, number> = {}
      allEvents.forEach((e: any) => {
        const key = e.user_id || e.host_name || 'unbekannt'
        byUser[key] = (byUser[key] || 0) + 1
      })
      
      console.log('\nEvents nach User:')
      Object.entries(byUser).forEach(([user, count]) => {
        console.log(`  ${user}: ${count}`)
      })
    }
    
    // Prüfe auch Events mit host_name "Florian"
    const florianEvents = await dbAll(`
      SELECT COUNT(*) as count
      FROM calendly_events ce
      WHERE ce.host_name LIKE '%Florian%' OR ce.host_name LIKE '%Hörning%'
    `)
    
    console.log(`\nEvents mit host_name Florian/Hörning: ${florianEvents[0]?.count || 0}`)
    
    // Prüfe alle User
    const users = await dbAll(`
      SELECT id, name, close_user_id
      FROM users
    `)
    
    console.log('\nAlle User in DB:')
    users.forEach((u: any) => {
      console.log(`  ID: ${u.id}, Name: ${u.name}, Close ID: ${u.close_user_id}`)
    })
    
  } catch (error: any) {
    console.error('Fehler:', error.message)
  }
}

checkAllCalendlyEvents()

