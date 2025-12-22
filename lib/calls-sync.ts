import { CloseApiService } from './close-api'
import { prisma } from './prisma'
import { dbRun, dbGet, dbAll } from './dashboard-db'
import { randomBytes } from 'crypto'

export class CallsSyncService {
  private closeApi: CloseApiService
  private client: any

  constructor(closeApiKey: string) {
    this.closeApi = new CloseApiService(closeApiKey)
    // Zugriff auf den internen axios client
    this.client = (this.closeApi as any).client
  }

  // Hole Calls von Close API
  async getCallsFromClose(startDate?: string, endDate?: string) {
    try {
      let allCalls: any[] = []
      let hasMore = true
      let skip = 0
      const limit = 100

      const params: any = {
        _limit: limit,
        type: 'call'
      }

      if (startDate) {
        params.date_created__gte = startDate.includes('T') ? startDate : `${startDate}T00:00:00Z`
      }
      if (endDate) {
        params.date_created__lte = endDate.includes('T') ? endDate : `${endDate}T23:59:59Z`
      }

      while (hasMore) {
        if (skip > 0) {
          params._skip = skip
        }

        try {
          const response = await this.client.get('/activity/call/', { params })
          
          if (response.status === 401 || response.status === 403) {
            throw new Error(`Close API Authentifizierungsfehler (${response.status})`)
          }

          const calls = response.data?.data || []
          allCalls.push(...calls)

          hasMore = response.data?.has_more || false
          skip += limit

          // Sicherheitscheck
          if (allCalls.length >= 10000) {
            console.warn('[CallsSync] Maximale Anzahl erreicht (10000)')
            break
          }
        } catch (apiError: any) {
          console.error('[CallsSync] API Fehler:', apiError.message)
          if (apiError.response) {
            console.error('[CallsSync] Status:', apiError.response.status)
          }
          break
        }
      }

      // Transformiere Calls
      const outcomes = await this.closeApi.getOutcomes() || {}
      
      return allCalls.map((call: any) => {
        let direction = call.direction || 'outbound'
        if (call.direction === 'incoming' || call.direction === 'inbound') {
          direction = 'inbound'
        }

        const status = call.status || null
        let disposition = null
        if (call.outcome_id && outcomes[call.outcome_id]) {
          disposition = outcomes[call.outcome_id]
        }

        // Stelle sicher, dass callDate ein gültiges Date-Objekt oder ISO-String ist
        let callDate = call.date_created || call.created || call.activity_at
        if (!callDate) {
          callDate = new Date().toISOString()
        } else if (typeof callDate === 'string') {
          // Stelle sicher, dass es ein gültiger ISO-String ist
          try {
            new Date(callDate) // Validierung
          } catch (e) {
            callDate = new Date().toISOString()
          }
        } else {
          callDate = new Date(callDate).toISOString()
        }

        return {
          closeCallId: call.id,
          userCloseId: call.created_by || call.user_id || call.user?.id || null,
          leadCloseId: call.lead_id || call.lead?.id || null,
          direction: direction,
          status: status,
          disposition: disposition,
          duration: call.duration || 0,
          callDate: callDate,
          note: call.note || call.note_html || null
        }
      })
    } catch (error: any) {
      console.error('[CallsSync] Fehler beim Abrufen der Calls:', error.message)
      return []
    }
  }

  // Synchronisiere Calls in die Datenbank
  async syncCalls(daysBack = 30) {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysBack)

      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]

      console.log(`[CallsSync] Starte Sync für ${daysBack} Tage (${startDateStr} bis ${endDateStr})...`)

      // Hole Calls von Close
      const calls = await this.getCallsFromClose(startDateStr, endDateStr)
      console.log(`[CallsSync] ${calls.length} Calls von Close API abgerufen`)

      if (calls.length === 0) {
        return { synced: 0, skipped: 0, total: 0 }
      }

      let synced = 0
      let skipped = 0

      // Erstelle User-Mapping: Close User ID -> Lokale User ID
      const users = await prisma.user.findMany({
        where: { closeUserId: { not: null } },
        select: { id: true, closeUserId: true }
      })
      
      const userMap = new Map<string, string>()
      users.forEach(user => {
        if (user.closeUserId) {
          userMap.set(user.closeUserId, user.id)
        }
      })
      
      console.log(`[CallsSync] ${userMap.size} User-Mappings gefunden`)

      // Hole alle Leads aus Close (für Mapping)
      // Für jetzt: Verwende Close Lead ID direkt als leadId

      for (const call of calls) {
        try {
          // Prüfe ob Call bereits existiert
          const existing = await dbGet(
            'SELECT id FROM calls WHERE "closeCallId" = ?',
            [call.closeCallId]
          )

          // Mappe Close User ID zu lokaler User ID
          const localUserId = call.userCloseId ? userMap.get(call.userCloseId) || null : null
          
          // Setze leadId auf null, da Close Lead IDs nicht in lokaler Lead Tabelle existieren
          // (Foreign Key Constraint würde sonst fehlschlagen)
          const localLeadId = null
          
          if (existing) {
            // Update - verwende gemappte lokale User ID und null für leadId
            await dbRun(
              `UPDATE calls 
               SET "leadId" = ?, "userId" = ?, "callDate" = CAST(? AS timestamp), duration = ?, direction = ?, status = ?, disposition = ?, note = ?
               WHERE "closeCallId" = ?`,
              [
                localLeadId,
                localUserId,
                call.callDate,
                call.duration || 0,
                call.direction || null,
                call.status || null,
                call.disposition || null,
                call.note || null,
                call.closeCallId
              ]
            )
            skipped++
          } else {
            // Insert - generiere id explizit und setze createdAt/updatedAt
            // Verwende gemappte lokale User ID und null für leadId
            await dbRun(
              `INSERT INTO calls (id, "closeCallId", "leadId", "userId", "callDate", duration, direction, status, disposition, note, "createdAt", "updatedAt", "syncedAt")
               VALUES (gen_random_uuid()::text, ?, ?, ?, CAST(? AS timestamp), ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
              [
                call.closeCallId,
                localLeadId,
                localUserId,
                call.callDate,
                call.duration || 0,
                call.direction || null,
                call.status || null,
                call.disposition || null,
                call.note || null
              ]
            )
            synced++
          }
        } catch (callError: any) {
          console.error(`[CallsSync] Fehler beim Speichern von Call ${call.closeCallId}:`, callError.message)
          // Weiter mit nächstem Call
        }
      }

      console.log(`[CallsSync] ✅ ${synced} neue Calls synchronisiert, ${skipped} aktualisiert`)
      return { synced, skipped, total: calls.length }
    } catch (error: any) {
      console.error('[CallsSync] Fehler beim Synchronisieren:', error.message)
      throw error
    }
  }
}

