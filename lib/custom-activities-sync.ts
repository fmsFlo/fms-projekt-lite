import { CloseApiService } from './close-api'
import { prisma } from './prisma'

const ACTIVITY_TYPE_CONFIG = CloseApiService.getActivityTypeConfig()

export class CustomActivitiesSyncService {
  private closeApi: CloseApiService

  constructor(apiKey?: string) {
    this.closeApi = new CloseApiService(apiKey)
  }

  // Haupt-Sync-Funktion mit Fortschritts-Callback
  async syncAllCustomActivities(daysBack = 90, progressCallback?: (progress: any) => void) {
    console.log('\n🔄 Starte Custom Activities Sync...')
    console.log(`   Zeitraum: Letzte ${daysBack} Tage\n`)
    
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysBack)
    
    let totalSynced = 0
    let totalFound = 0
    let totalProcessed = 0
    
    // Synce jeden Activity-Type
    for (const [typeKey, typeConfig] of Object.entries(ACTIVITY_TYPE_CONFIG)) {
      console.log(`📋 Syncing ${typeConfig.name}...`)
      
      if (progressCallback) {
        progressCallback({
          type: 'type_start',
          typeName: typeConfig.name,
          typeKey
        })
      }
      
      try {
        const result = await this.syncActivityType(
          typeKey, 
          typeConfig, 
          startDate.toISOString().split('T')[0], 
          endDate.toISOString().split('T')[0],
          progressCallback
        )
        
        totalSynced += result.synced
        totalFound += result.found
        totalProcessed += result.processed
        
        console.log(`   ✅ ${result.synced} activities synced (${result.found} found, ${result.processed} processed)\n`)
        
        if (progressCallback) {
          progressCallback({
            type: 'type_complete',
            typeName: typeConfig.name,
            synced: result.synced,
            found: result.found
          })
        }
        
        // Rate limiting zwischen Types
        await new Promise(resolve => setTimeout(resolve, 500))
        
      } catch (error: any) {
        console.error(`   ❌ Error syncing ${typeConfig.name}:`, error.message)
        if (progressCallback) {
          progressCallback({
            type: 'type_error',
            typeName: typeConfig.name,
            error: error.message
          })
        }
      }
    }
    
    console.log(`\n✅ Total synced: ${totalSynced} custom activities`)
    
    if (progressCallback) {
      progressCallback({
        type: 'matching_start',
        message: 'Starte Matching mit Calendly Events...'
      })
    }
    
    // Starte Matching
    const matched = await this.matchActivitiesToCalendlyEvents()
    console.log(`\n✅ Matched ${matched} activities to Calendly events`)
    
    if (progressCallback) {
      progressCallback({
        type: 'complete',
        synced: totalSynced,
        matched,
        found: totalFound,
        processed: totalProcessed
      })
    }
    
    return { synced: totalSynced, matched, found: totalFound, processed: totalProcessed }
  }

  // Sync eines Activity-Types mit Fortschritts-Callback
  async syncActivityType(typeKey: string, typeConfig: any, startDate: string, endDate: string, progressCallback?: (progress: any) => void) {
    let activities: any[] = []
    
    try {
      // 1. Hole Activities von Close
      activities = await this.closeApi.getCustomActivitiesByType(
        typeConfig.id,
        startDate,
        endDate
      )
      
      console.log(`   → Found ${activities.length} activities in Close for ${typeConfig.name}`)
      
      if (activities.length === 0) {
        console.log(`   ⚠️  No activities found for ${typeConfig.name}`)
        return { synced: 0, found: 0, processed: 0 }
      }
    } catch (error: any) {
      console.error(`   ❌ Fehler beim Abrufen der Activities für ${typeConfig.name}:`, error.message)
      if (error.response) {
        console.error(`   Status: ${error.response.status}`)
        console.error(`   Data:`, JSON.stringify(error.response.data).substring(0, 200))
      }
      throw error // Weiterwerfen, damit der Fehler oben behandelt wird
    }
    
    let synced = 0
    let skipped = 0
    let errors = 0
    let processed = 0
    
    // 2. Verarbeite jede Activity
    for (let i = 0; i < activities.length; i++) {
      const activity = activities[i]
      processed++
      
      try {
        const wasNew = await this.saveCustomActivity(activity, typeKey, typeConfig, true) // true = incremental sync
        if (wasNew) {
          synced++
        } else {
          skipped++
        }
        
        // Fortschritt senden
        if (progressCallback) {
          progressCallback({
            type: 'progress',
            current: processed,
            total: activities.length,
            synced,
            skipped,
            typeName: typeConfig.name
          })
        }
        
        if (processed % 5 === 0) {
          console.log(`   → ${processed}/${activities.length} activities processed (${synced} synced, ${skipped} skipped)...`)
        }
        
        // Rate limiting
        if (processed % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      } catch (error: any) {
        errors++
        console.error(`   ⚠️  Error saving activity ${activity.id}:`, error.message)
      }
    }
    
    console.log(`   ✅ Synced ${synced} activities, ${skipped} skipped, ${errors} errors`)
    
    return { synced, found: activities.length, processed }
  }

  // Speichere einzelne Custom Activity (mit Incremental Sync Support)
  async saveCustomActivity(activity: any, typeKey: string, typeConfig: any, incremental = false) {
    // Extrahiere Ergebnis-Feld
    const resultValue = activity[`custom.${typeConfig.resultField}`] || 
                       activity.custom?.[typeConfig.resultField] || 
                       null
    
    // Hole Lead-Details (für E-Mail)
    let leadEmail = null
    let leadName = null
    
    if (activity.lead_id) {
      try {
        const lead = await this.closeApi.getLeadDetails(activity.lead_id)
        if (lead) {
          // E-Mail aus Kontakten
          if (lead.contacts && lead.contacts.length > 0) {
            const contact = lead.contacts[0]
            if (contact.emails && contact.emails.length > 0) {
              leadEmail = contact.emails[0].email
            }
            leadName = contact.name || lead.display_name || lead.name
          } else if (lead.emails && lead.emails.length > 0) {
            leadEmail = lead.emails[0].email
            leadName = lead.display_name || lead.name
          }
        }
      } catch (error: any) {
        console.warn(`   ⚠️  Could not fetch lead ${activity.lead_id}:`, error.message)
      }
    }
    
    // Hole User-Details (für E-Mail)
    let userEmail = null
    let userName = null
    
    const userId = activity.created_by || activity.user_id || activity.user?.id
    if (userId) {
      try {
        const user = await this.closeApi.getUserDetails(userId)
        if (user) {
          userEmail = user.email
          userName = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim()
        }
      } catch (error: any) {
        console.warn(`   ⚠️  Could not fetch user ${userId}:`, error.message)
      }
    }
    
    const activityDate = activity.date_created || activity.created || activity.activity_at || new Date()
    const activityId = `ca_${activity.id}`
    const dateUpdated = activity.date_updated ? new Date(activity.date_updated) : activityDate
    
    // Check ob bereits existiert
    const existing = await prisma.customActivity.findUnique({
      where: { closeActivityId: activity.id },
      select: { id: true, resultValue: true, dateUpdated: true }
    })
    
    if (existing) {
      // Bei Incremental Sync: Prüfe ob sich etwas geändert hat
      if (incremental) {
        const existingResult = existing.resultValue
        const existingDateUpdated = existing.dateUpdated
        
        // Prüfe ob Ergebnis oder Datum sich geändert haben
        const hasChanged = existingResult !== resultValue || 
                         (existingDateUpdated && dateUpdated && 
                          existingDateUpdated.getTime() !== dateUpdated.getTime())
        
        if (!hasChanged) {
          // Keine Änderung - skip
          return false // Nicht neu synchronisiert
        }
      }
      
      // Update
      await prisma.customActivity.update({
        where: { closeActivityId: activity.id },
        data: {
          activityType: typeKey,
          leadEmail,
          leadName,
          userEmail,
          userName,
          resultValue,
          dateUpdated,
          syncedAt: new Date()
        }
      })
      return true // Aktualisiert
    } else {
      // Insert
      await prisma.customActivity.create({
        data: {
          id: activityId,
          closeActivityId: activity.id,
          activityType: typeKey,
          activityTypeId: typeConfig.id,
          leadId: activity.lead_id,
          leadEmail,
          leadName,
          userId,
          userEmail,
          userName,
          resultFieldId: typeConfig.resultField,
          resultValue,
          dateCreated: activityDate,
          dateUpdated,
          syncedAt: new Date()
        }
      })
      return true // Neu eingefügt
    }
  }

  // Matching-Algorithmus
  async matchActivitiesToCalendlyEvents() {
    console.log('\n🔗 Matching Custom Activities zu Calendly Events...\n')
    
    // Hole alle unmatched Activities
    const activities = await prisma.customActivity.findMany({
      where: {
        calendlyEventId: null,
        leadEmail: { not: null }
      },
      orderBy: { dateCreated: 'desc' },
      take: 1000
    })
    
    console.log(`   → ${activities.length} unmatched activities`)
    
    let matched = 0
    
    for (const activity of activities) {
      const match = await this.findBestMatch(activity)
      
      if (match && match.score > 0.5) { // Nur wenn Confidence > 50%
        await this.linkActivityToEvent(activity, match)
        matched++
      }
    }
    
    console.log(`\n   ✅ Matched ${matched} activities to events`)
    
    return matched
  }

  // Finde besten Match für Activity
  async findBestMatch(activity: any) {
    // Suche Calendly-Events mit gleicher E-Mail
    // Zeitfenster: ±3 Tage um Activity-Datum
    
    if (!activity.leadEmail) return null
    
    const activityDate = new Date(activity.dateCreated)
    const beforeDate = new Date(activityDate)
    beforeDate.setDate(beforeDate.getDate() - 3)
    const afterDate = new Date(activityDate)
    afterDate.setDate(afterDate.getDate() + 3)
    
    // Hole alle Events, die bereits mit Activities verknüpft sind
    const usedEventIds = await prisma.customActivity.findMany({
      where: { calendlyEventId: { not: null } },
      select: { calendlyEventId: true }
    })
    const usedIds = usedEventIds.map(a => a.calendlyEventId).filter(Boolean) as string[]
    
    // Suche passende Events
    const candidates = await prisma.calendlyEvent.findMany({
      where: {
        inviteeEmail: { equals: activity.leadEmail, mode: 'insensitive' },
        startTime: { gte: beforeDate, lte: afterDate },
        id: { notIn: usedIds }
      },
      orderBy: { startTime: 'asc' },
      take: 5
    })
    
    if (candidates.length === 0) return null
    
    // Scoring: Je näher das Datum, desto besser
    const bestMatch = candidates[0]
    const dateDiff = Math.abs((bestMatch.startTime.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24)) // Tage
    const matchScore = Math.max(0, 1.0 - (dateDiff / 3.0)) // 0-1 Score
    
    return {
      event: bestMatch,
      score: matchScore,
      reason: `E-Mail match, ${dateDiff.toFixed(1)} Tage Differenz`
    }
  }

  // Verknüpfe Activity mit Event
  async linkActivityToEvent(activity: any, match: any) {
    await prisma.customActivity.update({
      where: { id: activity.id },
      data: {
        calendlyEventId: match.event.id,
        matchedAt: new Date(),
        matchConfidence: match.score
      }
    })
  }
}

