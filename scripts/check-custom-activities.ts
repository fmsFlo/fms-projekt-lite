import { dbAll } from '../lib/dashboard-db'

async function checkCustomActivities() {
  try {
    // Hole alle Custom Activities für Florian Hörning
    const activities = await dbAll(`
      SELECT 
        ca.*,
        u.name as user_name,
        u.id as user_id,
        u.close_user_id
      FROM custom_activities ca
      LEFT JOIN users u ON ca.user_id = u.close_user_id
      WHERE u.name LIKE '%Florian%' OR u.name LIKE '%Hörning%'
      ORDER BY ca.date_created DESC
      LIMIT 50
    `)
    
    console.log('Custom Activities für Florian Hörning:', activities.length)
    console.log('Sample:', activities.slice(0, 5))
    
    // Hole auch alle Activities im letzten Monat
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    
    const recentActivities = await dbAll(`
      SELECT 
        ca.*,
        u.name as user_name
      FROM custom_activities ca
      LEFT JOIN users u ON ca.user_id = u.close_user_id
      WHERE ca.date_created >= ?
      ORDER BY ca.date_created DESC
    `, [lastMonth.toISOString().split('T')[0]])
    
    console.log('\nAlle Activities im letzten Monat:', recentActivities.length)
    
    // Gruppiere nach User
    const byUser: Record<string, number> = {}
    recentActivities.forEach((a: any) => {
      const userName = a.user_name || 'Unbekannt'
      byUser[userName] = (byUser[userName] || 0) + 1
    })
    
    console.log('\nActivities nach User:')
    Object.entries(byUser).forEach(([user, count]) => {
      console.log(`  ${user}: ${count}`)
    })
    
  } catch (error: any) {
    console.error('Fehler:', error.message)
  }
}

checkCustomActivities()

