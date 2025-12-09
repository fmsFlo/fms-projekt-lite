import { dbAll, dbGet } from '../lib/dashboard-db'

async function debugFlorianData() {
  try {
    // 1. Hole Florian Hörning User Info
    const florian = await dbGet(`
      SELECT id, close_user_id, name
      FROM users
      WHERE name LIKE '%Florian%' OR name LIKE '%Hörning%'
    `)
    
    console.log('Florian Hörning User Info:', florian)
    
    if (!florian) {
      console.log('Florian Hörning nicht gefunden!')
      return
    }
    
    const userId = florian.id
    const closeUserId = florian.close_user_id
    
    // 2. Hole alle Calendly Events für Florian (letzte 30 Tage)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    
    const calendlyEvents = await dbAll(`
      SELECT 
        ce.id,
        ce.start_time,
        ce.invitee_name,
        ce.invitee_email,
        ce.event_type_name,
        ce.status,
        ce.user_id,
        u.name as host_name
      FROM calendly_events ce
      LEFT JOIN users u ON ce.user_id = u.id
      WHERE DATE(ce.start_time) BETWEEN ? AND ?
        AND ce.user_id = ?
        AND ce.status = 'active'
      ORDER BY ce.start_time DESC
    `, [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0], userId])
    
    console.log(`\nCalendly Events (letzte 30 Tage): ${calendlyEvents.length}`)
    
    // 3. Hole alle Custom Activities für Florian (letzte 30 Tage)
    const customActivities = await dbAll(`
      SELECT 
        ca.id,
        ca.activity_type,
        ca.result_value,
        ca.date_created,
        ca.lead_id,
        ca.calendly_event_id,
        ca.user_id as ca_user_id,
        u.name as user_name,
        u.id as user_db_id,
        u.close_user_id
      FROM custom_activities ca
      LEFT JOIN users u ON ca.user_id = u.close_user_id
      WHERE DATE(ca.date_created) BETWEEN ? AND ?
        AND (ca.user_id = ? OR u.id = ?)
      ORDER BY ca.date_created DESC
    `, [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0], closeUserId, userId])
    
    console.log(`\nCustom Activities (letzte 30 Tage): ${customActivities.length}`)
    console.log('Sample Activities:', customActivities.slice(0, 5).map((a: any) => ({
      activity_type: a.activity_type,
      result: a.result_value,
      date: a.date_created,
      calendly_event_id: a.calendly_event_id,
      user_id: a.ca_user_id,
      user_db_id: a.user_db_id,
      close_user_id: a.close_user_id
    })))
    
    // 4. Prüfe Matching
    const calendlyEventIds = calendlyEvents.map((e: any) => e.id)
    const matchedActivities = customActivities.filter((a: any) => 
      a.calendly_event_id && calendlyEventIds.includes(a.calendly_event_id)
    )
    
    console.log(`\nGematched Activities: ${matchedActivities.length}`)
    console.log(`Nicht gematched Activities: ${customActivities.length - matchedActivities.length}`)
    
    // 5. Prüfe User-Mapping
    console.log(`\nUser Mapping:`)
    console.log(`  DB User ID: ${userId}`)
    console.log(`  Close User ID: ${closeUserId}`)
    console.log(`  Activities mit close_user_id: ${customActivities.filter((a: any) => a.ca_user_id === closeUserId).length}`)
    console.log(`  Activities mit user_db_id: ${customActivities.filter((a: any) => a.user_db_id === userId).length}`)
    
    // 6. Hole auch alle Activities ohne Datumsfilter (für Vergleich)
    const allActivities = await dbAll(`
      SELECT COUNT(*) as count
      FROM custom_activities ca
      LEFT JOIN users u ON ca.user_id = u.close_user_id
      WHERE ca.user_id = ? OR u.id = ?
    `, [closeUserId, userId])
    
    console.log(`\nAlle Custom Activities (ohne Datumsfilter): ${allActivities[0]?.count || 0}`)
    
  } catch (error: any) {
    console.error('Fehler:', error.message)
    console.error(error.stack)
  }
}

debugFlorianData()



